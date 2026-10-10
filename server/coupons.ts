import { Router } from "express";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import type { CouponRule } from "../lib/orders";
import type { Database } from "./db";
import { body, fail } from "./route-utils";

type Tx = Prisma.TransactionClient;
const rule = (c: Prisma.CouponGetPayload<object>): CouponRule => ({
  code: c.code,
  description: c.description,
  type: c.type,
  value: Number(c.value),
  minOrder: Number(c.minOrder),
  maxDiscount: Number(c.maxDiscount),
});

// Checks every limit on a code for this customer. With `lock`, the coupon row
// stays locked until the transaction ends so two checkouts cannot both take
// the last use.
export async function resolveCoupon(
  db: Database | Tx,
  rawCode: string,
  customer: { id: string; email: string },
  subtotal: number,
  lock = false,
): Promise<CouponRule> {
  const code = rawCode.trim().toUpperCase();
  if (lock)
    await db.$queryRaw`SELECT id FROM "Coupon" WHERE code = ${code} FOR UPDATE`;
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.active || (c.startsAt && c.startsAt > now))
    throw fail("This coupon code is not valid.");
  if (c.endsAt && c.endsAt <= now) throw fail("This coupon has expired.");
  if (
    c.allowedEmails.length &&
    !c.allowedEmails.some(
      (e) => e.toLowerCase() === customer.email.toLowerCase(),
    )
  )
    throw fail("This coupon is not available for your account.");
  if (subtotal < Number(c.minOrder))
    throw fail(
      `Add items worth ₹${Number(c.minOrder)} or more to use this coupon.`,
    );
  const live = { couponCode: code, status: { not: "cancelled" as const } };
  if (c.maxUses > 0 && (await db.order.count({ where: live })) >= c.maxUses)
    throw fail("This coupon has been fully used.");
  if (
    c.perCustomer > 0 &&
    (await db.order.count({ where: { ...live, customerId: customer.id } })) >=
      c.perCustomer
  )
    throw fail("You have already used this coupon.");
  return rule(c);
}

const text = (max: number) => z.string().trim().max(max);
export const couponSchema = z
  .object({
    code: text(40)
      .min(3)
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, - or _")),
    description: text(200).default(""),
    type: z.enum(["percent", "flat", "fixed_total"]),
    value: z.number().positive().max(10000000),
    minOrder: z.number().min(0).max(10000000).default(0),
    maxDiscount: z.number().min(0).max(10000000).default(0),
    maxUses: z.number().int().min(0).max(1000000).default(0),
    perCustomer: z.number().int().min(0).max(1000).default(1),
    allowedEmails: z
      .array(z.email().transform((v) => v.toLowerCase()))
      .max(100)
      .default([]),
    active: z.boolean(),
    startsAt: z.iso.datetime().nullable().default(null),
    endsAt: z.iso.datetime().nullable().default(null),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, {
    message: "A percentage cannot be more than 100",
    path: ["value"],
  })
  .refine((c) => c.type !== "fixed_total" || c.value >= 1, {
    message: "A fixed order total must be at least ₹1",
    path: ["value"],
  })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt < c.endsAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  });

export function couponAdminRoutes(db: Database) {
  const router = Router();
  const view = async (c: Prisma.CouponGetPayload<object>) => ({
    ...c,
    value: Number(c.value),
    minOrder: Number(c.minOrder),
    maxDiscount: Number(c.maxDiscount),
    used: await db.order.count({
      where: { couponCode: c.code, status: { not: "cancelled" } },
    }),
  });
  router.get("/coupons", async (_req, res) => {
    const rows = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(await Promise.all(rows.map(view)));
  });
  router.post("/coupons", async (req, res) =>
    res
      .status(201)
      .json(
        await view(await db.coupon.create({ data: body(couponSchema, req) })),
      ),
  );
  router.put("/coupons/:id", async (req, res) => {
    const data = body(couponSchema, req);
    const row = await db.coupon.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!row) throw fail("Coupon not found.", 404);
    if (row.code !== data.code)
      throw fail(
        "A coupon code cannot change once created. Create a new coupon instead.",
      );
    res.json(
      await view(await db.coupon.update({ where: { id: row.id }, data })),
    );
  });
  router.delete("/coupons/:id", async (req, res) => {
    await db.coupon.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  });
  return router;
}
