import { Router } from "express";
import type { Database } from "./db";
import { body } from "./route-utils";
import { saleSchema } from "./admin-schemas";
export function salesRoutes(db: Database) {
  const router = Router();
  router.get("/sales", async (_req, res) =>
    res.json(
      (await db.saleRecord.findMany({ orderBy: { soldAt: "desc" } })).map((row) => ({
        ...row,
        amount: Number(row.amount),
      })),
    ),
  );
  router.post("/sales", async (req, res) => {
    const row = await db.saleRecord.create({ data: body(saleSchema, req) });
    res.status(201).json({ ...row, amount: Number(row.amount) });
  });
  router.put("/sales/:id", async (req, res) => {
    const row = await db.saleRecord.update({
      where: { id: String(req.params.id) },
      data: body(saleSchema, req),
    });
    res.json({ ...row, amount: Number(row.amount) });
  });
  router.delete("/sales/:id", async (req, res) => {
    await db.saleRecord.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  });
  return router;
}
