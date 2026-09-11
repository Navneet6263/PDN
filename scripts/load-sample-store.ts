import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import { openDatabase } from "../server/db";
import { defaultSettings } from "../lib/store-types";
import { sampleProducts, sampleCategories } from "./sample-catalog";
const db = openDatabase();
try {
  for (const p of sampleProducts) await access(`public${p.image}`);
  await access("public/images/sample/festive-family.png");
  const previous = {
    settings: await db.storeSettings.findUnique({ where: { id: "main" } }),
    categories: await db.storeCategory.findMany(),
    banners: await db.banner.findMany(),
    products: await db.product.findMany({ include: { packageContents: true } }),
  };
  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-home-redesign-${Date.now()}.json`,
    JSON.stringify(previous, null, 2),
  );
  const spotlight = [0, 2, 10, 18, 3, 13, 17, 25, 26, 1];
  await db.$transaction(
    async (tx) => {
      for (const [position, c] of sampleCategories.entries())
        await tx.storeCategory.upsert({
          where: { slug: c.slug },
          create: { ...c, position, active: true },
          update: { ...c, position, active: true },
        });
      for (const p of sampleProducts) {
        const { packageContents, ...data } = p;
        await tx.product.upsert({
          where: { slug: p.slug },
          update: {},
          create: {
            ...data,
            packageContents: {
              create: packageContents.map((item, position) => ({ ...item, position })),
            },
          },
        });
      }
      const occupied = new Set(
        (
          await tx.product.findMany({
            where: { topTenRank: { not: null } },
            select: { topTenRank: true },
          })
        ).map((p) => p.topTenRank),
      );
      for (const [i, index] of spotlight.entries())
        if (!occupied.has(i + 1)) {
          const p = await tx.product.findUnique({ where: { slug: sampleProducts[index].slug } });
          if (p && p.topTenRank === null)
            await tx.product.update({ where: { id: p.id }, data: { topTenRank: i + 1 } });
        }
      const content = {
        ...defaultSettings,
        ...((previous.settings?.content as object) || {}),
        announcement: "THE NEW-SEASON EDIT · A LITTLE FESTIVE, A LOT OF YOU",
        heroTitle: "A new season. A new kind of you.",
        heroSubtitle:
          "Kurtas, sarees & little festive favourites. Discover a fresh look for everyone in the family.",
        heroEyebrow: "The great Indian wardrobe",
        heroImage: "/images/sample/festive-family.png",
        heroButtonLabel: "Explore the edit",
        heroLink: "/#catalog",
        catalogTitle: "Find your next favourite",
        catalogSubtitle: "The complete collection",
        topTenTitle: "10 styles. Endless possibilities.",
        showStory: false,
        showTopTen: true,
        footerText:
          "Fashion for every version of you. Explore our sample collection for women, men and little ones. Sample prices and availability are for preview.",
      };
      await tx.storeSettings.upsert({
        where: { id: "main" },
        update: { content },
        create: { id: "main", content },
      });
      const promos = [
        {
          id: "sample-women-promo",
          title: "Your ethnic era.",
          subtitle: "Everyday kurtas. Occasion sarees. All kinds of beautiful.",
          eyebrow: "The women’s edit",
          image: "/images/products/anarkali-suit.jpg",
          link: "/?category=women#catalog",
          buttonLabel: "Explore women",
          position: 0,
        },
        {
          id: "sample-kids-promo",
          title: "Little looks. Big smiles.",
          subtitle: "Dress up their happiest moments with our kids’ collection.",
          eyebrow: "Made for little moments",
          image: "/images/sample/girls-lehenga.png",
          link: "/?category=kids#catalog",
          buttonLabel: "Explore kids",
          position: 1,
        },
      ];
      for (const b of promos)
        await tx.banner.upsert({
          where: { id: b.id },
          update: {},
          create: { ...b, slot: "promo", active: true },
        });
    },
    { timeout: 30000 },
  );
  console.log(
    `Ready: ${sampleProducts.length} sample products, ${sampleCategories.length} departments, Top 10 picks and two promotions. Existing products preserved; previous store content backed up.`,
  );
} finally {
  await db.$disconnect();
}
