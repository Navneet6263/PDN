"use client";
import type { Storefront } from "@/lib/store-types";
import type { Product } from "@/lib/types";
import type { FilterValues } from "@/lib/catalog-filters";
import { useId } from "react";
export type FilterProps = {
  store: Storefront;
  products: Product[];
  value: FilterValues;
  onChange: (value: FilterValues) => void;
};
export default function CatalogFilterFields({ store, products, value: v, onChange }: FilterProps) {
  const group = useId();
  const set = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) =>
    onChange({ ...v, [key]: value });
  const scoped = products.filter((p) => v.category === "all" || p.category === v.category);
  const types = [...new Set(scoped.map((p) => p.subCategory).filter(Boolean))];
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase">Department</legend>
        <div className="space-y-2">
          {[{ slug: "all", label: "All departments" }, ...store.categories].map((c) => (
            <label key={c.slug} className="flex min-h-9 items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name={group}
                  checked={v.category === c.slug}
                  onChange={() => onChange({ ...v, category: c.slug, type: "all" })}
                  className="h-4 w-4 accent-[#ff3f6c]"
                />
                {c.label}
              </span>
              <span className="text-gray-400">
                {products.filter((p) => c.slug === "all" || p.category === c.slug).length}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block border-t pt-5 text-xs font-bold uppercase">
        Product type
        <select
          aria-label="Filter product type"
          className="field font-normal normal-case"
          value={v.type}
          onChange={(e) => set("type", e.target.value)}
        >
          <option value="all">All styles</option>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block border-t pt-5 text-xs font-bold uppercase">
        Price range
        <select
          aria-label="Filter by price"
          className="field font-normal normal-case"
          value={v.budget}
          onChange={(e) => set("budget", Number(e.target.value))}
        >
          <option value={10000000}>Any price</option>
          {[999, 1000, 1999, 2500, 4999, 5000].map((n) => (
            <option key={n} value={n}>
              Up to ₹{n.toLocaleString("en-IN")}
            </option>
          ))}
        </select>
      </label>
      {(["sizes", "colors"] as const).map((key) => {
        const options = [
          ...new Set(
            scoped.flatMap((p) => (key === "sizes" && !p.sizes.length ? ["One size"] : p[key])),
          ),
        ].sort();
        return (
          <fieldset data-filter-section={key} key={key} className="border-t pt-5">
            <legend className="mb-3 text-xs font-bold uppercase">
              {key === "sizes" ? "Sizes" : "Colours"}
            </legend>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {[...new Set([...options, ...v[key]])].map((option) => (
                <label
                  key={option}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs ${v[key].includes(option) ? "border-pink-500 bg-pink-50 text-pink-700" : "bg-white"}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`${key === "sizes" ? "Size" : "Colour"}: ${option}`}
                    checked={v[key].includes(option)}
                    onChange={(e) =>
                      set(
                        key,
                        e.target.checked ? [...v[key], option] : v[key].filter((s) => s !== option),
                      )
                    }
                    className="accent-[#ff3f6c]"
                  />
                  {option}
                </label>
              ))}
            </div>
            {!options.length && (
              <p className="text-xs text-gray-500">No options for this department.</p>
            )}
          </fieldset>
        );
      })}
      <label className="flex min-h-11 items-center gap-2 border-t pt-5 text-xs">
        <input
          type="checkbox"
          checked={v.available}
          onChange={(e) => set("available", e.target.checked)}
          className="h-4 w-4 accent-[#ff3f6c]"
        />
        In stock only
      </label>
    </div>
  );
}
