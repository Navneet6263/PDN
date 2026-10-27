import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, Check, ArrowLeft } from "lucide-react";
import { getProduct, getStorefront, getProducts, siteUrl } from "@/lib/api";
import { money } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import ProductCard from "@/components/ProductCard";
import ProductPurchase from "@/components/shop/ProductPurchase";
import ProductReviews from "@/components/shop/ProductReviews";
type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  const { settings } = await getStorefront();
  return {
    title: { absolute: p.seoTitle || `${p.name} | ${settings.storeName}` },
    description: p.seoDescription || p.description.slice(0, 160),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      siteName: settings.storeName,
      title: p.name,
      description: p.description.slice(0, 160),
      images: [p.image],
    },
  };
}
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const { settings, categories } = await getStorefront();
  const department =
    categories.find((c) => c.slug === p.category)?.label || p.category;
  const related = (await getProducts())
    .filter((item) => item.category === p.category && item.id !== p.id)
    .slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.gallery.map((src) => new URL(src, siteUrl).href),
    sku: p.id,
    brand: { "@type": "Brand", name: p.brand },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${p.slug}`,
      priceCurrency: "INR",
      price: p.price,
      availability: `https://schema.org/${p.stock ? "InStock" : "OutOfStock"}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  return (
    <div className="storefront">
      <Header />
      <main className="shell py-8 md:py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap gap-2 text-xs text-muted"
        >
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/?category=${p.category}#catalog`}>{department}</Link>
          <span>/</span>
          <span className="text-ink">{p.name}</span>
        </nav>
        <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-16">
          <ProductGallery
            images={[p.image, ...p.gallery.filter((src) => src !== p.image)]}
            name={p.name}
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#7b8190]">
              {p.brand} / {p.subCategory}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#303746] lg:text-4xl">
              {p.name}
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-2xl font-bold tracking-tight">
                {money(p.price)}
              </span>
              {p.originalPrice > p.price && (
                <s className="text-sm text-muted">{money(p.originalPrice)}</s>
              )}
            </div>
            <p
              className={`mt-4 flex items-center gap-2 text-xs ${p.stock ? "text-olive" : "text-red-700"}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${p.stock ? "bg-olive" : "bg-red-700"}`}
              />
              {p.stock === 0
                ? "Currently out of stock"
                : p.stock <= 5
                  ? `Only ${p.stock} left in stock`
                  : "In stock"}
            </p>
            <ProductPurchase product={p} />
            <div className="mt-7">
              <h2 className="text-sm font-semibold">The details</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#737a87]">
                {p.description}
              </p>
            </div>
            <section className="mt-7 rounded-2xl bg-[#f5f6f8] p-5 sm:p-6">
              <h2 className="flex items-center gap-3 text-base">
                <PackageCheck size={20} className="text-[#798294]" />
                What’s in the package
              </h2>
              <ul className="mt-5 space-y-3">
                {p.packageContents.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="flex items-start gap-3">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-[#798294]"
                      />
                      {item.name}
                    </span>
                    <span className="shrink-0 text-muted">
                      × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t pt-4 text-[11px] leading-5 text-muted">
                Package includes only the items listed above. Styling props
                shown in photos are not included unless listed.
              </p>
            </section>
            <div className="mt-7 divide-y border-y">
              {[
                ["Material & fabric", p.material],
                ["Care instructions", p.care],
                ["Exchange rules", p.exchangePolicy || settings.exchangePolicy],
                [
                  "Return & refund rules",
                  p.returnPolicy || settings.returnPolicy,
                ],
                [
                  "Shipping & delivery information",
                  p.shippingInfo || settings.shippingInfo,
                ],
                [
                  "Warranty / guarantee",
                  p.warrantyInfo || settings.warrantyInfo,
                ],
                ["Additional product information", p.additionalInfo],
              ]
                .filter(([, v]) => v)
                .map(([title, value]) => (
                  <details
                    key={title}
                    className="group py-4"
                    open={title === "Additional product information"}
                  >
                    <summary className="cursor-pointer text-sm font-medium text-[#515968]">
                      {title}
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                      {value}
                    </p>
                  </details>
                ))}
            </div>
            <Link href="/#catalog" className="btn-outline mt-7">
              <ArrowLeft size={15} /> Continue exploring
            </Link>
          </div>
        </div>
        <ProductReviews productId={p.id} />
        {related.length > 0 && (
          <section className="py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#7b8190]">
              A few more favourites
            </p>
            <h2 className="mb-8 mt-3 text-2xl font-bold tracking-tight">
              You might also love
            </h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
