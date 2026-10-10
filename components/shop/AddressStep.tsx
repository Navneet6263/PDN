"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, MapPin, Pencil } from "lucide-react";
import { request } from "@/lib/shopping";
import { money } from "@/lib/types";
import { orderTotals } from "@/lib/orders";
import { useShopping } from "./ShoppingProvider";
import { bagTotals, useCheckout, type CheckoutData } from "./useCheckout";
import PriceBreakup from "./PriceBreakup";
import BagLines from "./BagLines";
import SignInPrompt from "./SignInPrompt";

const fields = [
  ["name", "Full name", "name"],
  ["phone", "Mobile number", "tel"],
  ["pin", "PIN code", "postal-code"],
  ["line", "House no., building, street, area", "street-address"],
  ["city", "City / district", "address-level2"],
  ["state", "State", "address-level1"],
] as const;

export default function AddressStep() {
  const { customer, ready, error: bagError, refresh } = useShopping();
  const router = useRouter();
  const { data, setData, error } = useCheckout();
  const [editing, setEditing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  if (!ready)
    return (
      <p className="py-10 text-center text-sm">
        {bagError || "Loading..."}
        {bagError && (
          <button onClick={() => void refresh()} className="ml-2 underline">
            Retry
          </button>
        )}
      </p>
    );
  if (!customer) return <SignInPrompt />;
  if (error) return <p role="alert">{error}</p>;
  if (!data)
    return <p className="py-10 text-center text-sm">Checking your bag...</p>;
  if (!data.valid)
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-[#f5f5f6] p-8 text-center">
        <p className="font-bold">
          Your bag is empty or has items that are no longer available.
        </p>
        <Link href="/cart" className="btn-primary mt-5">
          Review bag
        </Link>
      </div>
    );
  const showForm = editing ?? !data.address;
  const { mrp, units } = bagTotals(data);
  const t = orderTotals(data.subtotal, data.options.charges, "online");
  const proceed = () => router.push("/checkout/payment");

  return (
    <div className="grid items-start gap-6 pb-24 lg:grid-cols-[1fr_360px] lg:pb-0">
      <section className="rounded-2xl border border-[#eaeaec] bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <MapPin size={18} /> Delivery address
          </h1>
          {data.address && !showForm && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded border border-[#d4d5d9] px-3 py-1.5 text-xs font-bold"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        {data.address && !showForm ? (
          <div className="rounded-xl border-2 border-[#ff3f6c] bg-[#fff8fa] p-4 text-sm leading-6">
            <p className="flex items-center gap-2 font-bold">
              {data.address.name}
              <span className="flex items-center gap-1 rounded-full border border-[#20bd99] px-2 text-[10px] font-bold uppercase text-[#20bd99]">
                <Home size={11} /> Home
              </span>
            </p>
            <p>{data.address.line}</p>
            <p>
              {data.address.city}, {data.address.state} – {data.address.pin}
            </p>
            <p className="mt-1">
              Mobile: <strong>{data.address.phone}</strong>
            </p>
          </div>
        ) : (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setFormError("");
              try {
                const d = await request<CheckoutData>(
                  "/customer/checkout",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                setData(d);
                setEditing(false);
              } catch (err) {
                setFormError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {fields.map(([name, label, auto]) => (
              <label
                key={name}
                className={`block text-sm ${name === "line" ? "sm:col-span-2" : ""}`}
              >
                {label}
                <input
                  required
                  name={name}
                  autoComplete={auto}
                  defaultValue={
                    data.address?.[name] ||
                    (name === "name" ? customer.name : "")
                  }
                  pattern={
                    name === "phone"
                      ? "[6-9][0-9]{9}"
                      : name === "pin"
                        ? "[0-9]{6}"
                        : undefined
                  }
                  title={
                    name === "phone"
                      ? "10-digit mobile number starting with 6–9"
                      : name === "pin"
                        ? "6-digit PIN code"
                        : undefined
                  }
                  inputMode={
                    name === "phone" || name === "pin" ? "numeric" : "text"
                  }
                  minLength={name === "line" ? 8 : 2}
                  maxLength={name === "phone" ? 10 : name === "pin" ? 6 : 300}
                  className="mt-1.5 w-full rounded-md border border-[#d4d5d9] p-3 text-base sm:text-sm"
                />
              </label>
            ))}
            {formError && (
              <p role="alert" className="text-sm text-red-700 sm:col-span-2">
                {formError}
              </p>
            )}
            <div className="flex gap-3 sm:col-span-2">
              <button
                disabled={busy}
                className="flex-1 rounded-md bg-[#ff3f6c] p-3.5 text-sm font-bold uppercase tracking-wide text-white"
              >
                {busy ? "Saving..." : "Save address"}
              </button>
              {data.address && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border px-5 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <aside className="space-y-5 rounded-2xl border border-[#eaeaec] bg-white p-4 sm:p-6 lg:sticky lg:top-24">
        <BagLines lines={data.lines} />
        <PriceBreakup
          mrp={mrp}
          items={units}
          subtotal={t.subtotal}
          shippingFee={t.shippingFee}
          codFee={0}
          total={t.total}
        />
        <button
          disabled={!data.address || showForm}
          onClick={proceed}
          className="hidden w-full rounded-md bg-[#ff3f6c] p-4 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50 lg:block"
        >
          Continue to payment
        </button>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t bg-white px-4 py-3 shadow-[0_-4px_16px_#0000000f] lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{money(t.total)}</p>
          <p className="text-[11px] text-gray-500">
            {units} items · incl. delivery
          </p>
        </div>
        <button
          disabled={!data.address || showForm}
          onClick={proceed}
          className="rounded-md bg-[#ff3f6c] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
