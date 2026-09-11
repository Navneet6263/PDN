"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { cartSchema, mergeCart, request, type CartItem, type Customer } from "@/lib/shopping";
const storageKey = "terra-guest-bag-v1";
type Guest = { token: string; items: CartItem[] };
type State = {
  items: CartItem[];
  customer: Customer | null;
  ready: boolean;
  busy: boolean;
  error: string;
  change: (items: CartItem[]) => Promise<void>;
  add: (item: CartItem) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export const useShopping = () => useContext(Context)!;
function readGuest(): Guest {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    const data = JSON.parse(raw);
    return { token: data.token, items: cartSchema.parse(data.items) };
  }
  return { token: crypto.randomUUID(), items: [] };
}
export default function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]),
    [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function refresh() {
    setReady(false);
    try {
      let user: Customer | null = null;
      const response = await fetch("/api/customer/me");
      if (response.ok) user = await response.json();
      else if (response.status !== 401)
        throw new Error("Unable to load your account. Please retry.");
      setCustomer(user);
      const guest = readGuest();
      if (user) {
        const saved = guest.items.length
          ? await request<CartItem[]>("/customer/cart/merge", guest)
          : await request<CartItem[]>("/customer/cart");
        setItems(saved);
        localStorage.removeItem(storageKey);
      } else setItems(guest.items);
      setError("");
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function change(next: CartItem[]) {
    if (lock.current || !ready) throw new Error("Please wait for your bag to finish loading.");
    lock.current = true;
    setBusy(true);
    try {
      const validated = cartSchema.parse(next);
      if (customer) setItems(await request<CartItem[]>("/customer/cart", validated, "PUT"));
      else {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ token: crypto.randomUUID(), items: validated }),
        );
        setItems(validated);
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    await request("/customer/logout", {});
    setCustomer(null);
    setItems([]);
    await refresh();
  }
  return (
    <Context.Provider
      value={{
        items,
        customer,
        ready,
        busy,
        error,
        change,
        add: (i) => change(mergeCart(items, [i])),
        refresh,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
