import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import type { Database } from "./db";
import { fail } from "./route-utils";

const emailSchema = z.object({
  email: z
    .email()
    .max(200)
    .transform((v) => v.trim().toLowerCase()),
});

export function newsletterRoutes(db: Database) {
  const router = Router();
  router.post("/newsletter", async (req, res) => {
    // A few sign-ups per visitor per 15 minutes is plenty; stops form spam.
    const key = `newsletter:${createHash("sha256")
      .update(req.ip || "unknown")
      .digest("hex")}`;
    await db.loginAttempt.deleteMany({
      where: { key, expires: { lt: new Date() } },
    });
    const attempt = await db.loginAttempt.upsert({
      where: { key },
      update: { count: { increment: 1 } },
      create: { key, count: 1, expires: new Date(Date.now() + 900000) },
    });
    if (attempt.count > 8)
      throw fail("Too many attempts. Please try again later.", 429);
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) throw fail("Enter a valid email address.");
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });
    // Same answer whether new or existing, so the form never reveals who is subscribed.
    res.json({ ok: true });
  });
  return router;
}

export function newsletterAdminRoutes(db: Database) {
  const router = Router();
  router.get("/newsletter", async (_req, res) =>
    res.json(
      await db.newsletterSubscriber.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
    ),
  );
  router.delete("/newsletter/:id", async (req, res) => {
    await db.newsletterSubscriber.deleteMany({
      where: { id: String(req.params.id) },
    });
    res.json({ ok: true });
  });
  return router;
}
