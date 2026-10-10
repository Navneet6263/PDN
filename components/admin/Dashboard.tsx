"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  PackageCheck,
  RotateCcw,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { money } from "@/lib/types";
import type { Order } from "@/lib/orders";
import OrderStatusBadge from "../shop/OrderStatusBadge";
import { request } from "./api";

type Window = { revenue: number; orders: number };
type Data = {
  today: Window;
  last7: Window;
  last30: Window;
  prev30: Window;
  averageOrder: number;
  statusCounts: Record<string, number>;
  refundDue: number;
  days: { day: string; revenue: number; orders: number }[];
  topProducts: {
    productId: string | null;
    name: string;
    image: string;
    units: number;
    revenue: number;
  }[];
  regions: { region: string; revenue: number; orders: number }[];
  lowStock: {
    id: string;
    name: string;
    image: string;
    stock: number;
    published: boolean;
  }[];
  recentOrders: Order[];
  customers: number;
  buyers: number;
  paymentMix: Record<string, number>;
};
const short = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}k`
      : `₹${Math.round(n)}`;

function RevenueChart({ days }: { days: Data["days"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const label = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  return (
    <div>
      <div
        className="relative flex h-44 items-end gap-[2px] border-b border-stone-200"
        role="img"
        aria-label="Daily revenue for the last 14 days"
      >
        {days.map((d, i) => (
          <div
            key={d.day}
            className="relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-ink" : "bg-olive"}`}
              style={{
                height: `${Math.max(d.revenue ? 2 : 0, (d.revenue / max) * 100)}%`,
              }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-[11px] text-white shadow">
                <p className="font-medium">{label(d.day)}</p>
                <p>
                  {money(d.revenue)} · {d.orders}{" "}
                  {d.orders === 1 ? "order" : "orders"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{label(days[0].day)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th>{d.day}</th>
              <td>{money(d.revenue)}</td>
              <td>{d.orders} orders</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard({
  onOrders,
}: {
  onOrders: (status: string) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    request<Data>("/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (error)
    return (
      <p role="alert" className="panel mb-8 text-sm text-red-700">
        Sales dashboard unavailable: {error}
      </p>
    );
  if (!data)
    return (
      <p className="panel mb-8 text-sm text-muted">Loading today’s numbers…</p>
    );
  const change = data.prev30.revenue
    ? Math.round(
        ((data.last30.revenue - data.prev30.revenue) / data.prev30.revenue) *
          100,
      )
    : null;
  const actions: [string, string, number, LucideIcon, string][] = [
    [
      "To pack",
      "confirmed",
      data.statusCounts.confirmed || 0,
      PackageCheck,
      "Confirmed orders waiting to be packed",
    ],
    [
      "To ship",
      "packed",
      data.statusCounts.packed || 0,
      Truck,
      "Packed and ready for the courier",
    ],
    [
      "Awaiting payment",
      "pending_payment",
      data.statusCounts.pending_payment || 0,
      Clock,
      "Online orders not yet paid",
    ],
    [
      "Refunds due",
      "refund_due",
      data.refundDue,
      RotateCcw,
      "Paid orders that were cancelled or returned",
    ],
  ];
  const online = data.paymentMix.online || 0,
    cod = data.paymentMix.cod || 0;
  return (
    <div className="mb-10 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <p className="text-xs text-muted">Today’s sales</p>
          <p className="my-3 text-3xl font-medium">
            {money(data.today.revenue)}
          </p>
          <p className="text-[11px] text-muted">
            {data.today.orders} orders today
          </p>
        </div>
        <div className="panel">
          <p className="text-xs text-muted">Last 30 days</p>
          <p className="my-3 text-3xl font-medium">
            {money(data.last30.revenue)}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted">
            {change === null ? (
              "No sales in the 30 days before"
            ) : (
              <>
                {change >= 0 ? (
                  <ArrowUpRight size={13} className="text-green-700" />
                ) : (
                  <ArrowDownRight size={13} className="text-red-700" />
                )}
                <span
                  className={change >= 0 ? "text-green-800" : "text-red-700"}
                >
                  {Math.abs(change)}%
                </span>{" "}
                vs previous 30 days
              </>
            )}
          </p>
        </div>
        <div className="panel">
          <p className="text-xs text-muted">Orders · 30 days</p>
          <p className="my-3 text-3xl font-medium">{data.last30.orders}</p>
          <p className="text-[11px] text-muted">
            {data.buyers} {data.buyers === 1 ? "buyer" : "buyers"} ·{" "}
            {data.customers} registered{" "}
            {data.customers === 1 ? "customer" : "customers"}
          </p>
        </div>
        <div className="panel">
          <p className="text-xs text-muted">Average order value</p>
          <p className="my-3 text-3xl font-medium">
            {money(data.averageOrder)}
          </p>
          <p className="text-[11px] text-muted">
            {online + cod
              ? `${Math.round((online / (online + cod)) * 100)}% paid online · ${Math.round((cod / (online + cod)) * 100)}% COD`
              : "No orders yet"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(([label, status, count, Icon, hint]) => (
          <button
            key={status}
            onClick={() => onOrders(status)}
            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition hover:shadow-sm ${count ? (status === "refund_due" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50") : "bg-white"}`}
          >
            <Icon size={22} className={count ? "text-ink" : "text-muted"} />
            <span className="flex-1">
              <span className="block text-sm font-medium">
                {count} {label.toLowerCase()}
              </span>
              <span className="block text-[11px] text-muted">{hint}</span>
            </span>
            <ArrowUpRight size={15} className="text-muted" />
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-medium">Revenue · last 14 days</h2>
            <span className="text-xs text-muted">
              {money(data.days.reduce((s, d) => s + d.revenue, 0))}
            </span>
          </div>
          <RevenueChart days={data.days} />
          <p className="mt-3 text-[10px] text-muted">
            Counts confirmed, packed, shipped and delivered orders. Cancelled,
            returned and unpaid orders are excluded.
          </p>
        </section>
        <section className="panel">
          <h2 className="mb-4 font-medium">Best sellers · 30 days</h2>
          {data.topProducts.length ? (
            <ol className="space-y-3">
              {data.topProducts.map((p, n) => (
                <li
                  key={p.productId || p.name}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-4 text-xs text-muted">{n + 1}</span>
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      className="h-11 w-9 rounded object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-right text-xs">
                    {p.units} sold
                    <span className="block text-muted">{short(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">
              Your best sellers will appear after the first orders.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="panel xl:col-span-1">
          <h2 className="mb-4 font-medium">Top regions · 30 days</h2>
          {data.regions.length ? (
            data.regions.map((r) => (
              <div key={r.region} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{r.region}</span>
                  <span className="text-muted">
                    {short(r.revenue)} · {r.orders}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded bg-cream">
                  <div
                    className="h-1.5 rounded bg-olive"
                    style={{
                      width: `${(r.revenue / data.regions[0].revenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No regional sales yet.</p>
          )}
        </section>
        <section className="panel">
          <h2 className="mb-4 flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="text-amber-600" /> Low stock
          </h2>
          {data.lowStock.length ? (
            <ul className="space-y-3">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <img
                    src={p.image}
                    alt=""
                    className="h-10 w-8 rounded object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${p.stock ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"}`}
                  >
                    {p.stock ? `${p.stock} left` : "Sold out"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Everything is well stocked.</p>
          )}
        </section>
        <section className="panel">
          <h2 className="mb-4 font-medium">Latest orders</h2>
          {data.recentOrders.length ? (
            <ul className="space-y-3">
              {data.recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{o.customerName}</span>
                    <span className="text-[11px] text-muted">
                      {o.number} · {money(o.total)}
                    </span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No orders yet.</p>
          )}
          <button
            onClick={() => onOrders("")}
            className="mt-4 text-xs underline"
          >
            View all orders
          </button>
        </section>
      </div>
    </div>
  );
}
