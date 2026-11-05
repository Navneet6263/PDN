import {
  Banknote,
  Gift,
  Heart,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { StoreSettings, TrustItem } from "@/lib/store-types";

const icons: Record<TrustItem["icon"], LucideIcon> = {
  truck: Truck,
  cod: Banknote,
  secure: ShieldCheck,
  track: PackageCheck,
  returns: RotateCcw,
  gift: Gift,
  sparkle: Sparkles,
  heart: Heart,
};

// Admin can write their own items; otherwise the strip is built from the
// store's real delivery and COD settings so it never over-promises.
export function trustItems(s: StoreSettings): TrustItem[] {
  if (s.trustItems?.length) return s.trustItems;
  return [
    {
      icon: "truck" as const,
      title:
        s.freeShippingAbove > 0
          ? `Free delivery over ₹${s.freeShippingAbove.toLocaleString("en-IN")}`
          : s.shippingFee === 0
            ? "Free delivery"
            : "Delivery across India",
      text: "Shipped to your door",
    },
    ...(s.codEnabled
      ? [
          {
            icon: "cod" as const,
            title: "Cash on delivery",
            text: "Pay when it arrives",
          },
        ]
      : []),
    {
      icon: "secure" as const,
      title: "Secure payments",
      text: "UPI, cards & net banking",
    },
    {
      icon: "track" as const,
      title: "Track every order",
      text: "Live status in My Orders",
    },
  ];
}

export default function TrustBar({ settings }: { settings: StoreSettings }) {
  const items = trustItems(settings);
  return (
    <section aria-label="Why shop with us" className="shell pt-5">
      <ul
        className={`grid grid-cols-2 gap-2 rounded-3xl border border-[#f3e4e8] bg-gradient-to-r from-[#fff7f9] via-white to-[#fbf5ee] p-2 sm:gap-3 ${items.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}
      >
        {items.map(({ icon, title, text }) => {
          const Icon = icons[icon] || Sparkles;
          return (
            <li
              key={title}
              className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-[0_6px_20px_-14px_rgba(61,31,53,0.4)] sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffe3ea] to-[#fff4e6] text-[#e0315c]">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[#3d1f35] sm:text-[13px]">
                  {title}
                </span>
                <span className="block text-[11px] leading-4 text-[#8a7383]">
                  {text}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
