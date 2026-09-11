import { PackageCheck, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
type Items = Product["packageContents"];
export default function PackageFields({
  items,
  onChange,
}: {
  items: Items;
  onChange: (items: Items) => void;
}) {
  return (
    <section className="panel">
      <h2 className="flex items-center gap-2 font-medium">
        <PackageCheck size={18} className="text-olive" /> What’s in the package
      </h2>
      <p className="mb-5 mt-2 text-xs leading-5 text-muted">
        List every item the customer will receive, with quantities. Example: 1 kurta, 1 trouser, 1
        dupatta.
      </p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-end gap-3">
            <label className="label flex-1">
              Item name
              <input
                required
                maxLength={120}
                className="field"
                placeholder="e.g. Cotton kurta"
                value={item.name}
                onChange={(e) =>
                  onChange(
                    items.map((p, index) => (index === i ? { ...p, name: e.target.value } : p)),
                  )
                }
              />
            </label>
            <label className="label w-20">
              Quantity
              <input
                required
                type="number"
                min={1}
                max={1000}
                className="field"
                value={item.quantity}
                onChange={(e) =>
                  onChange(
                    items.map((p, index) =>
                      index === i ? { ...p, quantity: Number(e.target.value) } : p,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              disabled={items.length === 1}
              aria-label={`Remove package item ${i + 1}`}
              onClick={() => onChange(items.filter((_, index) => index !== i))}
              className="mb-1 p-2.5 text-muted"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-5 flex items-center gap-2 text-xs text-olive"
        disabled={items.length >= 30}
        onClick={() => onChange([...items, { name: "", quantity: 1 }])}
      >
        <Plus size={15} /> Add another item
      </button>
    </section>
  );
}
