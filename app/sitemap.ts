import type { MetadataRoute } from "next";
import { getProducts, getStorefront, siteUrl } from "@/lib/api";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, store] = await Promise.all([getProducts(), getStorefront()]);
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...store.banners
      .filter((b) => b.destination === "collection")
      .map((b) => ({
        url: `${siteUrl}/collection/${b.id}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...products.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
