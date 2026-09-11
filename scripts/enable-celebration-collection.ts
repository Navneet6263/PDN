import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { openDatabase } from "../server/db";
const db = openDatabase();
try {
  const banners = await db.banner.findMany();
  await mkdir("data/backups", { recursive: true });
  await writeFile(
    `data/backups/before-collections-english-${Date.now()}.json`,
    JSON.stringify(banners, null, 2),
  );
  for (const b of banners) {
    const subtitle = b.subtitle.replaceAll("Saturday bhi open hai?", "Working on Saturdays too?");
    if (subtitle !== b.subtitle)
      await db.banner.update({ where: { id: b.id }, data: { subtitle } });
  }
  const banner = banners.find((b) => b.id === "shopping-family-hero");
  if (banner && banner.destination === "link") {
    const products = await db.product.findMany({
      where: { published: true, categoryRecord: { active: true }, slug: { startsWith: "sample-" } },
      orderBy: { displayOrder: "asc" },
    });
    const productIds = ["women", "men", "kids"].flatMap((category) =>
      products
        .filter(
          (p) =>
            p.category === category &&
            /saree|lehenga|sherwani|ethnic|kurta/i.test(`${p.name} ${p.subCategory}`) &&
            p.subCategory !== "Workwear",
        )
        .slice(0, 3)
        .map((p) => p.id),
    );
    if (productIds.length)
      await db.banner.update({
        where: { id: banner.id },
        data: { destination: "collection", productIds },
      });
    console.log(
      `Family banner now opens an editable celebration collection with ${productIds.length} styles.`,
    );
  }
} finally {
  await db.$disconnect();
}
