"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import { money } from "@/lib/types";
import {
  paymentLabels,
  statusLabels,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import type { Identity } from "@/lib/store-types";
import OrderStatusBadge from "../shop/OrderStatusBadge";
import { request } from "./api";
import OrderDrawer from "./OrderDrawer";

const tabs: [string, string][] = [
  ["", "All"],
  ["pending_payment", "Awaiting payment"],
  ["confirmed", "To pack"],
  ["packed", "To ship"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["refund_due", "Refund due"],
  ["cancelled", "Cancelled"],
  ["returned", "Returned"],
];
const csvCell = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;

export default function OrdersPanel({
  actor,
  initialStatus = "",
}: {
  actor: Identity;
  initialStatus?: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{
    orders: Order[];
    counts: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  async function load() {
    setError("");
    try {
      setData(
        await request(
          `/admin/orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(search)}`,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [status, search]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  const total = useMemo(
    () =>
      Object.entries(data?.counts || {}).reduce(
        (s, [k, v]) => (k === "refund_due" ? s : s + v),
        0,
      ),
    [data],
  );
  function exportCsv() {
    if (!data) return;
    const rows = [
      [
        "Order",
        "Placed",
        "Customer",
        "Email",
        "Phone",
        "City",
        "State",
        "PIN",
        "Items",
        "Total",
        "Payment method",
        "Payment",
        "Status",
        "Courier",
        "Tracking",
      ],
      ...data.orders.map((o) => [
        o.number,
        new Date(o.placedAt).toISOString(),
        o.customerName,
        o.email,
        o.phone,
        o.address.city,
        o.address.state,
        o.address.pin,
        o.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join("; "),
        o.total,
        o.paymentMethod,
        o.paymentStatus,
        o.status,
        o.courier,
        o.trackingNumber,
      ]),
    ];
    const blob = new Blob(
      [rows.map((r) => r.map(csvCell).join(",")).join("\n")],
      {
        type: "text/csv",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${status || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-olive">Fulfilment</p>
          <h1 className="serif text-4xl">Orders</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Pack, ship and track every order. Stock is reserved when an order is
            placed and returned automatically if it is cancelled or returned.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="btn-outline rounded-lg"
            aria-label="Refresh orders"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={exportCsv}
            disabled={!data?.orders.length}
            className="btn-outline rounded-lg"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Order status"
      >
        {tabs.map(([key, label]) => {
          const count = key ? data?.counts[key] || 0 : total;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={status === key}
              onClick={() => setStatus(key)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs ${status === key ? "border-ink bg-ink text-white" : "bg-white hover:bg-cream"} ${key === "refund_due" && count ? "border-red-300" : ""}`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${status === key ? "bg-white/20" : "bg-stone-100"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {error}{" "}
          <button className="underline" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}
      <section className="overflow-hidden rounded-xl border bg-white">
        <label className="flex items-center gap-2 border-b p-4">
          <Search size={16} className="text-muted" />
          <input
            aria-label="Search orders"
            placeholder="Search order number, customer, email, phone or tracking…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-1 text-sm outline-none"
          />
        </label>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                {[
                  "Order",
                  "Customer",
                  "Items",
                  "Total",
                  "Payment",
                  "Status",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.orders.map((o) => (
                <tr
                  key={o.id}
                  tabIndex={0}
                  onClick={() => setOpen(o.id)}
                  onKeyDown={(e) => e.key === "Enter" && setOpen(o.id)}
                  className="cursor-pointer hover:bg-stone-50/70 focus:bg-cream"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{o.number}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {new Date(o.placedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p>{o.customerName}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {o.address.city}, {o.region}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-3">
                        {o.items.slice(0, 3).map((i) => (
                          <img
                            key={i.id}
                            src={i.image}
                            alt=""
                            className="h-10 w-8 rounded border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-muted">
                        {o.items.reduce((s, i) => s + i.quantity, 0)} pcs
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium">{money(o.total)}</td>
                  <td className="px-5 py-4">
                    <p className="uppercase">{o.paymentMethod}</p>
                    <p
                      className={`mt-1 text-[10px] ${o.refundDue ? "font-semibold text-red-700" : o.paymentStatus === "paid" ? "text-green-800" : "text-muted"}`}
                    >
                      {o.refundDue
                        ? "Refund due"
                        : paymentLabels[o.paymentStatus]}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && !data.orders.length && (
          <p className="p-12 text-center text-sm text-muted">
            {search || status
              ? `No ${status ? (statusLabels[status as OrderStatus] || "matching").toLowerCase() : ""} orders match.`
              : "No orders yet. They will appear here as soon as customers check out."}
          </p>
        )}
        {!data && !error && (
          <p className="p-12 text-center text-sm text-muted">Loading orders…</p>
        )}
      </section>
      {open && (
        <OrderDrawer
          id={open}
          actor={actor}
          onClose={() => setOpen(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}
