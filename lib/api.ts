import type { Product } from "./types";
import { cache } from "react";
import type { Storefront } from "./store-types";
export const getStorefront = cache(async (): Promise<Storefront> => {
  const response = await fetch(`${origin}/api/storefront`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Store settings are temporarily unavailable.");
  return response.json();
});
const origin = process.env.API_URL || "http://127.0.0.1:4000";
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${origin}/api/products`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("The catalog is temporarily unavailable.");
  return response.json();
}
export async function getProduct(slug: string): Promise<Product | null> {
  const response = await fetch(`${origin}/api/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("The product is temporarily unavailable.");
  return response.json();
}
export const siteUrl = process.env.SITE_URL || "http://localhost:3000";
