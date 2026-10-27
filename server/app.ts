import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma } from "../generated/prisma/client";
import { createAuth } from "./auth";
import { readProducts, readProduct, saveProduct, type Database } from "./db";
import { productSchema } from "./validation";
import { uploadImage } from "./uploads";
import type { ServerConfig } from "./config";
import { publicStoreRoutes, storeAdminRoutes } from "./store-routes";
import { teamRoutes } from "./team-routes";
import { couponAdminRoutes } from "./coupons";
import { supportRoutes } from "./support-routes";
import { salesRoutes } from "./sales-routes";
import { customerAuth } from "./customer-auth";
import { cartRoutes, quoteCart } from "./cart-routes";
import { reviewRoutes } from "./review-routes";
import { cartSchema } from "../lib/shopping";
import {
  adminOrderRoutes,
  customerOrderRoutes,
  paymentOptions,
  paymentWebhookRoutes,
} from "./order-routes";
export function createApp(db: Database, config: ServerConfig) {
  const app = express();
  app.disable("x-powered-by");
  const auth = createAuth(db, config);
  const online = config.onlinePayment || null;
  // Shoppers may arrive on either example.com or www.example.com; both are
  // the same store, so both may make changes.
  const site = new URL(config.origin);
  const twin = site.hostname.startsWith("www.")
    ? site.hostname.slice(4)
    : `www.${site.hostname}`;
  const allowedOrigins = new Set([
    site.origin,
    `${site.protocol}//${twin}${site.port ? `:${site.port}` : ""}`,
  ]);
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    if (req.path.startsWith("/api")) res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !allowedOrigins.has(String(req.headers.origin)) &&
      !req.path.startsWith("/api/payments/webhook/") &&
      !req.path.startsWith("/api/payments/return/")
    ) {
      res.status(403).json({ error: "Request origin is not allowed." });
      return;
    }
    next();
  });
  app.use("/api", paymentWebhookRoutes(db, online, config.origin));
  app.use(express.json({ limit: "100kb" }));
  const uploadDir = resolve(config.uploadDir || "uploads");
  if (config.imageStorage !== "cloudinary") {
    mkdirSync(uploadDir, { recursive: true });
    app.use(
      "/media",
      express.static(uploadDir, { immutable: true, maxAge: "1y" }),
    );
  }
  app.get("/api/health", async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });
  app.get("/api/products", async (_req, res) =>
    res.json(await readProducts(db)),
  );
  const customer = customerAuth(db, config);
  app.use("/api/customer", customer.router);
  app.use("/api/customer", customer.required, cartRoutes(db, online));
  app.use("/api/customer", customer.required, customerOrderRoutes(db, online));
  app.use(
    "/api",
    reviewRoutes(db, { ...config, uploadDir }, customer.required),
  );
  app.post("/api/bag/quote", async (req, res) => {
    const items = cartSchema.safeParse(req.body);
    if (!items.success) {
      res.status(400).json({ error: "Invalid bag." });
      return;
    }
    res.json({
      ...(await quoteCart(db, items.data)),
      charges: (await paymentOptions(db, online)).charges,
    });
  });
  app.get("/api/products/:slug", async (req, res) => {
    const product = await readProduct(db, String(req.params.slug));
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(product);
  });
  app.post("/api/auth/login", auth.login);
  app.post("/api/auth/logout", auth.logout);
  app.get("/api/auth/me", auth.required, (_req, res) =>
    res.json(res.locals.actor),
  );
  app.use("/api/admin", auth.required);
  app.use("/api", publicStoreRoutes(db));
  app.use("/api/admin", (req, res, next) => {
    const role = res.locals.actor.role;
    // Everyone on the team can look up orders and leave notes; inventory also
    // moves orders through packing and shipping. Payments stay admin-only.
    const orders =
      (req.method === "GET" && /^\/orders(\/[^/]+)?$/.test(req.path)) ||
      (req.method === "POST" && /^\/orders\/[^/]+\/notes$/.test(req.path));
    const inventory =
      role === "inventory" &&
      ((req.method === "GET" &&
        ["/products", "/categories"].includes(req.path)) ||
        (req.method === "PATCH" &&
          /^\/(inventory|orders)\/[^/]+$/.test(req.path)));
    if (
      role === "admin" ||
      orders ||
      inventory ||
      (role === "support" && req.path.startsWith("/support"))
    )
      return next();
    res.status(403).json({ error: "Your role does not allow this action." });
  });
  app.use(
    "/api/admin",
    storeAdminRoutes(db),
    teamRoutes(db, config.email),
    supportRoutes(db),
    salesRoutes(db),
    adminOrderRoutes(db),
    couponAdminRoutes(db),
  );
  app.get("/api/admin/products", async (_req, res) =>
    res.json(await readProducts(db, true)),
  );
  async function save(req: Request, res: Response) {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
      return;
    }
    const p = parsed.data;
    try {
      const product = await saveProduct(
        db,
        p,
        req.method === "PUT" ? String(req.params.id) : undefined,
      );
      res.status(req.method === "POST" ? 201 : 200).json(product);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          res.status(409).json({
            error:
              "This URL slug or Top 10 position is already used. Choose another value.",
          });
          return;
        }
        if (error.code === "P2025") {
          res.status(404).json({ error: "Product not found." });
          return;
        }
      }
      throw error;
    }
  }
  app.post("/api/admin/products", save);
  app.put("/api/admin/products/:id", save);
  app.delete("/api/admin/products/:id", async (req, res) => {
    const result = await db.product.deleteMany({
      where: { id: String(req.params.id) },
    });
    res
      .status(result.count ? 200 : 404)
      .json(result.count ? { ok: true } : { error: "Product not found." });
  });
  app.post(
    "/api/admin/uploads",
    express.raw({
      type: ["image/jpeg", "image/png", "image/webp"],
      limit: "5mb",
    }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ error: "Upload a JPEG, PNG or WebP image." });
        return;
      }
      const url = await uploadImage(req.body, { ...config, uploadDir });
      res.status(201).json({ url });
    },
  );
  app.use((_req, res) => res.status(404).json({ error: "Not found." }));
  app.use(
    (
      err: Error & { status?: number },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      console.error(err.message);
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2025", "P2003"].includes(err.code)
      ) {
        const status = err.code === "P2025" ? 404 : 409;
        res.status(status).json({
          error:
            err.code === "P2002"
              ? "That email, slug, order reference or Top 10 position is already used."
              : err.code === "P2025"
                ? "Record not found."
                : "This record is linked to another record. Check the selected category.",
        });
        return;
      }
      res.status(err.status || 500).json({
        error:
          err.status === 413
            ? "File or request is too large."
            : err.status && err.status < 500
              ? err.message
              : "Unable to complete request.",
      });
    },
  );
  return app;
}
