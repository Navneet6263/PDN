import { money } from "@/lib/types";
import type { Quote } from "./Cart";
export default function BagLines({ lines }: { lines: Quote["lines"] }) {
  return (
    <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
      {lines.map((i, n) => (
        <li key={n} className="flex gap-3 text-xs">
          <img
            src={i.image}
            alt=""
            className="h-16 w-12 shrink-0 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-bold">{i.name}</p>
            <p className="my-1 text-gray-500">
              {i.size}
              {i.color ? ` · ${i.color}` : ""} · Qty {i.quantity}
            </p>
            <p className="font-semibold">{money(i.price * i.quantity)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
