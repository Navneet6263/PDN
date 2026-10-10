"use client";
import Link from "next/link";
import { Package, ShoppingBag, UserRound } from "lucide-react";
import { useShopping } from "./ShoppingProvider";
export default function BagLink() {
  const { items, customer } = useShopping();
  return (
    <div className="flex shrink-0 gap-4">
      <Link
        href="/account"
        className="flex flex-col items-center gap-1 text-[10px] font-semibold"
      >
        <UserRound size={20} />
        <span>{customer ? "Account" : "Login"}</span>
      </Link>
      {customer && (
        <Link
          href="/orders"
          className="hidden flex-col items-center gap-1 text-[10px] font-semibold sm:flex"
        >
          <Package size={20} />
          <span>Orders</span>
        </Link>
      )}
      <Link
        href="/cart"
        aria-label={`Bag, ${items.reduce((s, i) => s + i.quantity, 0)} items`}
        className="relative flex flex-col items-center gap-1 text-[10px] font-semibold"
      >
        <ShoppingBag size={20} />
        <span>Bag ({items.reduce((s, i) => s + i.quantity, 0)})</span>
      </Link>
    </div>
  );
}
