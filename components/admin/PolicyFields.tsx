import type { Product } from "@/lib/types";
import { ClipboardList } from "lucide-react";
type Draft = Omit<Product, "id">;
const fields = [
  {
    key: "exchangePolicy",
    label: "Exchange rules",
    max: 5000,
    hint: "Write exchange eligibility, time limit, item condition and the request process.",
  },
  {
    key: "returnPolicy",
    label: "Return & refund rules",
    max: 5000,
    hint: "Write return eligibility, time limit, charges and refund process.",
  },
  {
    key: "shippingInfo",
    label: "Shipping & delivery information",
    max: 3000,
    hint: "Write dispatch time, delivery coverage and delivery charges.",
  },
  {
    key: "warrantyInfo",
    label: "Warranty / guarantee",
    max: 3000,
    hint: "Write any warranty coverage and exclusions that apply.",
  },
  {
    key: "additionalInfo",
    label: "Additional product information",
    max: 5000,
    hint: "Add other specifications, seller details or information customers should know.",
  },
] as const;
export default function PolicyFields({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  return (
    <section className="panel">
      <h2 className="mb-2 flex items-center gap-2 font-medium">
        <ClipboardList size={18} />
        Policies & additional details
      </h2>
      <p className="mb-5 text-xs leading-5 text-muted">
        Write the rules that apply to this product. Saved text appears on its customer page. Empty
        fields stay hidden.
      </p>
      <div className="space-y-5">
        {fields.map((field) => (
          <label key={field.key} className="label">
            {field.label}
            <textarea
              rows={4}
              maxLength={field.max}
              value={draft[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              className="field"
              aria-label={field.label}
              aria-describedby={`${field.key}-hint`}
            />
            <span id={`${field.key}-hint`} className="mt-2 block text-[11px] leading-5 text-muted">
              {field.hint}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
