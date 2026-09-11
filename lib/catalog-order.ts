import type { Product } from "./types";
import { normalizeSearch as normalized } from "./search";
export function searchScore(p: Product, query: string) {
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  const name = normalized(p.name);
  const text = normalized(
    [
      p.name,
      p.brand,
      p.category,
      p.subCategory,
      ...p.searchKeywords,
      ...(p.packageContents || []).map((i) => i.name),
    ].join(" "),
  );
  if (!terms.every((term) => text.includes(term))) return -1;
  return terms.reduce(
    (score, term) =>
      score + (name === term ? 10 : name.startsWith(term) ? 5 : name.includes(term) ? 3 : 1),
    0,
  );
}
export function orderProducts(products: Product[], query: string, sort: string) {
  return products
    .filter((p) => searchScore(p, query) >= 0)
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "new") return b.id.localeCompare(a.id);
      if (query.trim())
        return (
          b.searchPriority - a.searchPriority ||
          searchScore(b, query) - searchScore(a, query) ||
          a.displayOrder - b.displayOrder ||
          a.id.localeCompare(b.id)
        );
      return (
        a.displayOrder - b.displayOrder ||
        Number(b.featured) - Number(a.featured) ||
        b.id.localeCompare(a.id)
      );
    });
}
export const topTenProducts = (products: Product[]) =>
  products
    .filter((p) => p.published && p.stock > 0 && p.topTenRank !== null)
    .sort((a, b) => a.topTenRank! - b.topTenRank!)
    .slice(0, 10);
