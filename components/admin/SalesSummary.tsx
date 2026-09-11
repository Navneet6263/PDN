import type { RecordData } from "./ControlFields";
export default function SalesSummary({ rows }: { rows: RecordData[] }) {
  const completed = rows.filter((r) => r.status === "completed" || r.status === "replaced");
  const revenue = completed.reduce((sum, r) => sum + Number(r.amount), 0);
  const regions = new Map<string, number>();
  for (const r of completed)
    regions.set(String(r.region), (regions.get(String(r.region)) || 0) + Number(r.amount));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Recorded revenue", `₹${revenue.toLocaleString("en-IN")}`],
          ["Orders", rows.length],
          ["Returns", rows.filter((r) => r.status === "returned").length],
          ["Replacements", rows.filter((r) => r.status === "replaced").length],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-3 text-2xl">{value}</p>
          </div>
        ))}
      </div>
      {regions.size > 0 && (
        <div className="panel">
          <h2 className="mb-4 font-medium">Revenue by region · completed and replaced orders</h2>
          {[...regions]
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => (
              <div key={name} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span>₹{value.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 h-2 rounded bg-cream">
                  <div
                    className="h-2 rounded bg-olive"
                    style={{ width: `${revenue ? (value / revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
