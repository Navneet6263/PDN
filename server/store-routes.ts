import { Router } from "express";
import type { Database } from "./db";
import { defaultSettings } from "../lib/store-types";
import {
  settingsSchema,
  categorySchema,
  bannerSchema,
  merchSchema,
  stockSchema,
} from "./admin-schemas";
import { body, fail } from "./route-utils";
export function publicStoreRoutes(db: Database) {
  const router = Router();
  router.get("/storefront", async (_req, res) => {
    const now = new Date();
    const [row, categories, banners] = await Promise.all([
      db.storeSettings.findUnique({ where: { id: "main" } }),
      db.storeCategory.findMany({
        where: { active: true },
        orderBy: [{ position: "asc" }, { label: "asc" }],
      }),
      db.banner.findMany({
        where: {
          active: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          ],
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      }),
    ]);
    res.json({
      settings: { ...defaultSettings, ...((row?.content as object) || {}) },
      categories,
      banners,
    });
  });
  return router;
}
export function storeAdminRoutes(db: Database) {
  const router = Router();
  router.get("/settings", async (_req, res) => {
    const row = await db.storeSettings.findUnique({ where: { id: "main" } });
    res.json({ ...defaultSettings, ...((row?.content as object) || {}) });
  });
  router.put("/settings", async (req, res) => {
    const content = body(settingsSchema, req);
    await db.storeSettings.upsert({
      where: { id: "main" },
      update: { content },
      create: { id: "main", content },
    });
    res.json(content);
  });
  router.get("/categories", async (_req, res) =>
    res.json(await db.storeCategory.findMany({ orderBy: [{ position: "asc" }, { label: "asc" }] })),
  );
  router.post("/categories", async (req, res) =>
    res.status(201).json(await db.storeCategory.create({ data: body(categorySchema, req) })),
  );
  router.put("/categories/:id", async (req, res) => {
    const data = body(categorySchema, req);
    const row = await db.storeCategory.findUnique({ where: { id: String(req.params.id) } });
    if (!row) throw fail("Category not found.", 404);
    if (row.slug !== data.slug)
      throw fail("Category URL slug cannot change. Change its display name instead.");
    res.json(await db.storeCategory.update({ where: { id: row.id }, data }));
  });
  router.delete("/categories/:id", async (req, res) => {
    const row = await db.storeCategory.findUnique({
      where: { id: String(req.params.id) },
      include: { _count: { select: { products: true } } },
    });
    if (!row) throw fail("Category not found.", 404);
    if (row._count.products)
      throw fail("Move products to another category before deleting this category.", 409);
    await db.storeCategory.delete({ where: { id: row.id } });
    res.json({ ok: true });
  });
  router.get("/banners", async (_req, res) =>
    res.json(await db.banner.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] })),
  );
  router.post("/banners", async (req, res) => {
    const data = body(bannerSchema, req);
    data.productIds = [...new Set(data.productIds)];
    if (
      (await db.product.count({ where: { id: { in: data.productIds } } })) !==
      data.productIds.length
    )
      throw fail("Some selected products no longer exist. Update the selection.");
    res.status(201).json(await db.banner.create({ data }));
  });
  router.put("/banners/:id", async (req, res) => {
    const data = body(bannerSchema, req);
    data.productIds = [...new Set(data.productIds)];
    if (
      (await db.product.count({ where: { id: { in: data.productIds } } })) !==
      data.productIds.length
    )
      throw fail("Some selected products no longer exist. Update the selection.");
    res.json(await db.banner.update({ where: { id: String(req.params.id) }, data }));
  });
  router.delete("/banners/:id", async (req, res) => {
    await db.banner.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  });
  router.patch("/merchandising/:id", async (req, res) => {
    const data = body(merchSchema, req);
    res.json(
      await db.product.update({ where: { id: String(req.params.id) }, data, select: { id: true } }),
    );
  });
  router.patch("/inventory/:id", async (req, res) => {
    const data = body(stockSchema, req);
    const id = String(req.params.id);
    if ("delta" in data) {
      const result = await db.product.updateMany({
        where: { id, stock: data.delta < 0 ? { gt: 0 } : { lt: 1000000 } },
        data: { stock: { increment: data.delta } },
      });
      if (!result.count) throw fail("Stock limit reached or product no longer exists.", 409);
    } else await db.product.update({ where: { id }, data });
    res.json(await db.product.findUnique({ where: { id }, select: { id: true, stock: true } }));
  });
  return router;
}
