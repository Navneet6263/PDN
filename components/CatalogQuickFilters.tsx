"use client";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { FilterProps } from "./CatalogFilterFields";
import { filterCount } from "@/lib/catalog-filters";
export default function CatalogQuickFilters({
  value,
  onChange,
  store,
  onOpen,
  reset,
}: FilterProps & { onOpen: (section?: string) => void; reset: () => void }) {
  return (
    <div className="mb-7 rounded-xl bg-[#f7f7f8] p-3 sm:p-4" aria-label="Quick shopping filters">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[#747785]">A little more you. Refine your picks.</p>
        {filterCount(value) > 0 && (
          <button onClick={reset} className="text-xs text-[#676b79] underline underline-offset-4">
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="quick-filter">
          <span className="sr-only">Quick department filter</span>
          <select
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value, type: "all" })}
          >
            <option value="all">Department</option>
            {store.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden />
        </label>
        <label className="quick-filter">
          <span className="sr-only">Filter by price</span>
          <select
            value={value.budget}
            onChange={(e) => onChange({ ...value, budget: Number(e.target.value) })}
          >
            <option value={10000000}>Price range</option>
            {[999, 1000, 1999, 2500, 4999, 5000].map((n) => (
              <option key={n} value={n}>
                Up to ₹{n.toLocaleString("en-IN")}
              </option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden />
        </label>
        <button className="quick-filter" onClick={() => onOpen("sizes")}>
          Size{value.sizes.length ? ` (${value.sizes.length})` : ""}
          <ChevronDown size={13} />
        </button>
        <button className="quick-filter" onClick={() => onOpen("colors")}>
          Colour{value.colors.length ? ` (${value.colors.length})` : ""}
          <ChevronDown size={13} />
        </button>
        <button className="quick-filter" onClick={() => onOpen()}>
          <SlidersHorizontal size={13} />
          All filters{filterCount(value) ? ` (${filterCount(value)})` : ""}
        </button>
      </div>
    </div>
  );
}
