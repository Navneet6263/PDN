import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client";
import type { Product } from "../lib/types";
export function openDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Set DATABASE_URL in .env to your PostgreSQL connection string.");
  const schema = new URL(url).searchParams.get("schema") || "public";
  // Prisma's local PGlite server has one underlying connection. Queue local
  // queries instead of opening competing pool connections to it.
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url, max: local ? 1 : 10, connectionTimeoutMillis: 10000 },
      { schema },
    ),
  });
}
export type Database = ReturnType<typeof openDatabase>;
const include = { packageContents: { orderBy: { position: "asc" as const } } };
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;
function serialize(row: Row): Product {
  const { createdAt, updatedAt, packageContents, ...p } = row;
  return {
    ...p,
    price: Number(p.price),
    originalPrice: Number(p.originalPrice),
    packageContents: packageContents.map(({ name, quantity }) => ({
      name,
      quantity,
    })),
  };
}
export async function readProducts(db: Database, admin = false): Promise<Product[]> {
  const products = (
    await db.product.findMany({
      where: admin ? {} : { published: true, categoryRecord: { active: true } },
      include,
      orderBy: { createdAt: "desc" },
    })
  ).map(serialize);
  if (admin) return products;
  const ratings = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) } },
    _avg: { rating: true },
    _count: true,
  });
  const summary = new Map(ratings.map((r) => [r.productId, r]));
  return products.map((p) => ({
    ...p,
    reviewCount: summary.get(p.id)?._count || 0,
    ratingAverage: summary.get(p.id)?._avg.rating || null,
  }));
}
export async function readProduct(db: Database, slug: string): Promise<Product | null> {
  const p = await db.product.findFirst({
    where: { slug, published: true, categoryRecord: { active: true } },
    include,
  });
  return p ? serialize(p) : null;
}
export async function saveProduct(db: Database, data: Omit<Product, "id">, id?: string) {
  // Nested writes keep product fields and package items in one transaction.
  const { packageContents, ...fields } = data;
  const items = packageContents.map((item, position) => ({
    ...item,
    position,
  }));
  const p = id
    ? await db.product.update({
        where: { id },
        data: { ...fields, packageContents: { deleteMany: {}, create: items } },
        include,
      })
    : await db.product.create({
        data: { ...fields, packageContents: { create: items } },
        include,
      });
  return serialize(p);
}
