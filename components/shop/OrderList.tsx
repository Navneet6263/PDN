"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import type { Order } from "@/lib/orders";
import { useShopping } from "./ShoppingProvider";
import OrderStatusBadge from "./OrderStatusBadge";

export default function OrderList() {
  const { customer, ready } = useShopping();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (customer)
      request<Order[]>("/customer/orders")
        .then(setOrders)
        .catch((e) => setError(e.message));
  }, [customer]);
  if (!ready) return <p>Loading...</p>;
  if (!customer)
    return (
      <p>
        <Link href="/account" className="underline">
          Sign in
        </Link>{" "}
        to see your orders.
      </p>
    );
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>
      {error && <p role="alert">{error}</p>}
      {!orders ? (
        <p>Loading your orders...</p>
      ) : !orders.length ? (
        <div className="rounded-2xl bg-[#f5f6f8] px-6 py-16 text-center">
          <Package className="mx-auto text-gray-400" size={36} />
          <h2 className="mt-3 text-xl font-bold">No orders yet</h2>
          <Link
            href="/#catalog"
            className="mt-5 inline-block rounded bg-[#ff3f6c] px-6 py-3 text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.number}`}
              className="flex items-center gap-4 rounded-2xl border border-[#e9ebef] bg-white p-4 hover:border-[#ffb3c5]"
            >
              <div className="flex -space-x-4">
                {o.items.slice(0, 3).map((i) => (
                  <img
                    key={i.id}
                    src={i.image}
                    alt=""
                    className="h-16 w-12 rounded border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-xs text-gray-500">
                    {new Date(o.placedAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-bold">
                  {o.items[0]?.name}
                  {o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {o.number} · {money(o.total)}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
