"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink, PartyPopper } from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import {
  customerCanCancel,
  paymentLabels,
  progressSteps,
  statusLabels,
  type Order,
  type PaymentCheckout,
} from "@/lib/orders";
import { useShopping } from "./ShoppingProvider";
import { usePayment } from "./Payment";
import PriceBreakup from "./PriceBreakup";
import OrderStatusBadge from "./OrderStatusBadge";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function OrderDetail({ number }: { number: string }) {
  const { customer, ready } = useShopping();
  const placed = useSearchParams().get("placed") === "1";
  const { pay, dialog } = usePayment();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    if (customer)
      request<Order>(`/customer/orders/${encodeURIComponent(number)}`)
        .then(setOrder)
        .catch((e) => setError(e.message));
  }, [customer, number]);

  if (!ready) return <p>Loading your order...</p>;
  if (!customer)
    return (
      <p>
        <Link href="/account" className="underline">
          Sign in
        </Link>{" "}
        to see this order.
      </p>
    );
  if (!order)
    return (
      <p role={error ? "alert" : undefined}>
        {error || "Loading your order..."}
      </p>
    );

  async function act(fn: () => Promise<Order | null>) {
    setBusy(true);
    setError("");
    try {
      const next = await fn();
      if (next) setOrder(next);
      else
        setOrder(
          await request<Order>(
            `/customer/orders/${encodeURIComponent(number)}`,
          ),
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const stepIndex = progressSteps.indexOf(order.status);
  const stopped = order.status === "cancelled" || order.status === "returned";
  const mrp = order.items.reduce(
    (s, i) => s + Math.max(i.mrp, i.unitPrice) * i.quantity,
    0,
  );
  const lastFailed = order.payments?.at(-1)?.status === "failed";
  return (
    <div className="space-y-6">
      {dialog}
      {placed && order.status !== "pending_payment" && !stopped && (
        <div className="flex items-center gap-4 rounded-2xl bg-[#e9f7f3] p-5 text-[#036b56]">
          <PartyPopper size={32} />
          <div>
            <p className="text-lg font-bold">Order placed, thank you!</p>
            <p className="text-sm">
              We have reserved your items. Order number{" "}
              <strong>{order.number}</strong>.
            </p>
          </div>
        </div>
      )}
      {order.status === "pending_payment" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-amber-50 p-5 text-amber-900">
          <div>
            <p className="font-bold">
              {lastFailed ? "Payment did not go through" : "Payment pending"}
            </p>
            <p className="text-sm">
              Complete payment within 30 minutes of placing the order, or it is
              cancelled and the items are released.
            </p>
          </div>
          <button
            disabled={busy}
            onClick={() =>
              void act(async () => {
                const { checkout } = await request<{
                  checkout: PaymentCheckout;
                }>(
                  `/customer/orders/${encodeURIComponent(order.number)}/pay`,
                  {},
                );
                return pay(order.number, checkout, order.total);
              })
            }
            className="rounded bg-[#ff3f6c] px-6 py-3 text-sm font-bold text-white"
          >
            Pay {money(order.total)}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Order {order.number}
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {statusLabels[order.status]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed {when(order.placedAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {!stopped ? (
        <ol
          className="grid grid-cols-5 gap-1 rounded-2xl border border-[#e9ebef] bg-white p-5"
          aria-label="Delivery progress"
        >
          {progressSteps.map((s, n) => {
            const done = stepIndex >= n;
            return (
              <li key={s} className="text-center text-[11px] sm:text-xs">
                <div className="relative mb-2 flex justify-center">
                  {n > 0 && (
                    <span
                      className={`absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 ${stepIndex >= n ? "bg-[#03a685]" : "bg-gray-200"}`}
                    />
                  )}
                  {done ? (
                    <CheckCircle2
                      size={22}
                      className="relative bg-white text-[#03a685]"
                    />
                  ) : (
                    <Circle
                      size={22}
                      className="relative bg-white text-gray-300"
                    />
                  )}
                </div>
                <span className={done ? "font-bold" : "text-gray-500"}>
                  {statusLabels[s]}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-2xl bg-stone-100 p-5 text-sm">
          This order was {order.status}.
          {order.refundDue &&
            " Your refund is being processed to the original payment method."}
          {order.paymentStatus === "refunded" &&
            " Your refund has been issued."}
        </p>
      )}

      {order.trackingNumber && (
        <p className="rounded-xl border border-[#e9ebef] bg-white p-4 text-sm">
          Shipped with <strong>{order.courier || "our courier"}</strong> ·
          Tracking <strong>{order.trackingNumber}</strong>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-[#ff3f6c] underline"
            >
              Track <ExternalLink size={13} />
            </a>
          )}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3 rounded-2xl border border-[#e9ebef] bg-white p-5">
          <h2 className="font-bold">Items</h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-4 border-b pb-3 last:border-0">
              {i.image && (
                <img
                  src={i.image}
                  alt=""
                  className="h-24 w-[72px] rounded object-cover"
                />
              )}
              <div className="text-sm">
                {i.productId && i.slug ? (
                  <Link
                    href={`/product/${i.slug}`}
                    className="font-bold hover:underline"
                  >
                    {i.name}
                  </Link>
                ) : (
                  <p className="font-bold">{i.name}</p>
                )}
                <p className="my-1 text-xs text-gray-500">
                  Size {i.size}
                  {i.color ? ` · ${i.color}` : ""} · Qty {i.quantity}
                </p>
                <p className="font-bold">{money(i.unitPrice * i.quantity)}</p>
              </div>
            </div>
          ))}
          {order.events && order.events.length > 0 && (
            <div className="pt-3">
              <h2 className="mb-3 font-bold">Updates</h2>
              <ol className="space-y-3 border-l-2 border-gray-100 pl-4 text-sm">
                {[...order.events].reverse().map((e) => (
                  <li key={e.id}>
                    <p>{e.message}</p>
                    <p className="text-xs text-gray-500">{when(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
        <aside className="space-y-5 rounded-2xl border border-[#e9ebef] bg-white p-5">
          <div className="text-sm leading-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Delivering to
            </h2>
            <p className="font-bold">{order.address.name}</p>
            <p>{order.address.line}</p>
            <p>
              {order.address.city}, {order.address.state} – {order.address.pin}
            </p>
            <p>Mobile: {order.address.phone}</p>
          </div>
          <PriceBreakup
            discount={order.discount}
            couponCode={order.couponCode}
            mrp={mrp}
            items={order.items.reduce((s, i) => s + i.quantity, 0)}
            subtotal={order.subtotal}
            shippingFee={order.shippingFee}
            codFee={order.codFee}
            total={order.total}
          />
          <p className="text-sm">
            Payment:{" "}
            <strong>
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}
            </strong>{" "}
            · {paymentLabels[order.paymentStatus]}
          </p>
          {customerCanCancel(order.status) &&
            (confirmCancel ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm">
                <p className="mb-3">
                  Cancel this order? Items go back on sale immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(() =>
                        request<Order>(
                          `/customer/orders/${encodeURIComponent(order.number)}/cancel`,
                          {},
                        ),
                      ).then(() => setConfirmCancel(false))
                    }
                    className="rounded bg-red-700 px-4 py-2 font-bold text-white"
                  >
                    Yes, cancel
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="rounded border bg-white px-4 py-2"
                  >
                    Keep order
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full rounded border p-3 text-sm font-bold"
              >
                Cancel order
              </button>
            ))}
          <Link
            href="/orders"
            className="block text-sm text-pink-600 underline"
          >
            All my orders
          </Link>
        </aside>
      </div>
    </div>
  );
}
