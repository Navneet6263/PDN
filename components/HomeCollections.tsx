import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import type { Storefront } from "@/lib/store-types";
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
  const types = Array.from(
    {
      length: Math.max(
        0,
        ...store.categories.map((c) => c.subCategories.length),
      ),
    },
    (_, index) =>
      store.categories.flatMap((c) => {
        const type = c.subCategories[index];
        return type
          ? [
              {
                category: c,
                type,
                products: products.filter(
                  (p) => p.category === c.slug && p.subCategory === type,
                ),
              },
            ]
          : [];
      }),
  )
    .flat()
    .filter((item) => item.products.length)
    .slice(0, 12);
  return (
    <section className="shell py-9 md:py-12">
      <SectionHeading
        title="Shop by category"
        subtitle="Find your next favourite"
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {types.map(({ category, type, products: items }) => (
          <Link
            key={`${category.slug}-${type}`}
            href={`/?category=${category.slug}&type=${encodeURIComponent(type)}#catalog`}
            className="group overflow-hidden rounded-lg border border-[#f0e6e1] bg-[#fff6f1]"
          >
            <div className="aspect-[4/4.5] overflow-hidden">
              <img
                src={items[0].image}
                alt={type}
                loading="lazy"
                className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-3 text-center">
              <h3 className="text-xs font-bold text-[#51352f] sm:text-sm">
                {type}
              </h3>
              <p className="mt-1 text-[10px] text-[#a06752] sm:text-xs">
                From ₹
                {Math.min(...items.map((p) => p.price)).toLocaleString("en-IN")}
              </p>
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
          className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#5b5e6e] hover:text-[#ff3f6c]"
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
