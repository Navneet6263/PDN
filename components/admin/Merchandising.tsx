"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { request } from "./api";
import StyleTags from "./StyleTags";
export default function Merchandising({
  products,
  refresh,
}: {
  products: Product[];
  refresh: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function choose(p: Product) {
    setSelected({ ...p });
    setKeywords(p.searchKeywords.join(", "));
    setError("");
    setNotice("");
  }
  return (
    <div className="space-y-6">
      <h1 className="serif text-4xl">Top 10 & Search</h1>
      <p className="max-w-3xl text-sm leading-6 text-muted">
        Assign one product to each Top 10 position. Only published, in-stock products in visible
        categories appear. Clear an occupied position before assigning it to another product. Search
        priority boosts matching products; customer price sorting takes precedence.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => {
          const p = products.find((p) => p.topTenRank === i + 1);
          return (
            <button
              key={i}
              className="panel text-left hover:border-olive"
              onClick={() => p && choose(p)}
            >
              <span className="text-2xl text-olive">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 truncate text-sm">{p?.name || "Empty position"}</p>
              {p && (
                <p className="mt-1 text-xs text-muted">
                  {!p.published ? "Draft" : p.stock === 0 ? "Out of stock" : "Published"}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-800">
          {notice}
        </p>
      )}
      {selected && (
        <form
          className="panel space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await request(`/admin/merchandising/${selected.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                  topTenRank: selected.topTenRank,
                  displayOrder: selected.displayOrder,
                  searchPriority: selected.searchPriority,
                  searchKeywords: keywords
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  featured: selected.featured,
                }),
              });
              await refresh();
              setSelected(null);
              setNotice("Placement saved. Your storefront now uses this order.");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 className="text-xl font-medium">{selected.name}</h2>
          <fieldset disabled={busy} className="grid gap-5 md:grid-cols-2">
            <label className="label">
              Top 10 position
              <select
                className="field"
                value={selected.topTenRank ?? ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    topTenRank: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Not in Top 10</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Catalog order (lower appears first)
              <input
                type="number"
                min={0}
                max={100000}
                className="field"
                value={selected.displayOrder}
                onChange={(e) => setSelected({ ...selected, displayOrder: Number(e.target.value) })}
              />
            </label>
            <label className="label">
              Search priority (0–1000; higher first)
              <input
                type="number"
                min={0}
                max={1000}
                className="field"
                value={selected.searchPriority}
                onChange={(e) =>
                  setSelected({ ...selected, searchPriority: Number(e.target.value) })
                }
              />
            </label>
            <label className="label">
              Search keywords (comma separated)
              <input
                className="field"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="kurta, festive, cotton"
              />
            </label>
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={selected.featured}
                onChange={(e) => setSelected({ ...selected, featured: e.target.checked })}
              />
              Featured product
            </label>
            <StyleTags keywords={keywords} onChange={setKeywords} />
          </fieldset>
          <div className="flex gap-3">
            <button className="btn" disabled={busy}>
              Save placement
            </button>
            <button
              type="button"
              className="btn-outline"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="panel">
        <input
          className="field mb-5"
          placeholder="Find a product to promote…"
          aria-label="Find product placement"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="divide-y">
          {products
            .filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase()))
            .map((p) => (
              <button
                key={p.id}
                className="flex w-full items-center gap-4 py-4 text-left"
                onClick={() => choose(p)}
              >
                <img src={p.image} alt="" className="h-14 w-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    Top 10: {p.topTenRank ?? "Off"} · Catalog: {p.displayOrder} · Search:{" "}
                    {p.searchPriority}
                  </p>
                </div>
                <span className="text-xs underline">Set placement</span>
              </button>
            ))}
        </div>
        {!products.length && (
          <p className="py-8 text-center text-muted">
            Add products first, then choose their placements here.
          </p>
        )}
      </div>
    </div>
  );
}
