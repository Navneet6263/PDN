"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { money, type Product } from "@/lib/types";
import { useShopping } from "./ShoppingProvider";
export default function ProductPurchase({ product: p }: { product: Product }) {
  const { add, ready, busy, error } = useShopping();
  const [size, setSize] = useState(
    p.sizes.length === 1 ? p.sizes[0] : p.sizes.length ? "" : "One size",
  );
  const [color, setColor] = useState(p.colors[0] || ""),
    [note, setNote] = useState(""),
    [added, setAdded] = useState(false);
  async function addToBag() {
    if (!size) {
      setNote("Please select your size first.");
      document
        .getElementById("purchase")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await add({ productId: p.id, size, color, quantity: 1 });
      setAdded(true);
      setNote("Added to your bag. Your picks stay saved when you sign in.");
    } catch (e) {
      setNote((e as Error).message);
    }
  }
  return (
    <section
      id="purchase"
      className="my-7 scroll-mt-44 space-y-5 rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-6"
    >
      <fieldset>
        <legend className="mb-3 text-sm font-bold">Select size</legend>
        <div className="flex flex-wrap gap-2">
          {(p.sizes.length ? p.sizes : ["One size"]).map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={s === size}
              onClick={() => {
                setSize(s);
                setNote("");
              }}
              className={`min-h-12 min-w-12 rounded-xl border px-4 text-sm transition-colors ${s === size ? "border-[#535e71] bg-[#f0f2f6] font-semibold text-[#354054]" : "border-[#e3e6ec] bg-white text-[#6b7281] hover:bg-[#f8f9fb]"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      {p.colors.length > 0 && (
        <label className="block text-sm font-bold">
          Colour
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ml-3 rounded border p-2 font-normal"
          >
            {p.colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      <button
        disabled={!ready || busy || !p.stock}
        onClick={() => void addToBag()}
        className="w-full rounded-lg bg-[#ff3f6c] px-6 py-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {!p.stock ? "Out of stock" : busy ? "Adding..." : "Add to bag"}
      </button>
      {(note || error) && (
        <p role="status" className="text-sm">
          {note || error}
        </p>
      )}
      {/* Mobile: price and the bag button stay in thumb reach while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-white px-4 py-3 shadow-[0_-4px_16px_#0000000f] lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight">{money(p.price)}</p>
          <p className="truncate text-[11px] text-gray-500">
            {size ? `Size ${size}` : "Select a size"}
          </p>
        </div>
        {added ? (
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-md bg-[#ff3f6c] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white"
          >
            Go to bag →
          </Link>
        ) : (
          <button
            disabled={!ready || busy || !p.stock}
            onClick={() => void addToBag()}
            className="flex items-center gap-2 rounded-md bg-[#ff3f6c] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
          >
            <ShoppingBag size={16} />
            {!p.stock ? "Sold out" : busy ? "Adding..." : "Add to bag"}
          </button>
        )}
      </div>
      <div className="flex justify-between text-xs">
        <Link href="/cart" className="font-bold text-[#ff3f6c]">
          View bag →
        </Link>
        <a href="#reviews" className="underline">
          Ratings & photo reviews
        </a>
      </div>
    </section>
  );
}
