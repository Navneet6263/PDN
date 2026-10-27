"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { orderProducts } from "@/lib/catalog-order";
import type { Storefront } from "@/lib/store-types";
import type { Product } from "@/lib/types";
import {
  parseProfile,
  profileKey,
  styleMatches,
  moodLabels,
  type StyleProfile,
} from "@/lib/style-planner";
import ProductCard from "./ProductCard";
import CatalogFilters from "./CatalogFilters";
import { matchesFilters } from "@/lib/catalog-filters";
export default function Catalog({
  products,
  store,
  curated = false,
}: {
  products: Product[];
  store: Storefront;
  curated?: boolean;
}) {
  const [personalStyle, setPersonalStyle] = useState<StyleProfile | null>(null);
  const params = useSearchParams();
  const key = params.toString();
  const [previous, setPrevious] = useState(key);
  const [category, setCategory] = useState(params.get("category") || "all");
  const [type, setType] = useState(params.get("type") || "all");
  const [query, setQuery] = useState(params.get("q") || "");
  const [budget, setBudget] = useState(10000000);
  const [sort, setSort] = useState("featured");
  const [available, setAvailable] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  if (previous !== key) {
    setPrevious(key);
    setPersonalStyle(null);
    setCategory(params.get("category") || "all");
    setType(params.get("type") || "all");
    setQuery(params.get("q") || "");
    setBudget(10000000);
    setSizes([]);
    setColors([]);
  }
  useEffect(() => {
    if (curated) return;
    const apply = (p: StyleProfile | null) => {
      setPersonalStyle(p);
      setCategory("all");
      setType("all");
      setBudget(p?.budget || 10000000);
      setQuery("");
      setSizes([]);
      setColors([]);
      setAvailable(false);
    };
    if (!window.location.search) {
      try {
        const p = parseProfile(localStorage.getItem(profileKey));
        if (p) apply(p);
      } catch {}
    }
    const change = (e: Event) => apply((e as CustomEvent<StyleProfile | null>).detail);
    window.addEventListener("terra-style-updated", change);
    return () => window.removeEventListener("terra-style-updated", change);
  }, [curated]);
  const reset = () => {
    setPersonalStyle(null);
    setCategory("all");
    setType("all");
    setQuery("");
    setAvailable(false);
    setBudget(10000000);
    setSizes([]);
    setColors([]);
  };
  const filtered = orderProducts(
    (personalStyle ? styleMatches(products, personalStyle) : products).filter((p) =>
      matchesFilters(p, { category, type, budget, available, sizes, colors }),
    ),
    query,
    sort,
  );
  return (
    <section id="catalog" className="shell scroll-mt-40 pb-24 pt-12 md:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#ff3f6c]">
            {store.settings.catalogSubtitle}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#282c3f] md:text-3xl">
            {store.settings.catalogTitle}
          </h2>
          <p className="mt-2 text-xs text-[#9799a4]">{filtered.length} styles to discover</p>
        </div>
        <label className="search-control search-input-shell flex w-full items-center gap-3 rounded-xl bg-[#f5f5f6] px-4 text-[#777b88] sm:w-80">
          <Search size={17} />
          <span className="sr-only">Search products</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try saree, anarkali or kurta set…"
            className="min-w-0 flex-1 bg-transparent py-3 text-xs outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>
      </div>
      {personalStyle && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-[#fff1f5] p-4 text-xs">
          <span>
            Picked for your {moodLabels[personalStyle.mood].toLowerCase()} · {personalStyle.style}{" "}
            preference
          </span>
          <button onClick={reset} className="font-bold text-[#ff3f6c]">
            Show all styles
          </button>
        </div>
      )}
      <div className="min-w-0">
        <CatalogFilters
          store={store}
          products={products}
          value={{ category, type, budget, available, sizes, colors }}
          onChange={(v) => {
            setPersonalStyle(null);
            setCategory(v.category);
            setType(v.type);
            setBudget(v.budget);
            setAvailable(v.available);
            setSizes(v.sizes);
            setColors(v.colors);
          }}
          sort={sort}
          onSort={setSort}
          query={query}
          reset={reset}
        />
        <div className="min-w-0">
          {(sizes.length > 0 || colors.length > 0) && (
            <div className="mb-4 flex flex-wrap gap-2" aria-label="Selected filters">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSizes(sizes.filter((i) => i !== s))}
                  className="rounded-full border border-[#e4e7ec] bg-[#f4f5f7] px-3 py-2 text-xs text-[#606675]"
                >
                  Size: {s} <X size={12} className="inline" />
                </button>
              ))}
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColors(colors.filter((i) => i !== c))}
                  className="rounded-full border border-[#e4e7ec] bg-[#f4f5f7] px-3 py-2 text-xs text-[#606675]"
                >
                  Colour: {c} <X size={12} className="inline" />
                </button>
              ))}
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <p className="text-xs font-semibold">
              {category === "all"
                ? "All departments"
                : store.categories.find((c) => c.slug === category)?.label || category}
              {type !== "all" ? ` / ${type}` : ""}
            </p>
            <label className="flex items-center gap-2 text-xs text-[#777b8b]">
              Sort by
              <select
                aria-label="Sort products"
                className="rounded border px-3 py-2 text-xs text-[#282c3f]"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Recommended</option>
                <option value="new">Newest first</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#faf9fb] px-6 py-16 text-center">
              <h3 className="text-xl font-bold">
                {products.length ? "No pieces found" : "Our collection is coming soon"}
              </h3>
              <p className="my-4 text-sm text-[#858896]">
                {products.length
                  ? "Try a different category, search or price range."
                  : "New products will appear here as they become available."}
              </p>
              {products.length > 0 && (
                <button className="btn-outline" onClick={reset}>
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
