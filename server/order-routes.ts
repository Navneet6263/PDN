import express, { Router } from "express";
import { Prisma } from "../generated/prisma/client";
import {
  customerCanCancel,
  placeOrderSchema,
  orderStatuses,
  type OrderStatus,
} from "../lib/orders";
import type { Database } from "./db";
import type { PaymentProvider } from "./payments";
import { body, fail } from "./route-utils";
import {
  orderNoteSchema,
  orderPaymentSchema,
  orderUpdateSchema,
} from "./admin-schemas";
import {
  applyPaymentResult,
  changeStatus,
  charges,
  expireStaleOrders,
  orderInclude,
  placeOrder,
  serializeOrder,
  startPayment,
  storeSettings,
} from "./orders";

const customerView = (row: Parameters<typeof serializeOrder>[0]) => {
  const order = serializeOrder(row);
  // Internal staff notes stay in admin.
  return { ...order, events: order.events?.filter((e) => e.kind !== "note") };
};

export async function paymentOptions(
  db: Database,
  online: PaymentProvider | null,
) {
  const settings = await storeSettings(db);
  return {
    charges: charges(settings),
    online: online ? { provider: online.id, label: online.label } : null,
  };
}

export function customerOrderRoutes(
  db: Database,
  online: PaymentProvider | null,
) {
  const router = Router();
  const own = async (customerId: string, number: string) => {
    const order = await db.order.findFirst({
      where: { number, customerId },
      include: orderInclude,
    });
    if (!order) throw fail("Order not found.", 404);
    return order;
  };
  router.post("/orders", async (req, res) => {
    const input = placeOrderSchema.safeParse(req.body);
    if (!input.success)
      throw fail(
        "Complete your address, 10-digit mobile number, PIN code and payment method.",
      );
    const customer = res.locals.customer;
    let result;
    try {
      result = await placeOrder(db, customer, input.data, online);
    } catch (error) {
      // A double-click raced the first request: return the order it created.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        result = {
          order: await db.order.findUniqueOrThrow({
            where: {
              customerId_idempotencyKey: {
                customerId: customer.id,
                idempotencyKey: input.data.idempotencyKey,
              },
            },
            include: orderInclude,
          }),
          created: false,
        };
      else throw error;
    }
    const { order, created } = result;
    let checkout = null,
      paymentError = "";
    if (order.status === "pending_payment")
      try {
        checkout = await startPayment(db, order.id, online);
      } catch (error) {
        paymentError = (error as Error).message;
      }
    res.status(created ? 201 : 200).json({
      order: customerView(await own(customer.id, order.number)),
      checkout,
      paymentError,
    });
  });
  router.get("/orders", async (_req, res) => {
    await expireStaleOrders(db);
    const rows = await db.order.findMany({
      where: { customerId: res.locals.customer.id },
      include: { items: true },
      orderBy: { placedAt: "desc" },
      take: 50,
    });
    res.json(rows.map((r) => serializeOrder(r, false)));
  });
  router.get("/orders/:number", async (req, res) =>
    res.json(
      customerView(
        await own(res.locals.customer.id, String(req.params.number)),
      ),
    ),
  );
  router.post("/orders/:number/pay", async (req, res) => {
    const order = await own(res.locals.customer.id, String(req.params.number));
    res.json({ checkout: await startPayment(db, order.id, online) });
  });
  router.post("/orders/:number/verify", async (req, res) => {
    if (!online) throw fail("Online payment is not available.");
    const order = await own(res.locals.customer.id, String(req.params.number));
    const result = await online.verify(req.body);
    const payment = await db.payment.findUnique({
      where: { providerOrderId: result.providerOrderId },
    });
    if (!payment || payment.orderId !== order.id)
      throw fail("Payment does not match this order.");
    await applyPaymentResult(db, result, "Customer");
    res.json(customerView(await own(res.locals.customer.id, order.number)));
  });
  router.post("/orders/:number/cancel", async (req, res) => {
    const order = await own(res.locals.customer.id, String(req.params.number));
    if (!customerCanCancel(order.status))
      throw fail(
        "This order has already been packed. Contact support for help.",
        409,
      );
    await changeStatus(
      db,
      order.id,
      "cancelled",
      "Customer",
      "Cancelled by customer.",
    );
    res.json(customerView(await own(res.locals.customer.id, order.number)));
  });
  return router;
}

