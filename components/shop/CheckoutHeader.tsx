import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getStorefront } from "@/lib/api";

const steps = [
  ["bag", "Bag", "/cart"],
  ["address", "Address", "/checkout"],
  ["payment", "Payment", "/checkout/payment"],
] as const;

// Myntra-style focused header for the bag → address → payment flow: no menus
// to wander off into, just where you are and that it is secure.
export default async function CheckoutHeader({
  current,
}: {
  current: "bag" | "address" | "payment";
}) {
  const { settings } = await getStorefront();
  const at = steps.findIndex(([key]) => key === current);
  return (
    <header className="sticky top-0 z-30 border-b border-[#eaeaec] bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-8">
        <Link
          href="/"
          aria-label={`${settings.storeName} home`}
          className="flex shrink-0 items-center gap-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff3f6c] text-2xl font-black italic text-white sm:h-9 sm:w-9">
            t
          </span>
          <span className="hidden text-base font-extrabold sm:inline">
            {settings.storeName}
          </span>
        </Link>
        <nav aria-label="Checkout progress">
          <ol className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] sm:gap-3 sm:text-xs">
            {steps.map(([key, label, href], n) => (
              <li key={key} className="flex items-center gap-1.5 sm:gap-3">
                {n > 0 && (
                  <span
                    aria-hidden="true"
                    className={`h-px w-4 border-t border-dashed sm:w-16 ${n <= at ? "border-[#20bd99]" : "border-[#bdbec6]"}`}
                  />
                )}
                {n < at ? (
                  <Link href={href} className="text-[#20bd99]">
                    {label}
                  </Link>
                ) : (
                  <span
                    aria-current={n === at ? "step" : undefined}
                    className={
                      n === at
                        ? "border-b-2 border-[#20bd99] pb-0.5 text-[#20bd99]"
                        : "text-[#696e79]"
                    }
                  >
                    {label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#535766] sm:text-xs">
          <ShieldCheck size={22} className="text-[#20bd99]" />
          <span className="hidden sm:inline">100% Secure</span>
        </p>
      </div>
    </header>
  );
}
