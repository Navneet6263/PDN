import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import type { Storefront } from "@/lib/store-types";
import { SectionTitle } from "./ProductRail";
export function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#ff3f6c]">
          {subtitle}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#282c3f] md:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#ff3f6c]"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function CategoryShop({
  store,
  products,
}: {
  store: Storefront;
  products: Product[];
}) {
  // Only product types that currently have products, so no empty tiles.
  const types = store.categories
    .flatMap((c) =>
      c.subCategories.map((type) => ({
        category: c,
        type,
        products: products.filter(
          (p) => p.category === c.slug && p.subCategory === type,
        ),
      })),
    )
    .filter((item) => item.products.length)
    .slice(0, 12);
  if (!types.length) return null;
  return (
    <section className="shell py-10 md:py-14">
      <SectionTitle
        eyebrow="Find your fit"
        title="Shop by category"
        href="/#catalog"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {types.map(({ category, type, products: items }) => (
          <Link
            key={`${category.slug}-${type}`}
            href={`/?category=${category.slug}&type=${encodeURIComponent(type)}#catalog`}
            className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-[#f6efeb]"
          >
            <img
              src={items[0].image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.06]"
            />
            <div className="absolute inset-x-2 bottom-2">
              <div className="glass-light rounded-2xl px-3 py-2.5">
                <h3 className="text-[13px] font-bold leading-tight">{type}</h3>
                <p className="mt-0.5 text-[11px] text-[#7a5c6d]">
                  {items.length} {items.length === 1 ? "style" : "styles"} ·
                  from ₹
                  {Math.min(...items.map((p) => p.price)).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function DepartmentStrip({ store }: { store: Storefront }) {
  return (
    <nav
      aria-label="Shop departments"
      className="shell flex gap-5 overflow-x-auto py-5 md:justify-center md:gap-12 xl:hidden"
    >
      {store.categories.map((c) => (
        <Link
          href={`/?category=${c.slug}#catalog`}
          key={c.id}
          className="flex shrink-0 items-center gap-2 rounded-full border border-[#f3e4e8] bg-white py-1 pl-1 pr-4 text-xs font-semibold text-[#3d1f35] hover:border-[#ff3f6c] hover:text-[#ff3f6c]"
        >
          {c.image && (
            <img
              src={c.image}
              alt=""
              className="h-9 w-9 rounded-full border border-[#eee8e6] object-cover object-top"
            />
          )}
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
