import { productSchema } from "../server/validation";
import { clothing } from "./sample-clothing";
import { lifestyle } from "./sample-lifestyle";
const rows = [...clothing, ...lifestyle];
export const sampleProducts = rows.map(
  ([name, category, subCategory, photo, price, originalPrice, color, material, packet], index) => {
    const image = photo.startsWith("sample/")
      ? `/images/${photo}.${photo.includes("girls-lehenga") ? "png" : "jpg"}`
      : `/images/products/${photo}.jpg`;
    const slug = `sample-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return productSchema.parse({
      name,
      slug,
      category,
      subCategory,
      brand:
        category === "kids"
          ? "Terra Mini"
          : category === "women"
            ? "Terra Ethnic"
            : category === "men"
              ? "Terra Everyday"
              : "Terra Studio",
      price,
      originalPrice,
      stock: 12 + (index % 8),
      image,
      gallery: [image],
      material,
      colors: [color],
      sizes:
        category === "kids"
          ? ["3–4Y", "5–6Y", "7–8Y", "9–10Y"]
          : category === "footwear"
            ? ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9"]
            : ["accessories", "beauty", "home"].includes(category) || subCategory === "Sarees"
              ? ["One Size"]
              : ["S", "M", "L", "XL", "XXL"],
      description: `${name} from our ${subCategory.toLowerCase()} edit. An easy way to explore ${category === "kids" ? "festive styles for little ones" : "a fresh look for your wardrobe"}. This is a sample catalog listing for website preview; the photo is representative and may be shared with other sample styles. Replace specifications, prices and stock with verified details before selling.`,
      care: "Sample care information. Follow the final garment label.",
      packageContents: packet.map((name) => ({ name, quantity: 1 })),
      published: true,
      featured: index % 3 === 0,
      displayOrder: index + 1,
      topTenRank: null,
      searchPriority: 100 - index,
      searchKeywords: [
        subCategory.toLowerCase(),
        category,
        "sample",
        ...(category === "kids" ? ["children", "bacho", "baccho"] : []),
      ],
      seoTitle: name,
      seoDescription: `Explore ${name} in the Terra sample fashion collection. View the design and package contents.`,
      additionalInfo:
        "Sample product for storefront preview. Photos and prices are illustrative; no order or payment is collected on this website.",
    });
  },
);
export const sampleCategories = [
  {
    slug: "women",
    label: "Women",
    image: "/images/products/anarkali-suit.jpg",
    subCategories: ["Sarees", "Kurta Sets", "Kurtis", "Lehengas", "Anarkalis"],
  },
  {
    slug: "men",
    label: "Men",
    image: "/images/products/chikankari-kurta.jpg",
    subCategories: ["Kurtas", "T-Shirts", "Jeans", "Nehru Jackets", "Sherwanis"],
  },
  {
    slug: "kids",
    label: "Kids",
    image: "/images/sample/girls-lehenga.png",
    subCategories: ["Girls Ethnic Wear", "Boys Ethnic Wear"],
  },
  {
    slug: "footwear",
    label: "Footwear",
    image: "/images/sample/red-sneakers.jpg",
    subCategories: ["Sneakers", "Sports Shoes"],
  },
  {
    slug: "accessories",
    label: "Accessories",
    image: "/images/sample/tan-handbag.jpg",
    subCategories: ["Bags & Clutches", "Jewellery"],
  },
  {
    slug: "beauty",
    label: "Beauty",
    image: "/images/sample/beauty-edit.jpg",
    subCategories: ["Makeup"],
  },
  {
    slug: "home",
    label: "Home",
    image: "/images/sample/home-edit.jpg",
    subCategories: ["Home Decor"],
  },
];
