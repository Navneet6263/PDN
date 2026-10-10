import { randomBytes } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { defaultSettings } from "../lib/store-types";
import { cartSchema } from "../lib/shopping";
import {
  codAllowed,
  orderTotals,
  transitions,
  type ChargeSettings,
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from "../lib/orders";
import type { Database } from "./db";
import { quoteCart } from "./cart-routes";
import { fail } from "./route-utils";
import type { PaymentProvider } from "./payments";
import type { PaymentResult } from "./payments/types";

type Tx = Prisma.TransactionClient;
// Unpaid online orders hold stock for this long before being released.
export const PAYMENT_WINDOW_MINUTES = 30;

export const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;
type Row = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type ListRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

export function serializeOrder(row: Row | ListRow, detail = true): Order {
  const { customerId, idempotencyKey, stockRestored, ...o } = row as Row;
  const refundDue =
    o.paymentStatus === "paid" &&
    (o.status === "cancelled" || o.status === "returned");
  return {
    ...o,
    address: o.address as Order["address"],
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shippingFee),
    codFee: Number(o.codFee),
    discount: Number(o.discount),
    total: Number(o.total),
    refundDue,
    placedAt: o.placedAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      slug: i.slug,
      image: i.image,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      mrp: Number(i.mrp),
    })),
    payments:
      detail && "payments" in row
        ? row.payments.map((p) => ({
            id: p.id,
            provider: p.provider,
            method: p.method,
            status: p.status,
            amount: Number(p.amount),
            providerPaymentId: p.providerPaymentId,
            failureReason: p.failureReason,
            createdAt: p.createdAt.toISOString(),
          }))
        : undefined,
    events:
      detail && "events" in row
        ? row.events.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          }))
        : undefined,
  };
}

export async function storeSettings(db: Database | Tx) {
  const row = await db.storeSettings.findUnique({ where: { id: "main" } });
  return { ...defaultSettings, ...((row?.content as object) || {}) };
}
export const charges = (s: typeof defaultSettings): ChargeSettings => ({
  shippingFee: s.shippingFee,
  freeShippingAbove: s.freeShippingAbove,
  codEnabled: s.codEnabled,
  codFee: s.codFee,
  codMaxOrder: s.codMaxOrder,
});

const orderNumber = () => {
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  // Crockford-style alphabet: no 0/O or 1/I confusion when read over the phone.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const tail = [...randomBytes(6)]
    .map((b) => alphabet[b % alphabet.length])
    .join("");
  return `TS${ymd}-${tail}`;
};

async function lockProducts(tx: Tx, ids: string[]) {
  if (ids.length)
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
}

async function restoreStock(tx: Tx, orderId: string) {
  // Conditional update makes restoration happen exactly once per order.
  const claimed = await tx.order.updateMany({
    where: { id: orderId, stockRestored: false },
    data: { stockRestored: true },
  });
  if (!claimed.count) return;
  const items = await tx.orderItem.findMany({
    where: { orderId, productId: { not: null } },
  });
  for (const item of items)
    await tx.product.updateMany({
      where: { id: item.productId! },
      data: { stock: { increment: item.quantity } },
    });
}

export async function placeOrder(
  db: Database,
  customer: { id: string; name: string; email: string },
  input: {
    address: Order["address"];
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
  },
  online: PaymentProvider | null,
) {
  const existing = await db.order.findUnique({
    where: {
      customerId_idempotencyKey: {
        customerId: customer.id,
        idempotencyKey: input.idempotencyKey,
      },
    },
    include: orderInclude,
  });
  if (existing) return { order: existing, created: false };
  if (input.paymentMethod === "online" && !online)
    throw fail("Online payment is not available yet. Choose cash on delivery.");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
    const fresh = await tx.customer.findUniqueOrThrow({
      where: { id: customer.id },
    });
    const cart = cartSchema.parse(fresh.cart);
    if (!cart.length) throw fail("Your bag is empty.", 409);
    await lockProducts(tx, [...new Set(cart.map((i) => i.productId))].sort());
    const quote = await quoteCart(tx, cart);
    if (!quote.valid)
      throw fail(
        "Your bag changed. Check availability and sizes before continuing.",
        409,
      );
    const settings = await storeSettings(tx);
    const totals = orderTotals(
      quote.subtotal,
      charges(settings),
      input.paymentMethod,
    );
    if (
      input.paymentMethod === "cod" &&
      !codAllowed(charges(settings), totals.total)
    )
      throw fail(
        "Cash on delivery is not available for this order. Please pay online.",
      );
    const products = await tx.product.findMany({
      where: { id: { in: cart.map((i) => i.productId) } },
      select: { id: true, originalPrice: true },
    });
    const totalsByProduct = new Map<string, number>();
    for (const line of quote.lines)
      totalsByProduct.set(
        line.productId,
        (totalsByProduct.get(line.productId) || 0) + line.quantity,
      );
    for (const [id, quantity] of totalsByProduct) {
      const updated = await tx.product.updateMany({
        where: { id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (!updated.count)
        throw fail("Some items just sold out. Review your bag.", 409);
    }
    const cod = input.paymentMethod === "cod";
    const order = await tx.order.create({
      data: {
        number: orderNumber(),
        customerId: customer.id,
        idempotencyKey: input.idempotencyKey,
        email: customer.email,
        customerName: input.address.name,
        phone: input.address.phone,
        address: input.address,
        region: input.address.state,
        status: cod ? "confirmed" : "pending_payment",
        paymentMethod: input.paymentMethod,
        ...totals,
        items: {
          create: quote.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            slug: l.slug,
            image: l.image,
            size: l.size,
            color: l.color,
            quantity: l.quantity,
            unitPrice: l.price,
            mrp: Number(
              products.find((p) => p.id === l.productId)?.originalPrice ||
                l.price,
            ),
          })),
        },
        payments: cod
          ? { create: { provider: "cod", method: "cod", amount: totals.total } }
          : undefined,
        events: {
          create: {
            kind: "status",
            status: cod ? "confirmed" : "pending_payment",
            message: cod
              ? "Order placed with cash on delivery."
              : "Order placed. Waiting for online payment.",
            actor: "Customer",
          },
        },
      },
      include: orderInclude,
    });
    await tx.customer.update({
      where: { id: customer.id },
      data: { cart: [], checkout: input.address },
    });
    return { order, created: true };
  });
}

