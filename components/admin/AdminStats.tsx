import { Package, Eye, AlertTriangle, Layers } from "lucide-react";
import type { Product } from "@/lib/types";
export default function AdminStats({ products }: { products: Product[] }) {
  const stats = [
    {
      label: "Total products",
      value: products.length,
      icon: Package,
      detail: "Your complete collection",
    },
    {
      label: "Published",
      value: products.filter((p) => p.published).length,
      icon: Eye,
      detail: "Visible to your customers",
    },
    {
      label: "Low stock",
      value: products.filter((p) => p.stock <= 5).length,
      icon: AlertTriangle,
      detail: "5 or fewer units remaining",
    },
    {
      label: "Categories",
      value: new Set(products.map((p) => p.category)).size,
      icon: Layers,
      detail: "Across your collection",
    },
  ];
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, detail }) => (
        <div key={label} className="panel">
          <div className="flex items-center justify-between text-xs text-muted">
            {label}
            <Icon size={17} className="text-olive" />
          </div>
          <p className="my-4 text-3xl font-medium">{value}</p>
          <p className="text-[10px] text-muted">{detail}</p>
        </div>
      ))}
    </div>
  );
}