// Gateways call this server-to-server, so it reads the raw body for the
// signature check and is exempt from the browser origin rule.
export function paymentWebhookRoutes(
  db: Database,
  online: PaymentProvider | null,
) {
  const router = Router();
  router.post(
    "/payments/webhook/:provider",
    express.raw({ type: "*/*", limit: "1mb" }),
    async (req, res) => {
      if (!online?.webhook || online.id !== req.params.provider)
        throw fail("Unknown payment provider.", 404);
      const result = await online.webhook(req.body as Buffer, req.headers);
      if (result)
        await applyPaymentResult(db, result, `Gateway (${online.id})`).catch(
          (e) => {
            if ((e as { status?: number }).status !== 404) throw e;
          },
        );
      res.json({ ok: true });
    },
  );
  return router;
}

export function adminOrderRoutes(db: Database) {
  const router = Router();
  router.get("/orders", async (req, res) => {
    await expireStaleOrders(db);
    const status = String(req.query.status || "");
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 100);
    const where: Prisma.OrderWhereInput = {
      ...(orderStatuses.includes(status as OrderStatus)
        ? { status: status as OrderStatus }
        : {}),
      ...(status === "refund_due"
        ? { paymentStatus: "paid", status: { in: ["cancelled", "returned"] } }
        : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { trackingNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [rows, counts, refundDue] = await Promise.all([
      db.order.findMany({
        where,
        include: { items: true },
        orderBy: { placedAt: "desc" },
        take: 200,
      }),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.order.count({
        where: {
          paymentStatus: "paid",
          status: { in: ["cancelled", "returned"] },
        },
      }),
    ]);
    res.json({
      orders: rows.map((r) => serializeOrder(r, false)),
      counts: {
        ...Object.fromEntries(counts.map((c) => [c.status, c._count])),
        refund_due: refundDue,
      },
    });
  });
  router.get("/orders/:id", async (req, res) => {
    const row = await db.order.findUnique({
      where: { id: String(req.params.id) },
      include: orderInclude,
    });
    if (!row) throw fail("Order not found.", 404);
    res.json(serializeOrder(row));
  });
  router.patch("/orders/:id", async (req, res) => {
    const id = String(req.params.id);
    const { status, note, ...shipping } = body(orderUpdateSchema, req);
    const actor = res.locals.actor;
    if (status === "cancelled" && actor.role !== "admin")
      throw fail("Only an admin can cancel orders.", 403);
    if (Object.keys(shipping).length)
      await db.order.update({
        where: { id },
        data: {
          ...shipping,
          events: {
            create: {
              kind: "shipping",
              message: `Shipping details updated${shipping.courier ? ` · ${shipping.courier}` : ""}${shipping.trackingNumber ? ` · ${shipping.trackingNumber}` : ""}.`,
              actor: actor.name,
            },
          },
        },
      });
    if (status) await changeStatus(db, id, status, actor.name, note);
    const row = await db.order.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    });
    res.json(serializeOrder(row));
  });
  router.post("/orders/:id/payment", async (req, res) => {
    if (res.locals.actor.role !== "admin")
      throw fail("Only an admin can change payments.", 403);
    const id = String(req.params.id);
    const { status, note } = body(orderPaymentSchema, req);
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw fail("Order not found.", 404);
    if (
      status === "paid" &&
      order.paymentStatus !== "pending" &&
      order.paymentStatus !== "failed"
    )
      throw fail("This payment is already settled.", 409);
    if (status === "refunded" && order.paymentStatus !== "paid")
      throw fail("Only a paid order can be refunded.", 409);
    await db.$transaction([
      db.payment.updateMany({
        where: {
          orderId: id,
          status:
            status === "refunded" ? "paid" : { in: ["pending", "failed"] },
        },
        data: { status },
      }),
      db.order.update({
        where: { id },
        data: {
          paymentStatus: status,
          events: {
            create: {
              kind: "payment",
              message: `Payment marked ${status}${note ? ` · ${note}` : "."}`,
              actor: res.locals.actor.name,
            },
          },
        },
      }),
    ]);
    res.json(
      serializeOrder(
        await db.order.findUniqueOrThrow({
          where: { id },
          include: orderInclude,
        }),
      ),
    );
  });
  router.post("/orders/:id/notes", async (req, res) => {
    const id = String(req.params.id);
    const { text } = body(orderNoteSchema, req);
    await db.orderEvent.create({
      data: {
        orderId: id,
        kind: "note",
        message: text,
        actor: res.locals.actor.name,
      },
    });
    res
      .status(201)
      .json(
        serializeOrder(
          await db.order.findUniqueOrThrow({
            where: { id },
            include: orderInclude,
          }),
        ),
      );
  });
  router.get("/dashboard", async (_req, res) => res.json(await dashboard(db)));
  return router;
}

