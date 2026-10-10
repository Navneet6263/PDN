import { statusLabels, type OrderStatus } from "@/lib/orders";
const tones: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-800",
  confirmed: "bg-sky-50 text-sky-800",
  packed: "bg-indigo-50 text-indigo-800",
  shipped: "bg-violet-50 text-violet-800",
  out_for_delivery: "bg-fuchsia-50 text-fuchsia-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-stone-100 text-stone-600",
  returned: "bg-rose-50 text-rose-800",
};
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
