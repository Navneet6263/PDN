"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import { orderProducts } from "@/lib/catalog-order";
import { normalizeSearch } from "@/lib/search";
export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => {});
  }, []);
  const matches = query.trim() ? orderProducts(products, query, "featured").slice(0, 5) : [];
  const normalized = normalizeSearch(query);
  return (
    <form
      action="/#catalog"
      className="search-control relative order-last min-w-0 w-full xl:order-none xl:ml-auto xl:min-w-40 xl:flex-1"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onSubmit={(e) => {
        if (active >= 0 && matches[active]) {
          e.preventDefault();
          window.location.href = `/product/${matches[active].slug}`;
        }
        setOpen(false);
      }}
    >
      <div className="search-input-shell flex items-center gap-2 rounded-xl bg-[#f5f5f6] px-3 text-[#777b88]">
        <Search size={16} className="shrink-0" />
        <input
          name="q"
          role="combobox"
          aria-label="Search the store"
          aria-expanded={open && !!query}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `suggestion-${active}` : undefined}
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (["ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              setOpen(true);
              setActive((n) =>
                e.key === "ArrowDown" ? Math.min(matches.length - 1, n + 1) : Math.max(-1, n - 1),
              );
            }
          }}
          placeholder="Search saree, kurta, pants..."
          className="min-w-0 flex-1 bg-transparent py-3 text-xs outline-none"
        />
        <button
          aria-label="Search"
          className="rounded-md px-1.5 py-2 text-xs font-semibold text-[#646877]"
        >
          Go
        </button>
      </div>
      {open && query.trim() && (
        <div className="search-suggestions absolute inset-x-0 top-full z-50 mt-2 max-h-[min(380px,55dvh)] overflow-y-auto rounded-xl bg-white p-2.5 shadow-[0_8px_28px_#282c3f12] ring-1 ring-inset ring-[#eceef1]">
          <p className="mb-2 text-xs text-gray-500">
            {normalized !== query.toLowerCase().trim()
              ? `Showing matches for “${normalized}”`
              : "Suggested styles"}
          </p>
          <ul id="search-suggestions" role="listbox">
            {matches.map((p, i) => (
              <li key={p.id} id={`suggestion-${i}`} role="option" aria-selected={active === i}>
                <a
                  href={`/product/${p.slug}`}
                  className={`flex items-center gap-3 rounded-lg p-2 text-xs transition-colors duration-150 hover:bg-[#f6f7f8] ${active === i ? "bg-[#f1f2f4]" : ""}`}
                >
                  <img src={p.image} alt="" className="h-12 w-9 rounded object-cover" />
                  <span className="min-w-0 break-words text-[#4d5261]">
                    {p.name}
                    <small className="block text-gray-500">{p.subCategory}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {!matches.length && (
            <p className="py-2 text-xs">No matching styles yet. Try saree, anarkali or kurta set.</p>
          )}
          <button className="mt-2 w-full rounded-lg bg-[#f6f7f8] p-3 text-left text-xs font-semibold text-[#626777]">
            See all results for “{query}” →
          </button>
        </div>
      )}
    </form>
  );
}
