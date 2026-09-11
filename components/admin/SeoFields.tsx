import type { Product } from "@/lib/types";
type Draft = Omit<Product, "id">;
export default function SeoFields({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  return (
    <section className="panel">
      <h2 className="mb-5 font-medium">Search engine listing</h2>
      <div className="space-y-5">
        <label className="label">
          Product URL slug
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={140}
            className="field"
            value={draft.slug}
            onChange={(e) => update("slug", e.target.value)}
          />
          <span className="mt-2 block text-[10px] text-muted">
            /product/{draft.slug || "your-product-name"}
          </span>
        </label>
        <label className="label">
          SEO title <span className="text-muted">(optional · {draft.seoTitle.length}/70)</span>
          <input
            maxLength={70}
            className="field"
            value={draft.seoTitle}
            onChange={(e) => update("seoTitle", e.target.value)}
          />
        </label>
        <label className="label">
          SEO description{" "}
          <span className="text-muted">(optional · {draft.seoDescription.length}/170)</span>
          <textarea
            rows={3}
            maxLength={170}
            className="field"
            value={draft.seoDescription}
            onChange={(e) => update("seoDescription", e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
