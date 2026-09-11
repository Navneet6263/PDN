import { Router, type RequestHandler } from "express";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Database } from "./db";
import type { ServerConfig } from "./config";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const token = (cookie = "") =>
  cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("terra_customer="))
    ?.slice(15) || "";
export const customerView = (c: { id: string; name: string; email: string }) => ({
  id: c.id,
  name: c.name,
  email: c.email,
});
export function customerAuth(db: Database, config: ServerConfig) {
  const router = Router();
  const options = { httpOnly: true, sameSite: "strict" as const, secure: config.secure, path: "/" };
  const required: RequestHandler = async (req, res, next) => {
    const session = await db.customerSession.findUnique({
      where: { token: digest(token(req.headers.cookie)) },
      include: { customer: true },
    });
    if (!session || session.expires < new Date()) {
      res.status(401).json({ error: "Please sign in to continue." });
      return;
    }
    res.locals.customer = session.customer;
    next();
  };
  router.post(["/login", "/register"], async (req, res) => {
    const key = `customer:${digest(req.ip || "unknown")}`;
    await db.loginAttempt.deleteMany({ where: { key, expires: { lt: new Date() } } });
    const attempt = await db.loginAttempt.upsert({
      where: { key },
      update: { count: { increment: 1 } },
      create: { key, count: 1, expires: new Date(Date.now() + 900000) },
    });
    if (attempt.count > 15) {
      res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      return;
    }
    const parsed = z
      .object({
        email: z
          .email()
          .max(200)
          .transform((s) => s.toLowerCase()),
        password: z.string().min(8).max(128),
        name: z.string().trim().min(2).max(100).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Enter a valid email, name and password of at least 8 characters." });
      return;
    }
    const { email, password, name } = parsed.data;
    let customer = await db.customer.findUnique({ where: { email } });
    if (req.path === "/register") {
      if (!name || customer) {
        res
          .status(409)
          .json({ error: "Unable to create account. Try signing in or check your details." });
        return;
      }
      const salt = randomBytes(16).toString("hex");
      customer = await db.customer.create({
        data: {
          email,
          name,
          passwordHash: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
        },
      });
    } else {
      const [salt, hash] = (customer?.passwordHash || `missing:${"00".repeat(64)}`).split(":");
      const valid = timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
      if (!customer || !valid) {
        res.status(401).json({ error: "Incorrect email or password." });
        return;
      }
    }
    const raw = randomBytes(32).toString("hex");
    await db.customerSession.deleteMany({
      where: {
        OR: [{ token: digest(token(req.headers.cookie)) }, { expires: { lt: new Date() } }],
      },
    });
    await db.customerSession.create({
      data: {
        token: digest(raw),
        customerId: customer.id,
        expires: new Date(Date.now() + 30 * 86400000),
      },
    });
    await db.loginAttempt.deleteMany({ where: { key } });
    res
      .cookie("terra_customer", raw, { ...options, maxAge: 30 * 86400000 })
      .json(customerView(customer));
  });
  router.get("/me", required, (_req, res) => res.json(customerView(res.locals.customer)));
  router.post("/logout", async (req, res) => {
    await db.customerSession.deleteMany({ where: { token: digest(token(req.headers.cookie)) } });
    res.clearCookie("terra_customer", options).json({ ok: true });
  });
  return { router, required };
}
