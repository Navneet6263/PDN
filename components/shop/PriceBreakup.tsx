import { money } from "@/lib/types";
export default function PriceBreakup({
  mrp,
  subtotal,
  shippingFee,
  codFee,
  total,
  items,
}: {
  mrp: number;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  total: number;
  items: number;
}) {
  const saved = Math.max(0, mrp - subtotal);
  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Price details ({items} {items === 1 ? "item" : "items"})
      </h2>
      <p className="flex justify-between">
        <span>Total MRP</span>
        <span>{money(mrp)}</span>
      </p>
      {saved > 0 && (
        <p className="flex justify-between">
          <span>Discount on MRP</span>
          <span className="text-[#03a685]">−{money(saved)}</span>
        </p>
      )}
      <p className="flex justify-between">
        <span>Delivery</span>
        {shippingFee ? (
          <span>{money(shippingFee)}</span>
        ) : (
          <span className="text-[#03a685]">FREE</span>
        )}
      </p>
      {codFee > 0 && (
        <p className="flex justify-between">
          <span>Cash on delivery fee</span>
          <span>{money(codFee)}</span>
        </p>
      )}
      <p className="flex justify-between border-t pt-3 text-base font-bold">
        <span>Total amount</span>
        <span>{money(total)}</span>
      </p>
      {saved > 0 && (
        <p className="rounded bg-[#e9f7f3] px-3 py-2 text-xs font-bold text-[#03a685]">
          You save {money(saved)} on this order
        </p>
      )}
    </div>
  );
}
