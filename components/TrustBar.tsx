import { Banknote, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import type { StoreSettings } from "@/lib/store-types";

// Promises shown here come straight from Store Settings, so the strip never
// claims something the checkout does not do.
export default function TrustBar({ settings: s }: { settings: StoreSettings }) {
  const items = [
    {
      icon: Truck,
      title:
        s.freeShippingAbove > 0
          ? `Free delivery over ₹${s.freeShippingAbove.toLocaleString("en-IN")}`
          : s.shippingFee === 0
            ? "Free delivery"
            : "Delivery across India",
      text: "Shipped to your door",
    },
    s.codEnabled && {
      icon: Banknote,
      title: "Cash on delivery",
      text: "Pay when it arrives",
    },
    {
      icon: ShieldCheck,
      title: "Secure payments",
      text: "UPI, cards & net banking",
    },
    {
      icon: PackageCheck,
      title: "Track every order",
      text: "Live status in My Orders",
    },
  ].filter(Boolean) as { icon: typeof Truck; title: string; text: string }[];
  return (
    <section aria-label="Why shop with us" className="shell pt-6">
      <ul className="grid grid-cols-2 gap-3 rounded-xl border border-[#f0e6e1] bg-white p-4 md:grid-cols-4 md:p-5">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0f3] text-[#ff3f6c]">
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[#282c3f] sm:text-sm">
                {title}
              </span>
              <span className="block text-[11px] text-[#7e818c]">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
