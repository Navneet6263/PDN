export type Category = string;
export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  subCategory: string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  gallery: string[];
  description: string;
  sizes: string[];
  colors: string[];
  material: string;
  care: string;
  returnPolicy: string;
  exchangePolicy: string;
  shippingInfo: string;
  warrantyInfo: string;
  additionalInfo: string;
  packageContents: { name: string; quantity: number }[];
  featured: boolean;
  topTenRank: number | null;
  displayOrder: number;
  searchPriority: number;
  searchKeywords: string[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  reviewCount?: number;
  ratingAverage?: number | null;
};
export const categories: Category[] = ["women", "men", "kids", "accessories"];
export const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
