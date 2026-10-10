"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { itemKey, request, type CartItem } from "@/lib/shopping";
import { money } from "@/lib/types";
import { orderTotals, type ChargeSettings } from "@/lib/orders";
import { useShopping } from "./ShoppingProvider";
export type Quote = {
  lines: (CartItem & {
    name: string;
    image: string;
    slug: string;
    price: number;
    mrp: number;
    stock: number;
    error: string;
  })[];
  subtotal: number;
  valid: boolean;
  charges?: ChargeSettings;
};
export default function Cart() {
  const { items, customer, ready, busy, change, error, refresh } =
    useShopping();
  const [quote, setQuote] = useState<Quote | null>(null),
    [note, setNote] = useState("");
  useEffect(() => {
    let current = true;
    setQuote(null);
    if (ready)
      request<Quote>("/bag/quote", items)
        .then((q) => {
          if (current) {
            setQuote(q);
            setNote("");
          }
        })
        .catch((e) => {
          if (current) setNote(e.message);
        });
    return () => {
      current = false;
    };
  }, [items, ready]);
  async function update(next: CartItem[]) {
    try {
      await change(next);
    } catch (e) {
      setNote((e as Error).message);
    }
  }
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Your shopping bag</h1>
        <Link href="/#catalog" className="text-xs text-pink-600">
          Keep shopping
        </Link>
      </div>
      {(error || note) && (
        <p role="alert" className="mb-5 rounded bg-red-50 p-4 text-sm">
          {error || note}
          <button className="ml-2 underline" onClick={() => void refresh()}>
            Retry
          </button>
        </p>
      )}
      {!ready ? (
        <p>Loading your saved bag...</p>
      ) : !items.length ? (
        <div className="rounded-2xl bg-[#f5f6f8] px-6 py-16 text-center">
          <h2 className="text-xl font-bold">
            A little room for your next favourite.
          </h2>
          <Link
            href="/#catalog"
            className="mt-5 inline-block rounded bg-[#ff3f6c] px-6 py-3 text-white"
          >
            Explore styles
          </Link>
        </div>
      ) : !quote ? (
        <p>Checking current prices and availability...</p>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {quote.lines.map((line, index) => (
              <article
                key={itemKey(line)}
                className="flex gap-4 rounded-2xl border border-[#e9ebef] bg-white p-4 sm:p-5"
              >
                {line.image && (
                  <Link href={`/product/${line.slug}`} className="shrink-0">
                    <img
                      src={line.image}
                      alt={line.name}
                      className="h-36 w-24 rounded object-cover"
                    />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">{line.name}</h2>
                  <p className="my-2 text-xs text-gray-500">
                    Size: {line.size}
                    {line.color ? ` · ${line.color}` : ""}
                  </p>
                  <p className="font-bold">{money(line.price)}</p>
                  {line.quantity > 1 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Each · {money(line.price * line.quantity)} for{" "}
                      {line.quantity}
                    </p>
                  )}
                  <label className="mt-3 block text-xs">
                    Quantity{" "}
                    <select
                      aria-label={`Quantity for ${line.name}`}
                      disabled={busy}
                      value={line.quantity}
                      onChange={(e) =>
                        void update(
                          items.map((i, n) =>
                            n === index
                              ? { ...i, quantity: Number(e.target.value) }
                              : i,
                          ),
                        )
                      }
                      className="ml-2 rounded border p-2"
                    >
                      {Array.from({ length: 10 }, (_, n) => (
                        <option key={n} value={n + 1}>
                          {n + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  {line.error && (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {line.error}
                    </p>
                  )}
                  <button
                    disabled={busy}
                    onClick={() =>
                      void update(items.filter((_, n) => n !== index))
                    }
                    className="mt-3 text-xs text-pink-600 underline"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="space-y-5 rounded-2xl border border-[#e9ebef] bg-[#f8f9fb] p-6 lg:sticky lg:top-36">
            <h2 className="font-bold">Bag summary</h2>
            <p className="flex justify-between text-sm">
              <span>Items subtotal</span>
              <strong>{money(quote.subtotal)}</strong>
            </p>
            {(() => {
              const mrp = quote.lines.reduce(
                (s, l) => s + (l.mrp || l.price) * l.quantity,
                0,
              );
              const c = quote.charges;
              const t = c && orderTotals(quote.subtotal, c, "online");
              const short =
                c && c.freeShippingAbove > 0
                  ? c.freeShippingAbove - quote.subtotal
                  : 0;
              return (
                <>
                  {mrp > quote.subtotal && (
                    <p className="flex justify-between text-sm text-[#03a685]">
                      <span>You save on MRP</span>
                      <strong>{money(mrp - quote.subtotal)}</strong>
                    </p>
                  )}
                  {t && (
                    <p className="flex justify-between text-sm">
                      <span>Delivery</span>
                      {t.shippingFee ? (
                        <span>{money(t.shippingFee)}</span>
                      ) : (
                        <strong className="text-[#03a685]">FREE</strong>
                      )}
                    </p>
                  )}
                  {t && short > 0 && (
                    <div className="rounded-lg bg-white p-3 text-xs">
                      <p>
                        Add <strong>{money(short)}</strong> more for{" "}
                        <strong>free delivery</strong>
                      </p>
                      <div className="mt-2 h-1.5 rounded bg-gray-100">
                        <div
                          className="h-1.5 rounded bg-[#ff3f6c]"
                          style={{
                            width: `${Math.min(100, (quote.subtotal / c!.freeShippingAbove) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {t && (
                    <p className="flex justify-between border-t pt-4 font-bold">
                      <span>Estimated total</span>
                      <span>{money(t.total)}</span>
                    </p>
                  )}
                </>
              );
            })()}
            <p className="text-xs leading-5 text-gray-500">
              Pay online or with cash on delivery at checkout. Items are
              reserved once you place the order.
            </p>
            <Link
              aria-disabled={!quote.valid || busy}
              onClick={(e) => {
                if (!quote.valid || busy) e.preventDefault();
              }}
              href={customer ? "/checkout" : "/account"}
              className={`block rounded bg-[#ff3f6c] p-4 text-center text-sm font-bold text-white ${!quote.valid || busy ? "opacity-50" : ""}`}
            >
              {customer ? "Continue to checkout" : "Sign in to checkout"}
            </Link>
            <p className="text-xs text-gray-500">
              Your guest bag stays with you after login.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
