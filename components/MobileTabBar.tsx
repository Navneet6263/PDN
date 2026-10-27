"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Package,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useShopping } from "./shop/ShoppingProvider";

// App-style bottom navigation for phones. Product pages hide it because they
// show their own sticky "Add to bag" bar.
export default function MobileTabBar({
  onCategories,
}: {
  onCategories: () => void;
}) {
  const path = usePathname();
  const { items, customer } = useShopping();
  if (path.startsWith("/product/")) return null;
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const tab =
    "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold";
  const on = (active: boolean) =>
    active ? "text-[#ff3f6c]" : "text-[#535766]";
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#eaeaec] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
    >
      <Link href="/" className={`${tab} ${on(path === "/")}`}>
        <Home size={20} />
        Home
      </Link>
      <button
        type="button"
        onClick={onCategories}
        className={`${tab} ${on(false)}`}
      >
        <LayoutGrid size={20} />
        Categories
      </button>
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new Event("terra-open-style"));
          if (!document.getElementById("style-studio"))
            window.location.href = "/#style-studio";
        }}
        className={`${tab} ${on(false)}`}
      >
        <Sparkles size={20} />
        My style
      </button>
      <Link
        href={customer ? "/orders" : "/account"}
        className={`${tab} ${on(path.startsWith("/orders") || path === "/account")}`}
      >
        {customer ? <Package size={20} /> : <UserRound size={20} />}
        {customer ? "Orders" : "Login"}
      </Link>
      <Link href="/cart" className={`${tab} relative ${on(path === "/cart")}`}>
        <ShoppingBag size={20} data-bag-target />
        {count > 0 && (
          <span className="absolute left-1/2 top-1 ml-1.5 min-w-[18px] rounded-full bg-[#ff3f6c] px-1 text-center text-[10px] leading-[18px] text-white">
            {count}
          </span>
        )}
        Bag
      </Link>
    </nav>
  );
}
