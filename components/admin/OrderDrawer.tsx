"use client";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { money } from "@/lib/types";
import {
  paymentLabels,
  statusLabels,
  transitions,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import type { Identity } from "@/lib/store-types";
import OrderStatusBadge from "../shop/OrderStatusBadge";
import { request } from "./api";
import { ORDERS_CHANGED } from "./AdminFrame";

const actionLabels: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  packed: "Mark packed",
  shipped: "Mark shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
  returned: "Mark returned",
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function printSlip(o: Order) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document
    .write(`<!doctype html><html><head><title>${esc(o.number)}</title><style>
    body{font:14px/1.5 Arial,sans-serif;color:#222;margin:40px}h1{font-size:20px;margin:0}
    table{width:100%;border-collapse:collapse;margin:24px 0}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}
    .r{text-align:right}.muted{color:#777}.grid{display:flex;justify-content:space-between;gap:24px}
  </style></head><body>
  <div class="grid"><div><h1>Packing slip / invoice</h1><p class="muted">Order ${esc(o.number)} · ${esc(when(o.placedAt))}</p></div>
  <div class="r"><strong>${o.paymentMethod === "cod" ? `COLLECT ${esc(money(o.total))}` : "PREPAID"}</strong></div></div>
  <p><strong>Ship to</strong><br>${esc(o.address.name)}<br>${esc(o.address.line)}<br>${esc(o.address.city)}, ${esc(o.address.state)} – ${esc(o.address.pin)}<br>Mobile ${esc(o.address.phone)}</p>
  <table><thead><tr><th>Item</th><th>Size</th><th>Colour</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>
  ${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.size)}</td><td>${esc(i.color)}</td><td class="r">${i.quantity}</td><td class="r">${esc(money(i.unitPrice))}</td><td class="r">${esc(money(i.unitPrice * i.quantity))}</td></tr>`).join("")}
  </tbody></table>
  <p class="r">Subtotal ${esc(money(o.subtotal))}<br>Delivery ${esc(money(o.shippingFee))}${o.codFee ? `<br>COD fee ${esc(money(o.codFee))}` : ""}<br><strong>Total ${esc(money(o.total))}</strong></p>
  <script>window.print()</script></body></html>`);
  w.document.close();
}

export default function OrderDrawer({
  id,
  actor,
  onClose,
  onChanged,
}: {
  id: string;
  actor: Identity;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [ship, setShip] = useState({
    courier: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [confirm, setConfirm] = useState<OrderStatus | "refunded" | null>(null);
  useEffect(() => {
    request<Order>(`/admin/orders/${id}`)
      .then((o) => {
        setOrder(o);
        setShip({
          courier: o.courier,
          trackingNumber: o.trackingNumber,
          trackingUrl: o.trackingUrl,
        });
      })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  async function run(path: string, method: string, body: object) {
    setBusy(true);
    setError("");
    try {
      const o = await request<Order>(`/admin/orders/${id}${path}`, {
        method,
        body: JSON.stringify(body),
      });
      setOrder(o);
      setConfirm(null);
      onChanged();
      window.dispatchEvent(new Event(ORDERS_CHANGED));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const canFulfil = actor.role === "admin" || actor.role === "inventory";
  const next = order
    ? transitions[order.status].filter(
        (s) => s !== "cancelled" || actor.role === "admin",
      )
    : [];
  const destructive = (s: OrderStatus) => s === "cancelled" || s === "returned";
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      // Rendered inside a space-y list; cancel its sibling margin.
      style={{ marginTop: 0 }}
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#fbfaf7] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-6 py-4">
          <div>
            <p className="eyebrow text-muted">Order</p>
            <h2 id="order-title" className="text-xl font-medium">
              {order?.number || "Loading…"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {order && (
              <button
                onClick={() => printSlip(order)}
                className="btn-outline rounded-lg"
                aria-label="Print packing slip"
              >
                <Printer size={15} /> Slip
              </button>
            )}
            <button
              autoFocus
              onClick={onClose}
              aria-label="Close order"
              className="rounded-lg p-2 hover:bg-cream"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mx-6 mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {order && (
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span
                className={`text-xs ${order.refundDue ? "font-semibold text-red-700" : "text-muted"}`}
              >
                {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}{" "}
                ·{" "}
                {order.refundDue
                  ? "Paid — refund due"
                  : paymentLabels[order.paymentStatus]}
              </span>
              <span className="text-xs text-muted">
                Placed {when(order.placedAt)}
              </span>
            </div>

            {canFulfil && next.length > 0 && (
              <section className="panel space-y-4">
                <h3 className="text-sm font-medium">Next step</h3>
                <div className="flex flex-wrap gap-2">
                  {next.map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() =>
                        destructive(s)
                          ? setConfirm(s)
                          : void run("", "PATCH", {
                              status: s,
                              ...(s === "shipped" ? ship : {}),
                            })
                      }
                      className={
                        destructive(s)
                          ? "btn-outline rounded-lg text-red-700"
                          : "btn rounded-lg"
                      }
                    >
                      {actionLabels[s] || statusLabels[s]}
                    </button>
                  ))}
                </div>
                {confirm && confirm !== "refunded" && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm">
                    <p>
                      {confirm === "cancelled" ? "Cancel" : "Mark as returned"}{" "}
                      order {order.number}? Stock goes back on sale.
                      {order.paymentStatus === "paid" &&
                        " The order will be flagged for a refund."}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run("", "PATCH", { status: confirm })
                        }
                        className="btn rounded-lg bg-red-700"
                      >
                        Yes, continue
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="btn-outline rounded-lg bg-white"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {canFulfil && order.status !== "cancelled" && (
              <form
                className="panel grid gap-3 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run("", "PATCH", ship);
                }}
              >
                <h3 className="text-sm font-medium sm:col-span-3">Shipping</h3>
                <label className="label">
                  Courier
                  <input
                    className="field"
                    value={ship.courier}
                    onChange={(e) =>
                      setShip({ ...ship, courier: e.target.value })
                    }
                    placeholder="Delhivery"
                  />
                </label>
                <label className="label">
                  Tracking number
                  <input
                    className="field"
                    value={ship.trackingNumber}
                    onChange={(e) =>
                      setShip({ ...ship, trackingNumber: e.target.value })
                    }
                  />
                </label>
                <label className="label">
                  Tracking link
                  <input
                    className="field"
                    type="url"
                    value={ship.trackingUrl}
                    onChange={(e) =>
                      setShip({ ...ship, trackingUrl: e.target.value })
                    }
                    placeholder="https://"
                  />
                </label>
                <div className="sm:col-span-3">
                  <button disabled={busy} className="btn-outline rounded-lg">
                    Save shipping details
                  </button>
                </div>
              </form>
            )}

            <section className="panel">
              <h3 className="mb-3 text-sm font-medium">Items</h3>
              <div className="divide-y">
                {order.items.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 py-3 text-sm"
                  >
                    <img
                      src={i.image}
                      alt=""
                      className="h-14 w-11 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted">
                        {i.size}
                        {i.color ? ` · ${i.color}` : ""} · {money(i.unitPrice)}{" "}
                        × {i.quantity}
                      </p>
                    </div>
                    <p>{money(i.unitPrice * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                {[
                  ["Subtotal", order.subtotal],
                  ["Delivery", order.shippingFee],
                  ...(order.codFee ? [["COD fee", order.codFee] as const] : []),
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between text-muted">
                    <span>{k}</span>
                    <span>{money(Number(v))}</span>
                  </p>
                ))}
                <p className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </p>
              </div>
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <section className="panel text-sm leading-6">
                <h3 className="mb-2 font-medium">Customer</h3>
                <p>{order.address.name}</p>
                <p className="text-muted">{order.email}</p>
                <p className="text-muted">{order.address.phone}</p>
                <p className="mt-2">
                  {order.address.line}
                  <br />
                  {order.address.city}, {order.address.state} –{" "}
                  {order.address.pin}
                </p>
              </section>
              <section className="panel text-sm">
                <h3 className="mb-2 font-medium">Payment</h3>
                {order.payments?.map((p) => (
                  <p
                    key={p.id}
                    className="flex justify-between gap-2 border-b py-1.5 text-xs last:border-0"
                  >
                    <span>
                      {p.provider} · {money(p.amount)}
                      {p.failureReason && (
                        <span className="block text-red-700">
                          {p.failureReason}
                        </span>
                      )}
                    </span>
                    <span className="capitalize text-muted">{p.status}</span>
                  </p>
                ))}
                {!order.payments?.length && (
                  <p className="text-xs text-muted">No payment attempts yet.</p>
                )}
                {actor.role === "admin" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(order.paymentStatus === "pending" ||
                      order.paymentStatus === "failed") &&
                      order.status !== "cancelled" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run("/payment", "POST", {
                              status: "paid",
                              note: "Recorded by staff",
                            })
                          }
                          className="btn-outline rounded-lg"
                        >
                          Mark paid
                        </button>
                      )}
                    {order.paymentStatus === "paid" &&
                      (confirm === "refunded" ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run("/payment", "POST", {
                              status: "refunded",
                              note: "",
                            })
                          }
                          className="btn rounded-lg bg-red-700"
                        >
                          Confirm refund issued
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirm("refunded")}
                          className="btn-outline rounded-lg"
                        >
                          Record refund
                        </button>
                      ))}
                  </div>
                )}
              </section>
            </div>

            <section className="panel">
              <h3 className="mb-3 text-sm font-medium">Timeline & notes</h3>
              <form
                className="mb-4 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run("/notes", "POST", { text: note })) setNote("");
                }}
              >
                <input
                  className="field mt-0"
                  aria-label="Internal note"
                  placeholder="Add an internal note (customers don't see these)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                />
                <button
                  disabled={busy || !note.trim()}
                  className="btn rounded-lg"
                >
                  Add
                </button>
              </form>
              <ol className="space-y-3 border-l-2 border-stone-200 pl-4 text-sm">
                {[...(order.events || [])].reverse().map((e) => (
                  <li
                    key={e.id}
                    className={
                      e.kind === "note" ? "rounded-lg bg-amber-50 p-2" : ""
                    }
                  >
                    <p>{e.message}</p>
                    <p className="text-[11px] text-muted">
                      {e.kind === "note" ? "Note · " : ""}
                      {e.actor} · {when(e.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
