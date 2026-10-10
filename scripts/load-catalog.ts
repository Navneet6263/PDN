// Adds the 191-piece studio catalog (women, men, kids, footwear, accessories),
// adds their product types to the menus and hides older sample listings that
// reused another listing's photo. Safe to re-run: existing catalog products
// are left as edited in admin. Backs up products and categories first.
//
//   npx tsx scripts/load-catalog.ts
import "dotenv/config";
import { access, mkdir, writeFile } from "node:fs/promises";
import { openDatabase } from "../server/db";
import { catalogProducts } from "./catalog-products";

const departments: Record<
  string,
  { label: string; types: string[]; image?: string }
> = {
  women: {
    label: "Women",
    types: [
      "Dresses",
      "Tops",
      "Shirts",
      "Jeans & Trousers",
      "Skirts",
      "Shorts",
      "Jackets & Coats",
      "Sweaters & Sweatshirts",
      "Activewear",
    ],
  },
  men: {
    label: "Men",
    types: [
      "Shirts",
      "T-Shirts",
      "Jeans & Trousers",
      "Shorts",
      "Jackets",
      "Sweaters & Sweatshirts",
      "Activewear",
    ],
  },
  kids: {
    label: "Kids",
    types: ["Frocks & Dresses", "Tops & Tees", "Sweaters & Jackets", "Bottoms"],
  },
  footwear: {
    label: "Footwear",
    types: [
      "Heels",
      "Flats",
      "Sandals",
      "Sneakers",
      "Boots",
      "Loafers & Formal",
      "Slippers & Flip-Flops",
      "Kids Footwear",
    ],
  },
  accessories: { label: "Accessories", types: ["Caps & Hats"] },
};

const db = openDatabase();
try {
  for (const p of catalogProducts)
    for (const g of p.gallery) await access(`public${g}`);
  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-catalog-${Date.now()}.json`,
    JSON.stringify(
      {
        categories: await db.storeCategory.findMany(),
        products: await db.product.findMany({
          include: { packageContents: true },
        }),
      },
      null,
      2,
    ),
  );
  let added = 0,
    hidden = 0;
  await db.$transaction(
    async (tx) => {
      for (const [slug, d] of Object.entries(departments)) {
        const current = await tx.storeCategory.findUnique({ where: { slug } });
        const types = [
          ...new Set([...(current?.subCategories || []), ...d.types]),
        ];
        if (current)
          await tx.storeCategory.update({
            where: { slug },
            data: { subCategories: types },
          });
        else
          await tx.storeCategory.create({
            data: {
              slug,
              label: d.label,
              subCategories: types,
              position: 50,
              active: true,
            },
          });
      }
      for (const p of catalogProducts) {
        const { packageContents, ...data } = p;
        if (
          await tx.product.findUnique({
            where: { slug: p.slug },
            select: { id: true },
          })
        )
          continue;
        await tx.product.create({
          data: {
            ...data,
            packageContents: {
              create: packageContents.map((item, position) => ({
                ...item,
                position,
              })),
            },
          },
        });
        added++;
      }
      // Older preview listings shared photos. Keep the first listing per photo
      // visible and move the rest to drafts (nothing is deleted).
      const samples = await tx.product.findMany({
        where: { slug: { startsWith: "sample-" }, published: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, image: true },
      });
      const seen = new Set<string>();
      for (const s of samples) {
        if (seen.has(s.image)) {
          await tx.product.update({
            where: { id: s.id },
            data: { published: false },
          });
          hidden++;
        }
        seen.add(s.image);
      }
    },
    { timeout: 120000 },
  );
  const live = await db.product.count({ where: { published: true } });
  console.log(
    `Catalog ready: ${added} new products added (${catalogProducts.length} in the catalog), ${hidden} duplicate-photo sample listings moved to drafts. ${live} products are now live. Backup saved in data/backups.`,
  );
} finally {
  await db.$disconnect();
}
