import { moods, moodLabels } from "@/lib/style-planner";
export default function StyleTags({
  keywords,
  onChange,
}: {
  keywords: string;
  onChange: (value: string) => void;
}) {
  const values = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const toggle = (tag: string) =>
    onChange(
      (values.includes(tag) ? values.filter((k) => k !== tag) : [...values, tag]).join(", "),
    );
  return (
    <section className="rounded-lg border bg-cream p-4 md:col-span-2">
      <h3 className="text-sm font-medium">Style Studio recommendations</h3>
      <p className="my-3 text-xs leading-5 text-muted">
        Choose suitable occasions. Leave all occasions unchecked to match automatically from product
        type. Stock, department and customer budget always apply.
      </p>
      <div className="flex flex-wrap gap-4">
        {moods.map((m) => (
          <label key={m} className="flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={values.includes(`mood:${m}`)}
              onChange={() => toggle(`mood:${m}`)}
            />
            {moodLabels[m]}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {["ethnic", "minimal", "bold"].map((style) => (
          <label key={style} className="flex gap-2 text-xs capitalize">
            <input
              type="checkbox"
              checked={values.includes(`style:${style}`)}
              onChange={() => toggle(`style:${style}`)}
            />
            {style} style
          </label>
        ))}
      </div>
    </section>
  );
}
