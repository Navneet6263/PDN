import { z } from "zod";
import { imageSchema } from "./validation";
const text = (max: number) => z.string().trim().max(max);
export const localLink = text(300).regex(
  /^\/(?!\/)[^\s\\]*$/,
  "Use an internal link such as /?category=women#catalog",
);
export const settingsSchema = z.object({
  storeName: text(80).min(1),
  announcement: text(250),
  heroTitle: text(150).min(1),
  heroSubtitle: text(500),
  heroEyebrow: text(100),
  heroImage: imageSchema,
  heroButtonLabel: text(50),
  heroLink: localLink,
  catalogTitle: text(120).min(1),
  catalogSubtitle: text(120),
  topTenTitle: text(120).min(1),
  showTopTen: z.boolean(),
  showStory: z.boolean(),
  storyTitle: text(200),
  storyText: text(2000),
  footerText: text(500),
  contactEmail: z.union([z.literal(""), z.email()]),
  contactPhone: text(40),
  seoTitle: text(70).min(1),
  seoDescription: text(170).min(1),
  returnPolicy: text(5000),
  exchangePolicy: text(5000),
  shippingInfo: text(3000),
  warrantyInfo: text(3000),
});
export const categorySchema = z.object({
  slug: text(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: text(80).min(1),
  image: z.union([z.literal(""), imageSchema]),
  subCategories: z.array(text(80).min(1)).max(50),
  position: z.number().int().min(0).max(1000),
  active: z.boolean(),
});
export const bannerSchema = z
  .object({
    title: text(150).min(1),
    subtitle: text(500),
    eyebrow: text(100),
    image: imageSchema,
    mobileImage: z.union([z.literal(""), imageSchema]),
    buttonLabel: text(50),
    link: localLink,
    destination: z.enum(["link", "collection"]).default("link"),
    productIds: z.array(text(100).min(1)).max(100).default([]),
    slot: z.enum(["hero", "promo"]),
    position: z.number().int().min(0).max(1000),
    active: z.boolean(),
    startsAt: z.iso.datetime().nullable(),
    endsAt: z.iso.datetime().nullable(),
  })
  .refine((b) => !b.startsAt || !b.endsAt || b.startsAt < b.endsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  })
  .refine((b) => b.destination !== "collection" || b.productIds.length > 0, {
    message: "Select at least one product for this collection.",
    path: ["productIds"],
  });
export const merchSchema = z.object({
  topTenRank: z.number().int().min(1).max(10).nullable(),
  displayOrder: z.number().int().min(0).max(100000),
  searchPriority: z.number().int().min(0).max(1000),
  searchKeywords: z.array(text(80).min(1)).max(50),
  featured: z.boolean(),
});
export const memberSchema = z.object({
  name: text(80).min(1),
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(["admin", "support", "inventory"]),
  active: z.boolean(),
  password: z.union([z.literal(""), z.string().min(8).max(200)]).optional(),
});
export const ticketSchema = z.object({
  customer: text(120).min(1),
  email: z.email(),
  subject: text(200).min(1),
  message: text(10000).min(1),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "pending", "resolved"]),
  assigneeId: z.string().nullable(),
});
export const replySchema = z.object({ text: text(10000).min(1) });
export const saleSchema = z.object({
  orderRef: text(100).min(1),
  customerEmail: z.email().transform((v) => v.toLowerCase()),
  region: text(100).min(1),
  amount: z.number().nonnegative().max(10000000),
  status: z.enum(["completed", "returned", "replaced", "cancelled"]),
  soldAt: z.iso.datetime(),
});
export const stockSchema = z.union([
  z.object({ stock: z.number().int().min(0).max(1000000) }),
  z.object({ delta: z.union([z.literal(-1), z.literal(1)]) }),
]);
