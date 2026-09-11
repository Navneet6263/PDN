import { Pencil, Trash2, Search, ExternalLink } from "lucide-react";
import { useState } from "react";
import { money, type Product } from "@/lib/types";
export default function ProductTable({
  products,
  onEdit,
  onDelete,
  inventory,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  inventory: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const list = products.filter(
    (p) =>
      `${p.name} ${p.category} ${p.brand}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "published" && p.published) ||
        (filter === "draft" && !p.published) ||
        (filter === "low" && p.stock <= 5)),
  );
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-wrap justify-between gap-4 border-b p-5">
        <label className="flex items-center gap-2">
          <Search size={16} className="text-muted" />
          <input
            aria-label="Search admin products"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-44 py-1 text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          Show
          <select
            aria-label="Filter products"
            className="rounded border bg-white px-3 py-2 text-ink"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All products</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="low">Low stock (≤ 5)</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-muted">
            <tr>
              {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((label) => (
                <th key={label} className="px-5 py-4 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-14 w-11 rounded object-cover" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="mt-1 text-[10px] text-muted">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 capitalize text-muted">{p.category}</td>
                <td className="px-5 py-4">{money(p.price)}</td>
                <td className="px-5 py-4">
                  <span className={p.stock <= 5 ? "text-amber-700" : "text-muted"}>
                    {p.stock} units
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] ${p.published ? "bg-green-50 text-green-800" : "bg-stone-100 text-muted"}`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button
                      aria-label={`Edit ${p.name}`}
                      className="rounded p-2 hover:bg-cream"
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={14} />
                    </button>
                    {p.published && (
                      <a
                        href={`/product/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${p.name}`}
                        className="rounded p-2 hover:bg-cream"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      aria-label={`Delete ${p.name}`}
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <p className="p-12 text-center text-sm text-muted">No products match your filters.</p>
      )}
      <div className="border-t px-5 py-4 text-[11px] text-muted">
        {list.length} products {inventory ? "· Edit a product to update its stock quantity." : ""}
      </div>
    </section>
  );
}
