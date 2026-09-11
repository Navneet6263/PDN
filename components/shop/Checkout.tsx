"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import type { Quote } from "./Cart";
import { useShopping } from "./ShoppingProvider";
type Data = Quote & { address: Record<string, string> | null; message?: string };
export default function Checkout() {
  const { customer, ready, items, error: bagError, refresh } = useShopping();
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null);
    setSaved(false);
    if (customer && ready)
      request<Data>("/customer/checkout")
        .then((d) => {
          if (live) setData(d);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    return () => {
      live = false;
    };
  }, [customer, ready, items]);
  if (!ready)
    return (
      <p>
        {bagError || "Loading checkout..."}
        {bagError && (
          <button onClick={() => void refresh()} className="ml-2 underline">
            Retry
          </button>
        )}
      </p>
    );
  if (!customer)
    return (
      <div>
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="my-5">Your guest bag will be kept when you sign in.</p>
        <Link href="/account" className="btn-primary">
          Sign in / create account
        </Link>
      </div>
    );
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      {error && (
        <p role="alert" className="mb-5 text-red-700">
          {error}
        </p>
      )}
      {!data ? (
        <p>Checking your bag...</p>
      ) : !data.valid ? (
        <div>
          <p>Your bag is empty or contains unavailable items.</p>
          <Link href="/cart" className="mt-4 inline-block text-pink-600 underline">
            Review your bag
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 md:grid-cols-[1fr_320px]">
          <form
            className="space-y-4 rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-7"
            onChange={() => setSaved(false)}
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const d = await request<Data>(
                  "/customer/checkout",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                setData(d);
                setSaved(true);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2 className="text-lg font-bold">Delivery address</h2>
            {[
              ["name", "Full name", "name"],
              ["phone", "Mobile number", "tel"],
              ["line", "House, street & locality", "street-address"],
              ["city", "City", "address-level2"],
              ["state", "State", "address-level1"],
              ["pin", "PIN code", "postal-code"],
            ].map(([name, label, auto]) => (
              <label key={name} className="block text-sm">
                {label}
                <input
                  required
                  name={name}
                  autoComplete={auto}
                  defaultValue={data.address?.[name] || (name === "name" ? customer.name : "")}
                  pattern={
                    name === "phone" ? "[6-9][0-9]{9}" : name === "pin" ? "[0-9]{6}" : undefined
                  }
                  inputMode={["phone", "pin"].includes(name) ? "numeric" : "text"}
                  minLength={name === "line" ? 8 : 2}
                  maxLength={name === "phone" ? 10 : name === "pin" ? 6 : 300}
                  className="mt-2 w-full rounded border p-3"
                />
              </label>
            ))}
            <button
              disabled={busy}
              className="w-full rounded bg-[#ff3f6c] p-4 text-sm font-bold text-white"
            >
              {busy ? "Saving..." : "Save address & review"}
            </button>
            {saved && (
              <p role="status" className="rounded bg-green-50 p-4 text-sm">
                {data.message}
              </p>
            )}
          </form>
          <aside className="space-y-4 rounded-2xl border border-[#e9ebef] bg-white p-5 sm:p-7">
            <h2 className="font-bold">Review your bag</h2>
            {data.lines.map((i, n) => (
              <div key={n} className="flex gap-3 border-b pb-3 text-xs">
                <img src={i.image} alt="" className="h-16 w-12 rounded object-cover" />
                <div>
                  <p className="font-bold">{i.name}</p>
                  <p className="my-1">
                    {i.size} · Qty {i.quantity}
                  </p>
                  <p>{money(i.price * i.quantity)}</p>
                </div>
              </div>
            ))}
            <p className="flex justify-between text-sm">
              <span>Items subtotal</span>
              <strong>{money(data.subtotal)}</strong>
            </p>
            <p className="text-xs leading-5 text-gray-500">
              Ordering has not launched yet. No payment is collected and no order is placed here.
              Your bag and address stay saved.
            </p>
            <Link href="/cart" className="block text-sm text-pink-600 underline">
              Edit bag
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
