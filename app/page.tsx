import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoreHero from "@/components/StoreHero";
import Catalog from "@/components/Catalog";
import StyleStudio from "@/components/style/StyleStudio";
import TrustBar from "@/components/TrustBar";
import ProductRail from "@/components/ProductRail";
import GlassBanner from "@/components/GlassBanner";
import { CategoryShop, DepartmentStrip } from "@/components/HomeCollections";
import { getProducts, getStorefront } from "@/lib/api";
import { topTenProducts } from "@/lib/catalog-order";
import { bannerLink } from "@/lib/banner-link";
import { homeLayout, type HomeSectionId } from "@/lib/store-types";
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
  const inStock = products.filter((p) => p.stock > 0);
  const promos = store.banners.filter((b) => b.slot === "promo");
  const bestsellers = [...products]
    .filter((p) => (p.sold || 0) > 0)
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 10);
  // Every block the admin can arrange in Homepage & Footer.
  const blocks: Record<HomeSectionId, () => ReactNode> = {
    hero: () => <StoreHero store={store} />,
    trust: () => <TrustBar settings={s} />,
    style: () => <StyleStudio products={products} />,
    categories: () => <CategoryShop store={store} products={products} />,
    newarrivals: () => (
      <ProductRail
        id="new-arrivals"
        eyebrow="Just landed"
        title="New arrivals"
        href="/?sort=new#catalog"
        products={inStock.slice(0, 10)}
      />
    ),
    toppicks: () =>
      s.showTopTen ? (
        <ProductRail
          id="top-ten"
          eyebrow="Chosen by our team"
          title={s.topTenTitle}
          href="/#catalog"
          products={topTenProducts(products)}
          tinted
        />
      ) : null,
    bestsellers: () => (
      <ProductRail
        id="bestsellers"
        eyebrow="Most ordered"
        title="Bestsellers"
        href="/#catalog"
        products={bestsellers}
      />
    ),
    promos: () =>
      promos.length > 0 && (
        <section className="shell grid gap-4 py-8 md:grid-cols-2 md:gap-5 md:py-12">
          {promos.map((b) => (
            <Link
              key={b.id}
              href={bannerLink(b)}
              className="block rounded-[28px]"
            >
              <GlassBanner banner={b} variant="promo" />
            </Link>
          ))}
        </section>
      ),
    catalog: () => (
      <Suspense fallback={<p className="shell py-20">Loading collection…</p>}>
        <Catalog store={store} products={products} />
      </Suspense>
    ),
    story: () =>
      s.showStory && (
        <section className="shell py-10 md:py-14">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#fff1f4] via-[#fdf6f0] to-[#f7eee8] px-6 py-12 text-center md:px-16 md:py-16">
            <div
              aria-hidden="true"
              className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#ff3f6c]/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-[#b9915a]/20 blur-3xl"
            />
            <p className="relative mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-[#e0315c]">
              Our promise
            </p>
            <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-semibold leading-tight text-[#3d1f35] md:text-5xl">
              {s.storyTitle}
            </h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#7a6573] md:text-base">
              {s.storyText}
            </p>
          </div>
        </section>
      ),
    // Rendered by the footer, which appears on every page.
    newsletter: () => null,
  };
  return (
    <div className="storefront bg-white">
      <Header />
      <main>
        <DepartmentStrip store={store} />
        {homeLayout(s)
          .filter((x) => x.visible)
          .map((x) => (
            <div key={x.id} data-section={x.id}>
              {blocks[x.id]()}
            </div>
          ))}
      </main>
      <Footer />
    </div>
  );
}
