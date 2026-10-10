"use client";
import { useEffect, useState } from "react";
import { request } from "@/lib/shopping";
import type { ChargeSettings } from "@/lib/orders";
import type { Quote } from "./Cart";
import { useShopping } from "./ShoppingProvider";

export type Address = {
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
};
export type CheckoutData = Quote & {
  address: Address | null;
  options: {
    charges: ChargeSettings;
    online: { provider: string; label: string } | null;
  };
};

// Loads the signed-in customer's bag, saved address and payment options.
// `hold` stops reloading while an order is being placed (the bag empties).
export function useCheckout(hold = false) {
  const { customer, ready, items } = useShopping();
  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (hold) return;
    let live = true;
    setData(null);
    setError("");
    if (customer && ready)
      request<CheckoutData>("/customer/checkout")
        .then((d) => live && setData(d))
        .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [customer, ready, items]);
  return { data, setData, error };
}

export const bagTotals = (d: CheckoutData) => ({
  mrp: d.lines.reduce((s, l) => s + (l.mrp || l.price) * l.quantity, 0),
  units: d.lines.reduce((s, l) => s + l.quantity, 0),
});
