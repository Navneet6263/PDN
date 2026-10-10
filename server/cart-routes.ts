import { Router } from "express";
import {
  cartSchema,
  mergeCart,
  addressSchema,
  type CartItem,
} from "../lib/shopping";
import { z } from "zod";
import type { Database } from "./db";
import type { PaymentProvider } from "./payments";
import { paymentOptions } from "./order-routes";
export async function quoteCart(
  db: Pick<Database, "product">,
  items: CartItem[],
) {
  const products = await db.product.findMany({
    where: {
      id: { in: items.map((i) => i.productId) },
      published: true,
      categoryRecord: { active: true },
    },
  });
  const lines = items.map((i) => {
    const p = products.find((p) => p.id === i.productId);
    const totalQuantity = items
      .filter((j) => j.productId === i.productId)
      .reduce((s, j) => s + j.quantity, 0);
    const error = !p
      ? "This product is no longer available."
      : (p.sizes.length ? !p.sizes.includes(i.size) : i.size !== "One size")
        ? "Please choose an available size."
        : (p.colors.length ? !p.colors.includes(i.color) : i.color !== "")
          ? "Please choose an available colour."
          : totalQuantity > p.stock
            ? `Only ${p.stock} available across sizes.`
            : "";
    return {
      ...i,
      name: p?.name || "Unavailable product",
      slug: p?.slug || "",
      image: p?.image || "",
      price: Number(p?.price || 0),
      mrp: Math.max(Number(p?.originalPrice || 0), Number(p?.price || 0)),
      stock: p?.stock || 0,
      error,
    };
  });
  return {
    lines,
    subtotal:
      lines.reduce(
        (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
        0,
      ) / 100,
    valid: lines.length > 0 && lines.every((i) => !i.error),
  };
}
export function cartRoutes(
  db: Database,
  online: PaymentProvider | null = null,
) {
  const router = Router();
  router.get("/cart", async (_req, res) =>
    res.json(cartSchema.parse(res.locals.customer.cart)),
  );
  router.put("/cart", async (req, res) => {
    const parsed = cartSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid bag items." });
      return;
    }
    const items = mergeCart([], parsed.data);
    await db.customer.update({
      where: { id: res.locals.customer.id },
      data: { cart: items },
    });
    res.json(items);
  });
  router.post("/cart/merge", async (req, res) => {
    const parsed = z
      .object({ token: z.string().uuid(), items: cartSchema })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid guest bag." });
      return;
    }
    const { token, items } = parsed.data,
      id = res.locals.customer.id;
    const cart = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${id} FOR UPDATE`;
      const customer = await tx.customer.findUniqueOrThrow({ where: { id } });
      const done = await tx.cartMerge.findUnique({
        where: { customerId_token: { customerId: id, token } },
      });
      if (done) return customer.cart;
      const merged = mergeCart(cartSchema.parse(customer.cart), items);
      await tx.cartMerge.create({ data: { customerId: id, token } });
      await tx.customer.update({ where: { id }, data: { cart: merged } });
      return merged;
    });
    res.json(cart);
  });
  router.get("/checkout", async (_req, res) =>
    res.json({
      address: res.locals.customer.checkout,
      ...(await quoteCart(db, cartSchema.parse(res.locals.customer.cart))),
      options: await paymentOptions(db, online),
    }),
  );
  router.post("/checkout", async (req, res) => {
    const address = addressSchema.safeParse(req.body);
    if (!address.success) {
      res.status(400).json({
        error:
          "Complete your address, 10-digit Indian mobile number and 6-digit PIN code.",
      });
      return;
    }
    const quote = await quoteCart(
      db,
      cartSchema.parse(res.locals.customer.cart),
    );
    if (!quote.valid) {
      res.status(409).json({
        error:
          "Your bag changed. Check availability and sizes before continuing.",
      });
      return;
    }
    await db.customer.update({
      where: { id: res.locals.customer.id },
      data: { checkout: address.data },
    });
    res.json({
      ...quote,
      address: address.data,
      options: await paymentOptions(db, online),
      message: "Address saved. Choose how you would like to pay.",
    });
  });
  return router;
}
