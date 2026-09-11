import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Catalog from "@/components/Catalog";
import { getProducts, getStorefront } from "@/lib/api";
type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = await getStorefront(),
    banner = store.banners.find((b) => b.id === id && b.destination === "collection");
  if (!banner) return { title: "Collection unavailable", robots: { index: false } };
  return {
    title: banner.title,
    description: banner.subtitle,
    alternates: { canonical: `/collection/${id}` },
    openGraph: { title: banner.title, description: banner.subtitle, images: [banner.image] },
  };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  const [store, all] = await Promise.all([getStorefront(), getProducts()]);
  const banner = store.banners.find((b) => b.id === id && b.destination === "collection");
  if (!banner) notFound();
  const selected = banner.productIds || [];
  const products = selected.flatMap((id, index) => {
    const p = all.find((p) => p.id === id);
    return p ? [{ ...p, displayOrder: index }] : [];
  });
  const collectionStore = {
    ...store,
    settings: {
      ...store.settings,
      catalogTitle: "Shop this collection",
      catalogSubtitle: "Picked for your celebration",
    },
  };
  return (
    <div className="storefront">
      <Header />
      <main>
        <section className="shell pt-7">
          <Link href="/" className="text-xs text-gray-500">
            Home / Collections
          </Link>
          <div className="mt-5 grid overflow-hidden rounded-2xl bg-[#fff1f5] sm:grid-cols-2">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-pink-600">
                {banner.eyebrow || "The occasion edit"}
              </p>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{banner.title}</h1>
              <p className="mt-4 text-sm leading-6 text-gray-600">{banner.subtitle}</p>
              <a href="#catalog" className="mt-5 text-sm font-bold text-pink-600">
                Explore {products.length} selected styles ↓
              </a>
            </div>
            <picture>
              <source media="(max-width:640px)" srcSet={banner.mobileImage || banner.image} />
              <img
                src={banner.image}
                alt={banner.title}
                className="h-64 w-full object-cover object-top sm:h-80"
              />
            </picture>
          </div>
        </section>
        <Suspense>
          <Catalog products={products} store={collectionStore} curated />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