const BOOKED = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;
const IST = "Asia/Kolkata";

async function dashboard(db: Database) {
  await expireStaleOrders(db);
  const day = 86400000,
    now = Date.now();
  const since = (days: number) => new Date(now - days * day);
  const booked = { status: { in: [...BOOKED] } };
  const window = async (from: Date, to = new Date(now)) => {
    const r = await db.order.aggregate({
      where: { ...booked, placedAt: { gte: from, lt: to } },
      _sum: { total: true },
      _count: true,
    });
    return { revenue: Number(r._sum.total || 0), orders: r._count };
  };
  const startOfToday = new Date(
    `${new Date(now).toLocaleDateString("en-CA", { timeZone: IST })}T00:00:00+05:30`,
  );
  const [
    today,
    last7,
    last30,
    prev30,
    statusCounts,
    refundDue,
    series,
    top,
    regions,
    lowStock,
    recent,
    customers,
    buyers,
    mix,
  ] = await Promise.all([
    window(startOfToday),
    window(since(7)),
    window(since(30)),
    window(since(60), since(30)),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.count({
      where: {
        paymentStatus: "paid",
        status: { in: ["cancelled", "returned"] },
      },
    }),
    db.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
        SELECT to_char(("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${IST}, 'YYYY-MM-DD') AS day,
               COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders
        FROM "Order"
        WHERE "placedAt" >= ${since(14)} AND status::text IN (${Prisma.join([...BOOKED])})
        GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<
      {
        productId: string | null;
        name: string;
        image: string;
        units: number;
        revenue: number;
      }[]
    >`
        SELECT i."productId", MAX(i.name) AS name, MAX(i.image) AS image,
               SUM(i.quantity)::int AS units, SUM(i.quantity * i."unitPrice")::float AS revenue
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
        WHERE o."placedAt" >= ${since(30)} AND o.status::text IN (${Prisma.join([...BOOKED])})
        GROUP BY i."productId" ORDER BY units DESC, revenue DESC LIMIT 5`,
    db.$queryRaw<{ region: string; revenue: number; orders: number }[]>`
        SELECT region, SUM(total)::float AS revenue, COUNT(*)::int AS orders
        FROM "Order"
        WHERE "placedAt" >= ${since(30)} AND status::text IN (${Prisma.join([...BOOKED])})
        GROUP BY region ORDER BY revenue DESC LIMIT 6`,
    db.product.findMany({
      where: { stock: { lte: 5 } },
      select: {
        id: true,
        name: true,
        image: true,
        stock: true,
        published: true,
      },
      orderBy: { stock: "asc" },
      take: 6,
    }),
    db.order.findMany({
      include: { items: true },
      orderBy: { placedAt: "desc" },
      take: 6,
    }),
    db.customer.count(),
    db.customer.count({
      where: { orders: { some: { placedAt: { gte: since(30) } } } },
    }),
    db.order.groupBy({
      by: ["paymentMethod"],
      where: { ...booked, placedAt: { gte: since(30) } },
      _count: true,
    }),
  ]);
  const days = Array.from({ length: 14 }, (_, n) => {
    const key = new Date(now - (13 - n) * day).toLocaleDateString("en-CA", {
      timeZone: IST,
    });
    const hit = series.find((s) => s.day === key);
    return { day: key, revenue: hit?.revenue || 0, orders: hit?.orders || 0 };
  });
  return {
    today,
    last7,
    last30,
    prev30,
    averageOrder: last30.orders
      ? Math.round(last30.revenue / last30.orders)
      : 0,
    statusCounts: Object.fromEntries(
      statusCounts.map((c) => [c.status, c._count]),
    ),
    refundDue,
    days,
    topProducts: top,
    regions,
    lowStock,
    recentOrders: recent.map((r) => serializeOrder(r, false)),
    customers,
    buyers,
    paymentMix: Object.fromEntries(mix.map((m) => [m.paymentMethod, m._count])),
  };
}
