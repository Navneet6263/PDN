import express, { Router, type RequestHandler } from "express";
import { z } from "zod";
import type { Database } from "./db";
import type { ServerConfig } from "./config";
import { uploadImage } from "./uploads";
export function reviewRoutes(db: Database, config: ServerConfig, required: RequestHandler) {
  const router = Router();
  router.get("/reviews/:productId", async (req, res) => {
    const productId = String(req.params.productId);
    const product = await db.product.findFirst({
      where: { id: productId, published: true, categoryRecord: { active: true } },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const [reviews, summary] = await Promise.all([
      db.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          rating: true,
          text: true,
          photos: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      db.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
    ]);
    res.json({ reviews, average: summary._avg.rating, count: summary._count });
  });
  router.post(
    "/reviews/photos",
    required,
    express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Choose a JPEG, PNG or WebP photo, up to 5 MB." });
        return;
      }
      const customerId = res.locals.customer.id;
      const count = await db.reviewPhoto.count({
        where: { customerId, createdAt: { gt: new Date(Date.now() - 86400000) } },
      });
      if (count >= 12) {
        res.status(429).json({ error: "You can upload 12 review photos per day." });
        return;
      }
      const url = await uploadImage(req.body, config);
      await db.reviewPhoto.create({ data: { customerId, url } });
      res.status(201).json({ url });
    },
  );
  router.post("/reviews/:productId", required, async (req, res) => {
    const parsed = z
      .object({
        rating: z.number().int().min(1).max(5),
        text: z.string().trim().min(10).max(2000),
        photos: z.array(z.string().max(1000)).max(3),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({
          error: "Choose 1–5 stars, write at least 10 characters and attach up to 3 photos.",
        });
      return;
    }
    const customerId = res.locals.customer.id,
      productId = String(req.params.productId);
    const product = await db.product.findFirst({
      where: { id: productId, published: true, categoryRecord: { active: true } },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const photos = [...new Set(parsed.data.photos)];
    if (
      (await db.reviewPhoto.count({ where: { customerId, url: { in: photos } } })) !== photos.length
    ) {
      res.status(400).json({ error: "Use photos uploaded from your own account." });
      return;
    }
    await db.review.upsert({
      where: { customerId_productId: { customerId, productId } },
      create: { ...parsed.data, photos, customerId, productId },
      update: { ...parsed.data, photos },
    });
    res.status(201).json({ ok: true });
  });
  return router;
}
