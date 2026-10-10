"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  TicketPercent,
  Wallet,
} from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import {
  codAllowed,
  orderTotals,
  withCoupon,
  type CouponRule,
  type Order,
  type PaymentCheckout,
  type PaymentMethod,
} from "@/lib/orders";
import { useShopping } from "./ShoppingProvider";
import { usePayment } from "./Payment";
import { bagTotals, useCheckout } from "./useCheckout";
import PriceBreakup from "./PriceBreakup";
import BagLines from "./BagLines";
import SignInPrompt from "./SignInPrompt";

const onlineMethods = [
  [Smartphone, "UPI"],
  [CreditCard, "Cards"],
  [Building2, "Net banking"],
  [Wallet, "Wallets"],
] as const;

export default function PaymentStep() {
  const { customer, ready, refresh, error: bagError } = useShopping();
  const router = useRouter();
  const { pay, dialog } = usePayment();
  const [placing, setPlacing] = useState<"" | "order" | "gateway">("");
  const { data, error: loadError } = useCheckout(placing !== "");
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  // One key per attempt: a retry or double tap returns the same order.
  const attempt = useRef("");

  const totals = useMemo(() => {
    if (!data) return null;
    const bag = bagTotals(data);
    const preview = withCoupon(
      orderTotals(data.subtotal, data.options.charges, method || "online"),
      coupon,
    );
    const codTotal = withCoupon(
      orderTotals(data.subtotal, data.options.charges, "cod"),
      coupon,
    ).total;
    return {
      ...bag,
      preview,
      codOk: codAllowed(data.options.charges, codTotal),
    };
  }, [data, method, coupon]);

  useEffect(() => {
    if (!data || !totals) return;
    if (method === "cod" && !totals.codOk)
      setMethod(data.options.online ? "online" : null);
    if (!method)
      setMethod(data.options.online ? "online" : totals.codOk ? "cod" : null);
  }, [data, totals]);
  useEffect(() => {
    if (data && !data.address) router.replace("/checkout");
  }, [data]);

  if (!ready)
    return (
      <p className="py-10 text-center text-sm">{bagError || "Loading..."}</p>
    );
  if (!customer) return <SignInPrompt />;
  if (loadError) return <p role="alert">{loadError}</p>;
  if (!data || !totals || !data.address)
    return (
      <p className="py-10 text-center text-sm">Preparing secure payment...</p>
    );
  if (!data.valid)
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-[#f5f5f6] p-8 text-center">
        <p className="font-bold">
          Your bag is empty or has items that are no longer available.
        </p>
        <Link href="/cart" className="btn-primary mt-5">
          Review bag
        </Link>
      </div>
    );
  const address = data.address;
  const total = totals.preview.total;
  const nothingAvailable = !data.options.online && !totals.codOk;

  async function applyCoupon() {
    setApplying(true);
    setCouponError("");
    try {
      setCoupon(await request<CouponRule>("/customer/coupon", { code }));
      attempt.current = "";
    } catch (e) {
      setCoupon(null);
      setCouponError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  async function payNow() {
    if (!method || placing) return;
    setPlacing("order");
    setError("");
    attempt.current ||= crypto.randomUUID();
    try {
      const result = await request<{
        order: Order;
        checkout: PaymentCheckout;
        paymentError: string;
      }>("/customer/orders", {
        address,
        paymentMethod: method,
        idempotencyKey: attempt.current,
        couponCode: coupon?.code || "",
      });
      attempt.current = "";
      const { order } = result;
      let problem = result.paymentError;
      if (order.status === "pending_payment" && result.checkout) {
        setPlacing("gateway");
        // Redirect gateways (PayU) leave the page here; popup gateways return.
        await pay(order.number, result.checkout, order.total).catch((e) => {
          problem = (e as Error).message;
        });
      }
      await refresh();
      // The order exists either way; its page offers retry or pay on delivery.
      router.push(
        `/orders/${order.number}?placed=1${problem ? `&error=${encodeURIComponent(problem.slice(0, 200))}` : ""}`,
      );
    } catch (e) {
      setError((e as Error).message);
      setPlacing("");
    }
  }

  const payLabel = method === "cod" ? "Place order" : `Pay ${money(total)}`;
  const payButton = (cls: string) => (
    <button
      onClick={() => void payNow()}
      disabled={!method || !!placing || nothingAvailable}
      className={`flex items-center justify-center gap-2 rounded-md bg-[#ff3f6c] font-bold uppercase tracking-wide text-white transition hover:bg-[#e93761] disabled:opacity-50 ${cls}`}
    >
      {placing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Lock size={14} />
      )}
      {placing ? "Please wait" : payLabel}
    </button>
  );

  return (
    <>
      {dialog}
      {placing && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/95 px-8 text-center"
        >
          <Loader2 size={40} className="animate-spin text-[#ff3f6c]" />
          <p className="text-lg font-bold">
            {placing === "order"
              ? "Placing your order..."
              : data.options.online?.provider === "payu"
                ? "Taking you to PayU's secure payment page..."
                : "Opening secure payment..."}
          </p>
          <p className="max-w-xs text-sm text-gray-500">
            Please don't press back or close this page.
          </p>
        </div>
      )}

      {/* Sticky pay bar: who it's going to, the total, and Pay now — always in reach. */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-[#eaeaec] bg-white/95 px-4 py-3 backdrop-blur sm:top-[72px] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4">
          <div className="min-w-0 flex-1 text-xs sm:text-sm">
            <p className="truncate">
              Deliver to <strong>{address.name}</strong>, {address.pin}
            </p>
            <p className="truncate text-gray-500">
              {address.line}, {address.city}{" "}
              <Link href="/checkout" className="ml-1 font-bold text-[#ff3f6c]">
                Change
              </Link>
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-lg font-bold leading-tight">{money(total)}</p>
            <p className="text-[11px] text-gray-500">Total payable</p>
          </div>
          {payButton("hidden px-8 py-3.5 text-sm sm:flex")}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-bold">We couldn't place your order</p>
          <p className="mt-1">{error}</p>
          {/bag|sold out|available/i.test(error) && (
            <Link
              href="/cart"
              className="mt-2 inline-block font-bold underline"
            >
              Review bag
            </Link>
          )}
        </div>
      )}

      <div className="grid items-start gap-6 pb-28 lg:grid-cols-[1fr_360px] lg:pb-0">
        <section className="space-y-4">
          <h1 className="text-lg font-bold">Choose payment mode</h1>
          <fieldset disabled={!!placing} className="space-y-3">
            <legend className="sr-only">Payment mode</legend>
            {data.options.online && (
              <label
                className={`block cursor-pointer rounded-2xl border-2 bg-white p-4 transition sm:p-5 ${method === "online" ? "border-[#ff3f6c] shadow-[0_6px_20px_#ff3f6c1a]" : "border-[#eaeaec]"}`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={method === "online"}
                    onChange={() => setMethod("online")}
                    className="mt-1 h-4 w-4 accent-[#ff3f6c]"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-bold">
                      Pay online
                      <span className="rounded bg-[#e6f8f3] px-2 py-0.5 text-[10px] font-bold text-[#03a685]">
                        RECOMMENDED
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {data.options.online.provider === "payu"
                        ? "Pick UPI, card, net banking or wallet on PayU's secure page."
                        : data.options.online.label}
                    </span>
                    <span className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {onlineMethods.map(([Icon, label]) => (
                        <span
                          key={label}
                          className="flex items-center gap-2 rounded-lg border border-[#eaeaec] bg-[#fafafa] px-3 py-2 text-xs font-semibold"
                        >
                          <Icon size={16} className="text-[#535766]" />
                          {label}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </label>
            )}
            <label
              className={`block rounded-2xl border-2 bg-white p-4 transition sm:p-5 ${totals.codOk ? "cursor-pointer" : "opacity-60"} ${method === "cod" ? "border-[#ff3f6c] shadow-[0_6px_20px_#ff3f6c1a]" : "border-[#eaeaec]"}`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="method"
                  disabled={!totals.codOk}
                  checked={method === "cod"}
                  onChange={() => setMethod("cod")}
                  className="mt-1 h-4 w-4 accent-[#ff3f6c]"
                />
                <span className="flex-1">
                  <span className="block font-bold">Cash on delivery</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {!data.options.charges.codEnabled
                      ? "Not available right now."
                      : !totals.codOk
                        ? `Available for orders up to ${money(data.options.charges.codMaxOrder)}.`
                        : data.options.charges.codFee
                          ? `Pay by cash or UPI at your door · ${money(data.options.charges.codFee)} handling fee`
                          : "Pay by cash or UPI at your door"}
                  </span>
                </span>
                <Banknote size={22} className="text-gray-400" />
              </span>
            </label>
            {nothingAvailable && (
              <p role="alert" className="text-sm text-red-700">
                No payment mode is available for this order right now. Please
                contact the store.
              </p>
            )}
          </fieldset>
          <p className="flex items-start gap-2 rounded-xl bg-[#f5f5f6] p-4 text-xs leading-5 text-[#535766]">
            <ShieldCheck size={18} className="shrink-0 text-[#20bd99]" />
            {data.options.online?.provider === "payu"
              ? "Online payments are processed by PayU over an encrypted connection. Your card details and UPI PIN are entered on PayU's page and never reach our store."
              : "Your order is reserved for you as soon as it is placed."}
          </p>
        </section>

        <aside className="space-y-5 rounded-2xl border border-[#eaeaec] bg-white p-4 sm:p-6 lg:sticky lg:top-44">
          <div className="rounded-xl border border-dashed border-[#d4d5d9] p-4">
            {coupon ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="flex items-center gap-2 font-bold">
                    <TicketPercent size={16} className="text-[#03a685]" />
                    {coupon.code} applied
                  </span>
                  {coupon.description && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {coupon.description}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={!!placing}
                  onClick={() => {
                    setCoupon(null);
                    setCode("");
                    attempt.current = "";
                  }}
                  className="text-xs font-bold text-[#ff3f6c]"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) void applyCoupon();
                }}
              >
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-md border p-2.5 text-base uppercase sm:text-sm"
                />
                <button
                  disabled={applying || !code.trim()}
                  className="rounded-md border border-[#ff3f6c] px-4 text-sm font-bold text-[#ff3f6c]"
                >
                  {applying ? "..." : "Apply"}
                </button>
              </form>
            )}
            {couponError && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                {couponError}
              </p>
            )}
          </div>
          <BagLines lines={data.lines} />
          <PriceBreakup
            discount={totals.preview.discount}
            couponCode={coupon?.code}
            mrp={totals.mrp}
            items={totals.units}
            subtotal={totals.preview.subtotal}
            shippingFee={totals.preview.shippingFee}
            codFee={totals.preview.codFee}
            total={total}
          />
          {payButton("hidden w-full p-4 text-sm lg:flex")}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t bg-white px-4 py-3 shadow-[0_-4px_16px_#0000000f] sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight">{money(total)}</p>
          <p className="text-[11px] text-gray-500">
            {method === "cod" ? "Pay at delivery" : "Total payable"}
          </p>
        </div>
        {payButton("px-6 py-3.5 text-sm")}
      </div>
    </>
  );
}
