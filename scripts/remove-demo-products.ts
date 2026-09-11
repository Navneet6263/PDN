import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { openDatabase, readProducts } from "../server/db";
import { productSchema } from "../server/validation";
import demo from "../tests/fixtures/demo-products.json";
const db = openDatabase();
try {
  const products = await readProducts(db, true);
  const candidates = products.filter((p) => {
    const original = demo.find((sample) => sample.slug === p.slug);
    return (
      original &&
      isDeepStrictEqual(productSchema.parse(p), productSchema.parse(original))
    );
  });
  if (!candidates.length) {
    console.log(
      "No unchanged demo products found. Real or edited products were preserved.",
    );
  } else {
    const snapshots = await db.product.findMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      include: { packageContents: true },
    });
    await mkdir("data/backups", { recursive: true });
    const path = `data/backups/demo-products-${Date.now()}.json`;
    await writeFile(path, JSON.stringify(snapshots, null, 2));
    const result = await db.$transaction(
      snapshots.map((p) =>
        db.product.deleteMany({ where: { id: p.id, updatedAt: p.updatedAt } }),
      ),
    );
    console.log(
      `Removed ${result.reduce((n, r) => n + r.count, 0)} unchanged demo products. Backup: ${path}`,
    );
  }
} finally {
  await db.$disconnect();
}
