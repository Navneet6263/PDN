"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CreditCard,
  MapPin,
  ShieldCheck,
  TicketPercent,
  Truck,
} from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import {
  codAllowed,
  orderTotals,
  withCoupon,
  type ChargeSettings,
  type CouponRule,
  type Order,
  type PaymentCheckout,
  type PaymentMethod,
} from "@/lib/orders";
import type { Quote } from "./Cart";
import { useShopping } from "./ShoppingProvider";
import { usePayment } from "./Payment";
import PriceBreakup from "./PriceBreakup";

type Address = {
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
};
type Data = Quote & {
  address: Address | null;
  options: {
    charges: ChargeSettings;
    online: { provider: string; label: string } | null;
  };
};
const fields = [
  ["name", "Full name", "name"],
  ["phone", "Mobile number", "tel"],
  ["line", "House, street & locality", "street-address"],
  ["city", "City", "address-level2"],
  ["state", "State", "address-level1"],
  ["pin", "PIN code", "postal-code"],
] as const;

export default function Checkout() {
  const { customer, ready, items, error: bagError, refresh } = useShopping();
  const router = useRouter();
  const { pay, dialog } = usePayment();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  // One key per checkout attempt: a retried or double-clicked submit returns
  // the same order instead of creating a second one.
  const attempt = useRef<string>("");
  useEffect(() => {
    let live = true;
    if (placing) return;
    setData(null);
    if (customer && ready)
      request<Data>("/customer/checkout")
        .then((d) => {
          if (!live) return;
          setData(d);
          setEditing(!d.address);
        })
        .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [customer, ready, items]);

  const totals = useMemo(() => {
    if (!data) return null;
    const mrp = data.lines.reduce(
      (s, l) => s + (l.mrp || l.price) * l.quantity,
      0,
    );
    const units = data.lines.reduce((s, l) => s + l.quantity, 0);
    const preview = withCoupon(
      orderTotals(data.subtotal, data.options.charges, method || "online"),
      coupon,
    );
    const codOk = codAllowed(
      data.options.charges,
      withCoupon(
        orderTotals(data.subtotal, data.options.charges, "cod"),
        coupon,
      ).total,
    );
    return { mrp, units, preview, codOk };
  }, [data, method, coupon]);
  useEffect(() => {
    if (!data || !totals) return;
    if (method === "cod" && !totals.codOk) setMethod(null);
    if (!method)
      setMethod(data.options.online ? "online" : totals.codOk ? "cod" : null);
  }, [data, totals]);

  if (!ready)
    return (
      <p>
        {bagError || "Loading checkout..."}
        {bagError && (
          <button onClick={() => void refresh()} className="ml-2 underline">
            Retry
          </button>
        )}
      </p>
    );
  if (!customer)
    return (
      <div>
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="my-5">Your guest bag will be kept when you sign in.</p>
        <Link href="/account" className="btn-primary">
          Sign in / create account
        </Link>
      </div>
    );

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
  async function placeOrder() {
    if (!data?.address || !method) return;
    setPlacing(true);
    setError("");
    attempt.current ||= crypto.randomUUID();
    try {
      const result = await request<{
        order: Order;
        checkout: PaymentCheckout;
        paymentError: string;
      }>("/customer/orders", {
        address: data.address,
        paymentMethod: method,
        idempotencyKey: attempt.current,
        couponCode: coupon?.code || "",
      });
      attempt.current = "";
      const { order } = result;
      if (order.status === "pending_payment" && result.checkout)
        await pay(order.number, result.checkout, order.total).catch((e) =>
          setError(e.message),
        );
      await refresh();
      router.push(`/orders/${order.number}?placed=1`);
    } catch (e) {
      setError((e as Error).message);
      setPlacing(false);
    }
  }

  return (
    <>
      {dialog}
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {!data || !totals ? (
        <p>Checking your bag...</p>
      ) : !data.valid ? (
        <div>
          <p>Your bag is empty or contains unavailable items.</p>
          <Link
            href="/cart"
            className="mt-4 inline-block text-pink-600 underline"
          >
            Review your bag
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <MapPin size={18} /> Delivery address
                </h2>
                {data.address && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm font-bold text-[#ff3f6c]"
                  >
                    Change
                  </button>
                )}
              </div>
              {data.address && !editing ? (
                <div className="rounded-xl border border-[#ffd2dd] bg-[#fff7f9] p-4 text-sm leading-6">
                  <p className="font-bold">{data.address.name}</p>
                  <p>{data.address.line}</p>
                  <p>
                    {data.address.city}, {data.address.state} –{" "}
                    {data.address.pin}
                  </p>
                  <p className="mt-1">
                    Mobile: <strong>{data.address.phone}</strong>
                  </p>
                </div>
              ) : (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError("");
                    try {
                      const d = await request<Data>(
                        "/customer/checkout",
                        Object.fromEntries(new FormData(e.currentTarget)),
                      );
                      setData(d);
                      setEditing(false);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {fields.map(([name, label, auto]) => (
                    <label
                      key={name}
                      className={`block text-sm ${name === "line" ? "sm:col-span-2" : ""}`}
                    >
                      {label}
                      <input
                        required
                        name={name}
                        autoComplete={auto}
                        defaultValue={
                          data.address?.[name] ||
                          (name === "name" ? customer.name : "")
                        }
                        pattern={
                          name === "phone"
                            ? "[6-9][0-9]{9}"
                            : name === "pin"
                              ? "[0-9]{6}"
                              : undefined
                        }
                        inputMode={
                          name === "phone" || name === "pin"
                            ? "numeric"
                            : "text"
                        }
                        minLength={name === "line" ? 8 : 2}
                        maxLength={
                          name === "phone" ? 10 : name === "pin" ? 6 : 300
                        }
                        className="mt-2 w-full rounded border p-3"
                      />
                    </label>
                  ))}
                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      disabled={busy}
                      className="flex-1 rounded bg-[#ff3f6c] p-4 text-sm font-bold text-white"
                    >
                      {busy ? "Saving..." : "Save address"}
                    </button>
                    {data.address && (
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded border px-5 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            <section
              className={`rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-7 ${!data.address || editing ? "opacity-50" : ""}`}
              aria-disabled={!data.address || editing}
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <CreditCard size={18} /> Payment method
              </h2>
              <fieldset
                disabled={!data.address || editing || placing}
                className="space-y-3"
              >
                <legend className="sr-only">Choose how to pay</legend>
                {data.options.online && (
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 ${method === "online" ? "border-[#ff3f6c] bg-[#fff7f9]" : ""}`}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={method === "online"}
                      onChange={() => setMethod("online")}
                      className="mt-1 accent-[#ff3f6c]"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-bold">
                        Pay online
                        <span className="rounded bg-[#e9f7f3] px-2 py-0.5 text-[10px] text-[#03a685]">
                          RECOMMENDED
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {data.options.online.label}
                      </span>
                    </span>
                    <ShieldCheck size={20} className="text-[#03a685]" />
                  </label>
                )}
                <label
                  className={`flex items-start gap-4 rounded-xl border p-4 ${totals.codOk ? "cursor-pointer" : "opacity-60"} ${method === "cod" ? "border-[#ff3f6c] bg-[#fff7f9]" : ""}`}
                >
                  <input
                    type="radio"
                    name="method"
                    disabled={!totals.codOk}
                    checked={method === "cod"}
                    onChange={() => setMethod("cod")}
                    className="mt-1 accent-[#ff3f6c]"
                  />
                  <span className="flex-1">
                    <span className="block font-bold">Cash on delivery</span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {!data.options.charges.codEnabled
                        ? "Not available right now."
                        : !totals.codOk
                          ? `Available for orders up to ${money(data.options.charges.codMaxOrder)}.`
                          : data.options.charges.codFee
                            ? `Pay in cash or UPI at your door · ${money(data.options.charges.codFee)} handling fee`
                            : "Pay in cash or UPI at your door"}
                    </span>
                  </span>
                  <Banknote size={20} className="text-gray-400" />
                </label>
                {!data.options.online && !totals.codOk && (
                  <p role="alert" className="text-sm text-red-700">
                    No payment method is available for this order. Please
                    contact the store.
                  </p>
                )}
              </fieldset>
            </section>
          </div>

          <aside className="space-y-5 rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-7 lg:sticky lg:top-36">
            <h2 className="font-bold">Order summary</h2>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {data.lines.map((i, n) => (
                <div key={n} className="flex gap-3 border-b pb-3 text-xs">
                  <img
                    src={i.image}
                    alt=""
                    className="h-16 w-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-bold">{i.name}</p>
                    <p className="my-1 text-gray-500">
                      {i.size}
                      {i.color ? ` · ${i.color}` : ""} · Qty {i.quantity}
                    </p>
                    <p>{money(i.price * i.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
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
                    disabled={placing}
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
                    className="min-w-0 flex-1 rounded border p-2.5 text-sm uppercase"
                  />
                  <button
                    disabled={applying || !code.trim()}
                    className="rounded border border-[#ff3f6c] px-4 text-sm font-bold text-[#ff3f6c]"
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
            <PriceBreakup
              discount={totals.preview.discount}
              couponCode={coupon?.code}
              mrp={totals.mrp}
              items={totals.units}
              subtotal={totals.preview.subtotal}
              shippingFee={totals.preview.shippingFee}
              codFee={totals.preview.codFee}
              total={totals.preview.total}
            />
            <button
              disabled={!data.address || editing || !method || placing}
              onClick={() => void placeOrder()}
              className="w-full rounded bg-[#ff3f6c] p-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {placing
                ? "Placing your order..."
                : method === "online"
                  ? `Pay ${money(totals.preview.total)}`
                  : "Place order"}
            </button>
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Truck size={14} /> Stock is reserved as soon as you place the
              order.
            </p>
            <Link
              href="/cart"
              className="block text-sm text-pink-600 underline"
            >
              Edit bag
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
