import Link from "next/link";
import { ShoppingBag, MapPin, Check } from "lucide-react";
export default function ShoppingSteps({ current }: { current: "bag" | "address" }) {
  return (
    <nav
      aria-label="Shopping progress"
      className="mb-8 flex items-center justify-center gap-4 rounded-xl bg-[#f5f6f8] px-4 py-4 text-xs sm:gap-8"
    >
      <Link
        href="/cart"
        aria-current={current === "bag" ? "step" : undefined}
        className={`flex items-center gap-2 ${current === "bag" ? "font-bold text-[#333b4b]" : "text-[#737a89]"}`}
      >
        <ShoppingBag size={16} />
        Bag
      </Link>
      <span className="h-px w-5 bg-[#d6dae2] sm:w-12" />
      <span
        aria-current={current === "address" ? "step" : undefined}
        className={`flex items-center gap-2 ${current === "address" ? "font-bold text-[#333b4b]" : "text-[#737a89]"}`}
      >
        <MapPin size={16} />
        Address
      </span>
      <span className="h-px w-5 bg-[#d6dae2] sm:w-12" />
      <span className="flex items-center gap-2 text-[#737a89]">
        <Check size={16} />
        Review
      </span>
    </nav>
  );
}
