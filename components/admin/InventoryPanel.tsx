"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { request } from "./api";
export default function InventoryPanel({
  products,
  refresh,
}: {
  products: Product[];
  refresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function change(id: string, data: object) {
    setBusy(true);
    setError("");
    try {
      await request(`/admin/inventory/${id}`, { method: "PATCH", body: JSON.stringify(data) });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="serif text-4xl">Inventory</h1>
      <p className="text-sm text-muted">Update available stock. Low stock means 1–5 units.</p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-4">
        <input
          className="field"
          placeholder="Search inventory"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="field"
          aria-label="Stock filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      <div className="panel divide-y">
        {products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) &&
              (filter === "all" ||
                (filter === "out" ? p.stock === 0 : p.stock > 0 && p.stock <= 5)),
          )
          .map((p) => (
            <div className="flex flex-wrap items-center justify-between gap-4 py-4" key={p.id}>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.stock === 0 ? "Out of stock" : `${p.stock} units available`}
                </p>
              </div>
              <form
                className="flex items-center gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = new FormData(e.currentTarget).get("stock");
                  void change(p.id, { stock: Number(value) });
                }}
              >
                <button
                  type="button"
                  aria-label={`Decrease ${p.name}`}
                  disabled={busy || p.stock === 0}
                  className="btn-outline"
                  onClick={() => void change(p.id, { delta: -1 })}
                >
                  −
                </button>
                <input
                  key={p.stock}
                  aria-label={`Stock for ${p.name}`}
                  name="stock"
                  type="number"
                  min={0}
                  max={1000000}
                  defaultValue={p.stock}
                  className="field w-24"
                />
                <button
                  type="button"
                  aria-label={`Increase ${p.name}`}
                  disabled={busy}
                  className="btn-outline"
                  onClick={() => void change(p.id, { delta: 1 })}
                >
                  +
                </button>
                <button disabled={busy} className="btn">
                  Set
                </button>
              </form>
            </div>
          ))}
        {!products.length && <p className="py-8 text-center text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
