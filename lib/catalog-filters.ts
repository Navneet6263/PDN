import type { Product } from "./types";
export type FilterValues = {
  category: string;
  type: string;
  budget: number;
  available: boolean;
  sizes: string[];
  colors: string[];
};
export const emptyFilters: FilterValues = {
  category: "all",
  type: "all",
  budget: 10000000,
  available: false,
  sizes: [],
  colors: [],
};
export function matchesFilters(p: Product, f: FilterValues) {
  return (
    (f.category === "all" || p.category === f.category) &&
    (f.type === "all" || p.subCategory === f.type) &&
    p.price <= f.budget &&
    (!f.available || p.stock > 0) &&
    (!f.sizes.length ||
      f.sizes.some((size) => (p.sizes.length ? p.sizes : ["One size"]).includes(size))) &&
    (!f.colors.length || f.colors.some((color) => p.colors.includes(color)))
  );
}
export const filterCount = (f: FilterValues) =>
  Number(f.category !== "all") +
  Number(f.type !== "all") +
  Number(f.budget < 10000000) +
  Number(f.available) +
  f.sizes.length +
  f.colors.length;