// Opens a new gateway attempt for an order that is still waiting for payment.
export async function startPayment(
  db: Database,
  orderId: string,
  online: PaymentProvider | null,
) {
  if (!online) throw fail("Online payment is not available.");
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "pending_payment" || order.paymentStatus === "paid")
    throw fail("This order is not waiting for payment.", 409);
  const payment = await db.payment.create({
    data: {
      orderId,
      provider: online.id,
      method: "online",
      amount: order.total,
    },
  });
  const settings = await storeSettings(db);
  try {
    const created = await online.create({
      orderNumber: order.number,
      paymentId: payment.id,
      amount: Number(order.total),
      currency: order.currency,
      storeName: settings.storeName,
      customer: {
        name: order.customerName,
        email: order.email,
        phone: order.phone,
      },
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { providerOrderId: created.providerOrderId },
    });
    return created.checkout;
  } catch (error) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failureReason: (error as Error).message.slice(0, 300),
      },
    });
    throw error;
  }
}

// Applies a verified gateway result. Safe to call repeatedly for the same
// payment (browser callback and webhook can both arrive).
export async function applyPaymentResult(
  db: Database,
  result: PaymentResult,
  actor: string,
) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerOrderId: result.providerOrderId },
    });
    if (!payment) throw fail("Payment attempt not found.", 404);
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${payment.orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({
      where: { id: payment.orderId },
    });
    if (payment.status === "paid" || payment.status === "refunded")
      return order;
    if (result.status === "failed") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          failureReason: (result.reason || "Payment failed").slice(0, 300),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          events: {
            create: {
              kind: "payment",
              message: `Payment attempt failed: ${result.reason || "declined"}.`,
              actor,
            },
          },
        },
      });
      return order;
    }
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        providerPaymentId: result.providerPaymentId,
        failureReason: "",
      },
    });
    const lateAfterCancel = order.status === "cancelled";
    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: order.status === "pending_payment" ? "confirmed" : order.status,
        events: {
          create: {
            kind: "payment",
            status: order.status === "pending_payment" ? "confirmed" : "",
            message: lateAfterCancel
              ? "Payment received after the order was cancelled. Refund this payment."
              : `Payment received (${payment.provider}).`,
            actor,
          },
        },
      },
    });
  });
}

export async function changeStatus(
  db: Database,
  orderId: string,
  next: OrderStatus,
  actor: string,
  note = "",
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw fail("Order not found.", 404);
    if (order.status === next) return order;
    if (!transitions[order.status].includes(next))
      throw fail(
        `An order that is ${order.status.replaceAll("_", " ")} cannot become ${next.replaceAll("_", " ")}.`,
        409,
      );
    if (next === "cancelled" || next === "returned")
      await restoreStock(tx, orderId);
    // Cash collected at the door completes a COD payment.
    const codCollected = next === "delivered" && order.paymentMethod === "cod";
    if (codCollected)
      await tx.payment.updateMany({
        where: { orderId, provider: "cod", status: "pending" },
        data: { status: "paid" },
      });
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: next,
        ...(codCollected ? { paymentStatus: "paid" } : {}),
        events: {
          create: {
            kind: "status",
            status: next,
            message: note || `Marked ${next.replaceAll("_", " ")}.`,
            actor,
          },
        },
      },
    });
  });
}

// Releases stock held by online orders that were never paid.
export async function expireStaleOrders(db: Database) {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60000);
  const stale = await db.order.findMany({
    where: {
      status: "pending_payment",
      paymentStatus: { not: "paid" },
      placedAt: { lt: cutoff },
    },
    select: { id: true },
    take: 100,
  });
  for (const { id } of stale)
    await changeStatus(
      db,
      id,
      "cancelled",
      "System",
      "Payment not completed in time. Stock released.",
    ).catch(() => undefined);
  return stale.length;
}
