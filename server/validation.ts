import { z } from "zod";
const text = (max: number) => z.string().trim().max(max);
export const imageSchema = text(500).refine((value) => {
  if (value.includes("..")) return false;
  if (/^\/(?:images|media)\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}, "Use an uploaded image or a Cloudinary HTTPS URL");
export const productSchema = z
  .object({
    name: text(120).min(2),
    slug: text(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    brand: text(80).min(1),
    category: text(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    subCategory: text(80),
    price: z.number().positive().max(10000000),
    originalPrice: z.number().nonnegative().max(10000000),
    stock: z.number().int().min(0).max(1000000),
    description: text(10000).min(10),
    material: text(300),
    care: text(1000),
    returnPolicy: text(5000).default(""),
    exchangePolicy: text(5000).default(""),
    shippingInfo: text(3000).default(""),
    warrantyInfo: text(3000).default(""),
    additionalInfo: text(5000).default(""),
    sizes: z.array(text(30).min(1)).max(30),
    colors: z.array(text(40).min(1)).max(30),
    image: imageSchema,
    gallery: z.array(imageSchema).min(1).max(8),
    packageContents: z
      .array(
        z.object({
          name: text(120).min(1),
          quantity: z.number().int().min(1).max(1000),
        }),
      )
      .min(1)
      .max(30),
    featured: z.boolean(),
    topTenRank: z.number().int().min(1).max(10).nullable().default(null),
    displayOrder: z.number().int().min(0).max(100000).default(1000),
    searchPriority: z.number().int().min(0).max(1000).default(0),
    searchKeywords: z.array(text(80).min(1)).max(50).default([]),
    published: z.boolean(),
    seoTitle: text(70),
    seoDescription: text(170),
  })
  .refine((p) => p.originalPrice === 0 || p.originalPrice >= p.price, {
    message: "MRP must be at least the selling price",
    path: ["originalPrice"],
  });
