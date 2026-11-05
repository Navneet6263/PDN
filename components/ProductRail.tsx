import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

// A titled, horizontally scrolling row of products for the homepage.
export default function ProductRail({
  id,
  eyebrow,
  title,
  href,
  products,
  tinted = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  products: Product[];
  tinted?: boolean;
}) {
  if (!products.length) return null;
  return (
    <section
      id={id}
      className={`scroll-mt-40 py-10 md:py-14 ${tinted ? "bg-gradient-to-b from-[#fff6f8] to-white" : ""}`}
    >
      <div className="shell">
        <SectionTitle eyebrow={eyebrow} title={title} href={href} />
        <div className="-mx-1 grid auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto px-1 pb-4 [scrollbar-width:thin] sm:auto-cols-[31%] lg:auto-cols-[23%] xl:auto-cols-[19%]">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#e0315c]">
          <span className="h-px w-6 bg-[#e0315c]" />
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-[#3d1f35] md:text-[40px]">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-[#f0d7df] bg-white px-4 py-2 text-xs font-bold text-[#3d1f35] transition hover:border-[#ff3f6c] hover:text-[#ff3f6c]"
        >
          View all
          <ArrowRight
            size={14}
            className="transition group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
