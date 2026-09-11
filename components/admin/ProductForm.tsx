"use client";
import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import type { StoreCategory } from "@/lib/store-types";
import { type Product } from "@/lib/types";
import { request } from "./api";
import ImageFields from "./ImageFields";
import PackageFields from "./PackageFields";
import PricingFields from "./PricingFields";
import { blank } from "./form-model";
import PolicyFields from "./PolicyFields";
import SeoFields from "./SeoFields";
export default function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  useEffect(() => {
    request<StoreCategory[]>("/admin/categories")
      .then((rows) => {
        setCategories(rows);
        if (!product)
          setDraft((d) => ({
            ...d,
            category: rows.some((c) => c.slug === d.category) ? d.category : rows[0]?.slug || "",
          }));
      })
      .catch((e) => setError(e.message));
  }, []);
  const [draft, setDraft] = useState<Omit<Product, "id">>({
    ...blank,
    ...product,
  });
  const [sizes, setSizes] = useState(product?.sizes.join(", ") || "");
  const [colors, setColors] = useState(product?.colors.join(", ") || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const update = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));
  const split = (value: string) =>
    Array.from(
      new Set(
        value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft.gallery.length) {
      setError("Add at least one product photo.");
      return;
    }
    setBusy(true);
    try {
      await request(`/admin/products${product ? `/${product.id}` : ""}`, {
        method: product ? "PUT" : "POST",
        body: JSON.stringify({
          ...draft,
          image: draft.gallery[0],
          sizes: split(sizes),
          colors: split(colors),
        }),
      });
      onSaved();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            disabled={busy || uploading}
            onClick={onClose}
            className="mb-3 flex items-center gap-2 text-xs text-muted"
          >
            <ArrowLeft size={14} /> All products
          </button>
          <h1 className="serif text-3xl">{product ? "Edit product" : "Add a new piece"}</h1>
        </div>
        <button disabled={busy || uploading} className="btn rounded-lg">
          <Save size={15} />
          {busy ? "Saving…" : "Save product"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="grid min-w-0 items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-5 font-medium">Product details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="label sm:col-span-2">
                Product name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  className="field"
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((p) => ({
                      ...p,
                      name,
                      ...(!product &&
                      (!p.slug ||
                        p.slug ===
                          p.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""))
                        ? {
                            slug: name
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, ""),
                          }
                        : {}),
                    }));
                  }}
                />
              </label>
              <label className="label">
                Brand
                <input
                  required
                  maxLength={80}
                  className="field"
                  value={draft.brand}
                  onChange={(e) => update("brand", e.target.value)}
                />
              </label>
              <label className="label">
                Category
                <select
                  className="field capitalize"
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value as Product["category"])}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.label}
                      {!c.active ? " (hidden)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label sm:col-span-2">
                Product type
                <datalist id="product-types">
                  {categories
                    .find((c) => c.slug === draft.category)
                    ?.subCategories.map((s) => (
                      <option key={s} value={s} />
                    ))}
                </datalist>
                <input
                  maxLength={80}
                  placeholder="e.g. Kurta sets"
                  list="product-types"
                  className="field"
                  value={draft.subCategory}
                  onChange={(e) => update("subCategory", e.target.value)}
                />
              </label>
              <label className="label sm:col-span-2">
                Description
                <textarea
                  required
                  minLength={10}
                  maxLength={10000}
                  rows={5}
                  className="field"
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the fabric, design, fit and occasions…"
                />
              </label>
              <label className="label">
                Material / fabric
                <input
                  maxLength={300}
                  className="field"
                  value={draft.material}
                  onChange={(e) => update("material", e.target.value)}
                />
              </label>
              <label className="label">
                Care instructions
                <textarea
                  maxLength={1000}
                  rows={2}
                  className="field"
                  value={draft.care}
                  onChange={(e) => update("care", e.target.value)}
                />
              </label>
            </div>
          </section>
          <PackageFields
            items={draft.packageContents}
            onChange={(items) => update("packageContents", items)}
          />
          <PolicyFields draft={draft} update={update} />
          <SeoFields draft={draft} update={update} />
        </div>
        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-5 font-medium">Visibility</h2>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => update("published", e.target.checked)}
                className="accent-olive"
              />
              Published on storefront
            </label>
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="accent-olive"
              />
              Feature this product
            </label>
            <p className="mt-4 text-xs leading-5 text-muted">
              Unpublished products are saved as drafts and hidden from customers.
            </p>
          </section>
          <ImageFields
            images={draft.gallery}
            onChange={(images) =>
              setDraft((p) => ({
                ...p,
                gallery: images,
                image: images[0] || "",
              }))
            }
            onBusy={setUploading}
          />
          <PricingFields
            draft={draft}
            update={update}
            sizes={sizes}
            setSizes={setSizes}
            colors={colors}
            setColors={setColors}
          />
        </div>
      </fieldset>
    </form>
  );
}
