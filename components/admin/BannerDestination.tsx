"use client";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/types";
import type { RecordData } from "./ControlFields";
import { request } from "./api";
export default function BannerDestination({
  value,
  onChange,
}: {
  value: RecordData;
  onChange: (value: RecordData) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    request<Product[]>("/admin/products")
      .then(setProducts)
      .catch((e) => setError(e.message));
  }, []);
  const selected = (value.productIds as string[]) || [],
    collection = value.destination === "collection";
  const update = (productIds: string[]) => onChange({ ...value, productIds });
  const matches = products.filter((p) =>
    `${p.name} ${p.category} ${p.subCategory}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="mt-6 space-y-4 rounded-xl border bg-cream p-5">
      <h3 className="font-bold">What opens when someone clicks this banner?</h3>
      <label className="block text-sm">
        Banner destination type
        <select
          aria-label="Banner destination type"
          className="field"
          value={collection ? "collection" : "link"}
          onChange={(e) => onChange({ ...value, destination: e.target.value })}
        >
          <option value="link">A product, category or custom link</option>
          <option value="collection">A selected festival / occasion collection</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {collection ? (
        <>
          <p className="text-xs leading-5 text-muted">
            Choose up to 100 products. Only published products in visible categories appear to
            shoppers. Set the banner title, image and dates above for each festival.
          </p>
          <p className="text-sm font-bold">Selected styles ({selected.length}/100)</p>
          <ol className="max-h-52 space-y-2 overflow-y-auto">
            {selected.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded border bg-white p-2 text-xs">
                <span className="flex-1">
                  {i + 1}.{" "}
                  {products.find((p) => p.id === id)?.name ||
                    "Unavailable product — remove or replace"}
                </span>
                <button
                  type="button"
                  disabled={!i}
                  aria-label={`Move selected style ${i + 1} up`}
                  onClick={() => {
                    const next = [...selected];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    update(next);
                  }}
                  className="p-2 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Remove selected style ${i + 1}`}
                  onClick={() => update(selected.filter((p) => p !== id))}
                  className="p-2 text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
          <input
            aria-label="Find products for banner"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field"
            placeholder="Search saree, kurta, kids or a product name"
          />
          <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
            {matches.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded border bg-white p-3 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  disabled={!selected.includes(p.id) && selected.length >= 100}
                  onChange={(e) =>
                    update(
                      e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id),
                    )
                  }
                />
                <img src={p.image} alt="" className="h-14 w-10 rounded object-cover" />
                <span>
                  {p.name}
                  <small className="mt-1 block text-muted">
                    {money(p.price)} · {p.published ? "Published" : "Draft — hidden"}
                  </small>
                </span>
              </label>
            ))}
          </div>
          {value.id && (
            <a
              href={`/collection/${value.id}`}
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-bold underline"
            >
              Open saved collection ↗
            </a>
          )}
          <p className="text-xs text-muted">
            Save before previewing. Disabled or out-of-date banners do not expose a collection page.
          </p>
        </>
      ) : (
        <>
          <label className="block text-sm">
            Quick product link
            <select
              aria-label="Quick product link"
              className="field"
              value={
                products.some((p) => `/product/${p.slug}` === value.link) ? String(value.link) : ""
              }
              onChange={(e) => {
                if (e.target.value) onChange({ ...value, link: e.target.value });
              }}
            >
              <option value="">Choose a product, or enter a destination above</option>
              {products.map((p) => (
                <option key={p.id} value={`/product/${p.slug}`}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted">
            Use Button destination above for a category, search or another page in your store.
          </p>
        </>
      )}
    </section>
  );
}
