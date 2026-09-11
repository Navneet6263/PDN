import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import { openDatabase } from "../server/db";
import { productSchema } from "../server/validation";
import { sampleProducts } from "./sample-catalog";
import sharp from "sharp";
const looks = [
  {
    slug: "sample-everyday-printed-kurti",
    name: "Powder Blue Office Kurta Set",
    photo: "office-monday",
    price: 1299,
    color: "Powder blue",
    style: "ethnic",
    items: ["Kurta", "Trousers", "Dupatta"],
  },
  {
    slug: "sample-floral-everyday-kurta",
    name: "Sage Linen-Style Kurta Set",
    photo: "office-tuesday",
    price: 1499,
    color: "Sage green",
    style: "minimal",
    items: ["Kurta", "Trousers"],
  },
  {
    slug: "sample-printed-straight-kurti",
    name: "Rose Block-Print Kurta Set",
    photo: "office-wednesday",
    price: 999,
    color: "Dusty rose",
    style: "ethnic",
    items: ["Kurta", "Trousers"],
  },
  {
    slug: "studio-office-ivory-coord",
    name: "Ivory Shirt & Tailored Trouser Set",
    photo: "office-thursday",
    price: 1899,
    color: "Ivory and beige",
    style: "minimal",
    items: ["Shirt", "Trousers"],
  },
  {
    slug: "studio-office-navy-kurta",
    name: "Navy Geometric Kurta Set",
    photo: "office-friday",
    price: 1599,
    color: "Navy and ivory",
    style: "ethnic",
    items: ["Kurta", "Trousers"],
  },
  {
    slug: "studio-office-teal-tunic",
    name: "Teal Statement Tunic Set",
    photo: "office-saturday",
    price: 2199,
    color: "Teal and cream",
    style: "bold",
    items: ["Tunic", "Trousers"],
  },
];
const db = openDatabase();
try {
  for (const look of looks) {
    await access(`public/images/sample/${look.photo}.png`);
    await sharp(`public/images/sample/${look.photo}.png`)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(`public/images/sample/${look.photo}.webp`);
  }
  const before = await db.product.findMany({
    where: { slug: { in: looks.map((l) => l.slug) } },
    include: { packageContents: true },
  });
  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-office-looks-${Date.now()}.json`,
    JSON.stringify(before, null, 2),
  );
  await db.$transaction(
    async (tx) => {
      for (const [index, l] of looks.entries()) {
        const existing = before.find((p) => p.slug === l.slug);
        if (existing && !existing.additionalInfo.includes("Sample product"))
          throw new Error(`Refusing to overwrite non-sample product ${l.slug}`);
        const image = `/images/sample/${l.photo}.webp`;
        const p = productSchema.parse({
          ...sampleProducts[1],
          slug: l.slug,
          name: l.name,
          brand: "Terra Workday",
          category: "women",
          subCategory: "Workwear",
          price: l.price,
          originalPrice: l.price + 800,
          colors: [l.color],
          image,
          gallery: [image],
          stock: 15,
          displayOrder: 20 + index,
          featured: index === 5,
          topTenRank: existing?.topTenRank || null,
          material: "Sample fabric specification; verify against actual merchandise.",
          description: `${l.name}: a relaxed office outfit with ${l.items.join(" and ").toLowerCase()}. This is a sample listing with an AI-generated styling photo. Prices, materials and stock are for preview; replace them with verified details before selling. Shoes and styling accessories are not included.`,
          seoTitle: l.name,
          seoDescription: `Explore the ${l.name} sample look in the Terra Workday edit.`,
          searchKeywords: [
            "mood:office",
            "mood:everyday",
            "mood:college",
            `style:${l.style}`,
            "office",
            "workwear",
          ],
          packageContents: l.items.map((name) => ({ name, quantity: 1 })),
        });
        const { packageContents, ...data } = p;
        await tx.product.upsert({
          where: { slug: l.slug },
          create: {
            ...data,
            packageContents: {
              create: packageContents.map((item, position) => ({ ...item, position })),
            },
          },
          update: {
            ...data,
            packageContents: {
              deleteMany: {},
              create: packageContents.map((item, position) => ({ ...item, position })),
            },
          },
        });
      }
      const category = await tx.storeCategory.findUnique({ where: { slug: "women" } });
      if (category && !category.subCategories.includes("Workwear"))
        await tx.storeCategory.update({
          where: { id: category.id },
          data: { subCategories: ["Workwear", ...category.subCategories] },
        });
    },
    { timeout: 30000 },
  );
  console.log(
    "Six distinct sample office looks ready: three preview listings refreshed, three added. Original rows backed up.",
  );
} finally {
  await db.$disconnect();
}
