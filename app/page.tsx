import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreHero from "@/components/StoreHero";
import Catalog from "@/components/Catalog";
import ProductCard from "@/components/ProductCard";
import StyleStudio from "@/components/style/StyleStudio";
import {
  CategoryShop,
  DepartmentStrip,
  DepartmentEdits,
  SectionHeading,
} from "@/components/HomeCollections";
import { getProducts, getStorefront } from "@/lib/api";
import { topTenProducts } from "@/lib/catalog-order";
import { bannerLink } from "@/lib/banner-link";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getStorefront();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      siteName: s.storeName,
      title: s.seoTitle,
      description: s.seoDescription,
      images: [s.heroImage],
    },
  };
}
export default async function Home() {
  const [products, store] = await Promise.all([getProducts(), getStorefront()]);
  const s = store.settings;
  const top = topTenProducts(products);
  return (
    <div className="storefront">
      <Header />
      <main>
        <DepartmentStrip store={store} />
        <StoreHero store={store} />
        <StyleStudio products={products} />
        <CategoryShop store={store} products={products} />
        {s.showTopTen && top.length > 0 && (
          <section id="top-ten" className="scroll-mt-40 bg-[#fff8fa] py-10 md:py-12">
            <div className="shell">
              <SectionHeading
                title={s.topTenTitle}
                subtitle="The spotlight is on"
                href="/#catalog"
              />
              <div className="grid auto-cols-[44%] grid-flow-col gap-3 overflow-x-auto pb-4 sm:auto-cols-[29%] lg:auto-cols-[18.8%]">
                {top.map((p) => (
                  <div key={p.id} className="min-w-0">
                    <p className="mb-2 text-[10px] font-bold tracking-widest text-[#cb5073]">
                      EDIT / {String(p.topTenRank).padStart(2, "0")}
                    </p>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {store.banners.some((b) => b.slot === "promo") && (
          <section className="shell grid gap-5 py-10 md:grid-cols-2">
            {store.banners
              .filter((b) => b.slot === "promo")
              .map((b) => (
                <Link
                  key={b.id}
                  href={bannerLink(b)}
                  className="group grid min-h-64 grid-cols-2 overflow-hidden rounded-xl bg-[#f3eae0]"
                >
                  <div className="flex flex-col justify-center p-6 lg:p-9">
                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#9a6959]">
                      {b.eyebrow}
                    </p>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#49332f]">
                      {b.title}
                    </h2>
                    <p className="mt-3 text-xs leading-5 text-[#856b66]">{b.subtitle}</p>
                    <span className="mt-5 text-xs font-bold text-[#af375a]">{b.buttonLabel} →</span>
                  </div>
                  <picture className="relative">
                    <source media="(max-width:640px)" srcSet={b.mobileImage || b.image} />
                    <img
                      src={b.image}
                      alt={b.title}
                      loading="lazy"
                      className="absolute h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                    />
                  </picture>
                </Link>
              ))}
          </section>
        )}
        <DepartmentEdits store={store} products={products} />
        <Suspense fallback={<p className="shell py-20">Loading collection…</p>}>
          <Catalog store={store} products={products} />
        </Suspense>
        {s.showStory && (
          <section className="border-t bg-[#fff6f1] px-6 py-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight">{s.storyTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#85818a]">{s.storyText}</p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
