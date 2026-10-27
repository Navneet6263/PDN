"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { money, type Product } from "@/lib/types";
import { useShopping } from "./ShoppingProvider";
// Start the add-to-bag flight from the product photo when it is on screen,
// otherwise from the button the shopper just pressed.
function flightStart() {
  const photo = document
    .querySelector("[data-product-image]")
    ?.getBoundingClientRect();
  if (photo && photo.bottom > 80 && photo.top < window.innerHeight - 80)
    return photo;
  return (
    (document.activeElement as HTMLElement | null)?.getBoundingClientRect() ??
    null
  );
}
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
      await add(
        { productId: p.id, size, color, quantity: 1 },
        {
          image: p.image,
          name: p.name,
          detail: [size, color].filter(Boolean).join(" · "),
          from: flightStart(),
        },
      );
      setAdded(true);
      setNote("");
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
                setAdded(false);
              }}
              className={`min-h-12 min-w-12 rounded-xl border px-4 text-sm transition-colors ${s === size ? "border-[#535e71] bg-[#f0f2f6] font-semibold text-[#354054]" : "border-[#e3e6ec] bg-white text-[#6b7281] hover:bg-[#f8f9fb]"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      {p.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold">
            Colour: <span className="font-normal text-[#535766]">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.colors.map((c) => (
              <button
                type="button"
                key={c}
                aria-pressed={c === color}
                onClick={() => {
                  setColor(c);
                  setAdded(false);
                }}
                className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${c === color ? "border-[#ff3f6c] bg-[#fff0f3] font-semibold text-[#c62f57]" : "border-[#e3e6ec] bg-white text-[#6b7281] hover:bg-[#f8f9fb]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {added ? (
        <Link
          href="/cart"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#282c3f] px-6 py-4 text-sm font-bold text-white"
        >
          <ShoppingBag size={16} /> Go to bag →
        </Link>
      ) : (
        <button
          disabled={!ready || busy || !p.stock}
          onClick={() => void addToBag()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff3f6c] px-6 py-4 text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-50"
        >
          <ShoppingBag size={16} />
          {!p.stock ? "Out of stock" : busy ? "Adding..." : "Add to bag"}
        </button>
      )}
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
