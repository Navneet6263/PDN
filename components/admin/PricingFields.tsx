import type { Product } from "@/lib/types";
type Draft = Omit<Product, "id">;
export default function PricingFields({
  draft,
  update,
  sizes,
  setSizes,
  colors,
  setColors,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  sizes: string;
  setSizes: (value: string) => void;
  colors: string;
  setColors: (value: string) => void;
}) {
  return (
    <section className="panel">
      <h2 className="mb-5 font-medium">Pricing & inventory</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="label">
          Selling price (₹)
          <input
            required
            type="number"
            min={0.01}
            max={10000000}
            step="0.01"
            className="field"
            value={draft.price}
            onChange={(e) => update("price", Number(e.target.value))}
          />
        </label>
        <label className="label">
          MRP (₹, 0 to omit)
          <input
            required
            type="number"
            min={draft.originalPrice === 0 ? 0 : draft.price}
            max={10000000}
            step="0.01"
            className="field"
            value={draft.originalPrice}
            onChange={(e) => update("originalPrice", Number(e.target.value))}
          />
        </label>
        <label className="label sm:col-span-2">
          Stock quantity
          <input
            required
            type="number"
            min={0}
            max={1000000}
            className="field"
            value={draft.stock}
            onChange={(e) => update("stock", Number(e.target.value))}
          />
        </label>
        <label className="label sm:col-span-2">
          Sizes (comma separated)
          <input
            className="field"
            placeholder="S, M, L, XL"
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
          />
        </label>
        <label className="label sm:col-span-2">
          Colors (comma separated)
          <input
            className="field"
            placeholder="Ivory, Teal, Maroon"
            value={colors}
            onChange={(e) => setColors(e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
