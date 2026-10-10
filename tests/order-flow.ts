import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import seed from "./fixtures/demo-products.json";
import type { Order } from "../lib/orders";
type Api = (
  path: string,
  method?: string,
  body?: unknown,
  session?: string,
) => Promise<Response>;

const address = {
  name: "Order Tester",
  phone: "9876543210",
  line: "221 Order Street",
  city: "Jaipur",
  state: "Rajasthan",
  pin: "302001",
};

export async function checkOrders(api: Api, base: string) {
  await api("/admin/categories", "POST", {
    slug: "orders-test",
    label: "Orders test",
    image: "",
    subCategories: [],
    position: 200,
    active: true,
  });
  const product = await (
    await api("/admin/products", "POST", {
      ...seed[0],
      slug: "orders-test-product",
      category: "orders-test",
      published: true,
      price: 600,
      originalPrice: 900,
      stock: 3,
    })
  ).json();
  const stock = async () =>
    (await (await api("/admin/products")).json()).find(
      (p: { id: string }) => p.id === product.id,
    ).stock as number;
  const account = await api(
    "/customer/register",
    "POST",
    {
      name: "Order Tester",
      email: "orders@test.local",
      password: "order-test-password",
    },
    "",
  );
  const shopper = account.headers.get("set-cookie")!.split(";")[0];
  const item = {
    productId: product.id,
    size: product.sizes[0] || "One size",
    color: product.colors[0] || "",
    quantity: 2,
  };
  const fill = (quantity = 2) =>
    api("/customer/cart", "PUT", [{ ...item, quantity }], shopper);
  await fill();

  // Checkout exposes charges and the configured gateway.
  const checkout = await (
    await api("/customer/checkout", "GET", undefined, shopper)
  ).json();
  assert.equal(checkout.options.online.provider, "test");
  assert.equal(checkout.options.charges.freeShippingAbove, 999);

  // Cash on delivery: confirmed at once, stock reserved, bag emptied.
  const key = randomUUID();
  const placed = await api(
    "/customer/orders",
    "POST",
    { address, paymentMethod: "cod", idempotencyKey: key },
    shopper,
  );
  assert.equal(placed.status, 201);
  const cod = (await placed.json()).order as Order;
  assert.equal(cod.status, "confirmed");
  assert.equal(cod.paymentStatus, "pending");
  assert.equal(cod.subtotal, 1200);
  assert.equal(cod.shippingFee, 0);
  assert.equal(cod.total, 1200);
  assert.equal(cod.items[0].mrp, 900);
  assert.equal(await stock(), 1);
  assert.deepEqual(
    await (await api("/customer/cart", "GET", undefined, shopper)).json(),
    [],
  );

  // Retrying with the same key returns the same order instead of a duplicate.
  const retry = await api(
    "/customer/orders",
    "POST",
    { address, paymentMethod: "cod", idempotencyKey: key },
    shopper,
  );
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).order.number, cod.number);

  // Stock is enforced at placement time.
  await fill(2);
  const oversold = await api(
    "/customer/orders",
    "POST",
    { address, paymentMethod: "cod", idempotencyKey: randomUUID() },
    shopper,
  );
  assert.equal(oversold.status, 409);

  // Online payment: pending until the gateway confirms; shipping applies below threshold.
  await fill(1);
  const online = await (
    await api(
      "/customer/orders",
      "POST",
      { address, paymentMethod: "online", idempotencyKey: randomUUID() },
      shopper,
    )
  ).json();
  assert.equal(online.order.status, "pending_payment");
  assert.equal(online.order.shippingFee, 79);
  assert.equal(online.order.total, 679);
  assert.equal(online.checkout.provider, "test");
  assert.equal(await stock(), 0);
  const failedPay = await api(
    `/customer/orders/${online.order.number}/verify`,
    "POST",
    { providerOrderId: online.checkout.providerOrderId, outcome: "failure" },
    shopper,
  );
  assert.equal((await failedPay.json()).status, "pending_payment");
  const retryPay = await (
    await api(
      `/customer/orders/${online.order.number}/pay`,
      "POST",
      {},
      shopper,
    )
  ).json();
  const paid = await (
    await api(
      `/customer/orders/${online.order.number}/verify`,
      "POST",
      {
        providerOrderId: retryPay.checkout.providerOrderId,
        outcome: "success",
      },
      shopper,
    )
  ).json();
  assert.equal(paid.status, "confirmed");
  assert.equal(paid.paymentStatus, "paid");
  // Webhooks without a configured handler are rejected, and do not need an Origin header.
  assert.equal(
    (
      await fetch(`${base}/api/payments/webhook/razorpay`, {
        method: "POST",
        body: "{}",
      })
    ).status,
    404,
  );

  // Another customer cannot see or pay this order.
  const other = await api(
    "/customer/register",
    "POST",
    {
      name: "Other Person",
      email: "other@test.local",
      password: "order-test-password",
    },
    "",
  );
  const otherCookie = other.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await api(`/customer/orders/${cod.number}`, "GET", undefined, otherCookie))
      .status,
    404,
  );

  // Customer cancellation restores stock.
  const cancelled = await (
    await api(`/customer/orders/${cod.number}/cancel`, "POST", {}, shopper)
  ).json();
  assert.equal(cancelled.status, "cancelled");
  assert.equal(await stock(), 2);
  assert.equal(
    (await api(`/customer/orders/${cod.number}/cancel`, "POST", {}, shopper))
      .status,
    409,
  );
  const mine = await (
    await api("/customer/orders", "GET", undefined, shopper)
  ).json();
  assert.equal(mine.length, 2);

  // Admin fulfilment: transitions are enforced, tracking saved, COD collected on delivery.
  await fill(1);
  const second = (
    await (
      await api(
        "/customer/orders",
        "POST",
        { address, paymentMethod: "cod", idempotencyKey: randomUUID() },
        shopper,
      )
    ).json()
  ).order as Order;
  const list = await (await api("/admin/orders?status=confirmed")).json();
  assert.ok(list.orders.some((o: Order) => o.number === second.number));
  assert.equal(list.counts.cancelled, 1);
  assert.equal(
    (await api(`/admin/orders/${second.id}`, "PATCH", { status: "delivered" }))
      .status,
    409,
  );
  for (const status of ["packed", "shipped", "delivered"]) {
    const r = await api(`/admin/orders/${second.id}`, "PATCH", {
      status,
      ...(status === "shipped"
        ? { courier: "Delhivery", trackingNumber: "DLV123" }
        : {}),
    });
    assert.equal(r.status, 200);
  }
  const delivered = await (await api(`/admin/orders/${second.id}`)).json();
  assert.equal(delivered.status, "delivered");
  assert.equal(delivered.trackingNumber, "DLV123");
  assert.equal(delivered.paymentStatus, "paid");
  assert.ok(delivered.events.length >= 4);
  assert.equal(
    (
      await api(`/admin/orders/${second.id}/notes`, "POST", {
        text: "Gift wrap",
      })
    ).status,
    201,
  );
  const customerView = await (
    await api(`/customer/orders/${second.number}`, "GET", undefined, shopper)
  ).json();
  assert.equal(
    customerView.events.some((e: { kind: string }) => e.kind === "note"),
    false,
  );

  // Return after delivery restores stock and flags the refund.
  await api(`/admin/orders/${second.id}`, "PATCH", { status: "returned" });
  const returned = await (await api(`/admin/orders?status=refund_due`)).json();
  assert.ok(
    returned.orders.some((o: Order) => o.id === second.id && o.refundDue),
  );
  assert.equal(
    (
      await api(`/admin/orders/${second.id}/payment`, "POST", {
        status: "refunded",
        note: "UPI",
      })
    ).status,
    200,
  );

  const dash = await (await api("/admin/dashboard")).json();
  assert.equal(dash.days.length, 14);
  assert.ok(dash.last30.orders >= 1);
  assert.ok(Array.isArray(dash.topProducts));

  // Inventory staff can fulfil but not cancel or refund; support can only read and note.
  const staff = async (role: string) => {
    await api("/admin/team", "POST", {
      name: `${role} staff`,
      email: `${role}-orders@test.local`,
      role,
      active: true,
      password: "staff-password",
    });
    const login = await api("/auth/login", "POST", {
      email: `${role}-orders@test.local`,
      password: "staff-password",
    });
    return login.headers.get("set-cookie")!.split(";")[0];
  };
  const inventory = await staff("inventory");
  assert.equal(
    (await api("/admin/orders", "GET", undefined, inventory)).status,
    200,
  );
  assert.equal(
    (
      await api(
        `/admin/orders/${paid.id}`,
        "PATCH",
        { status: "cancelled" },
        inventory,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        `/admin/orders/${paid.id}`,
        "PATCH",
        { status: "packed" },
        inventory,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await api(
        `/admin/orders/${paid.id}/payment`,
        "POST",
        { status: "refunded" },
        inventory,
      )
    ).status,
    403,
  );
  assert.equal(
    (await api("/admin/dashboard", "GET", undefined, inventory)).status,
    403,
  );
  const support = await staff("support");
  assert.equal(
    (await api(`/admin/orders/${paid.id}`, "GET", undefined, support)).status,
    200,
  );
  assert.equal(
    (
      await api(
        `/admin/orders/${paid.id}`,
        "PATCH",
        { status: "shipped" },
        support,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        `/admin/orders/${paid.id}/notes`,
        "POST",
        { text: "Called customer" },
        support,
      )
    ).status,
    201,
  );
}

export async function checkCoupons(api: Api) {
  const product = await (
    await api("/admin/products", "POST", {
      ...seed[0],
      slug: "coupon-test-product",
      category: "orders-test",
      published: true,
      price: 1500,
      originalPrice: 2000,
      stock: 20,
    })
  ).json();
  const account = await api(
    "/customer/register",
    "POST",
    {
      name: "Coupon Tester",
      email: "coupons@test.local",
      password: "coupon-test-password",
    },
    "",
  );
  const shopper = account.headers.get("set-cookie")!.split(";")[0];
  const fill = () =>
    api(
      "/customer/cart",
      "PUT",
      [
        {
          productId: product.id,
          size: product.sizes[0] || "One size",
          color: product.colors[0] || "",
          quantity: 1,
        },
      ],
      shopper,
    );
  const place = async (couponCode: string, paymentMethod = "online") => {
    await fill();
    return api(
      "/customer/orders",
      "POST",
      { address, paymentMethod, idempotencyKey: randomUUID(), couponCode },
      shopper,
    );
  };
  const base = {
    description: "",
    minOrder: 0,
    maxDiscount: 0,
    perCustomer: 0,
    allowedEmails: [],
    active: true,
    startsAt: null,
    endsAt: null,
  };
  assert.equal(
    (
      await api("/admin/coupons", "POST", {
        ...base,
        code: "bad",
        type: "percent",
        value: 150,
        maxUses: 0,
      })
    ).status,
    400,
  );
  const test = await (
    await api("/admin/coupons", "POST", {
      ...base,
      code: "navneet",
      type: "fixed_total",
      value: 1,
      maxUses: 2,
    })
  ).json();
  assert.equal(test.code, "NAVNEET");
  await api("/admin/coupons", "POST", {
    ...base,
    code: "SAVE10",
    type: "percent",
    value: 10,
    maxDiscount: 100,
    minOrder: 1000,
    maxUses: 0,
    perCustomer: 1,
  });

  await fill();
  assert.equal(
    (await api("/customer/coupon", "POST", { code: "NOPE" }, shopper)).status,
    400,
  );
  const preview = await (
    await api("/customer/coupon", "POST", { code: "navneet" }, shopper)
  ).json();
  assert.equal(preview.type, "fixed_total");

  // Fixed total: the whole online order costs ₹1 and the gateway is asked for ₹1.
  const one = await (await place("navneet")).json();
  assert.equal(one.order.total, 1);
  assert.equal(one.order.couponCode, "NAVNEET");
  assert.equal(one.order.discount, 1499);
  assert.equal(one.order.subtotal, 1500);

  // Percent with a cap: 10% of 1500 = 150, capped at 100. Once per customer.
  const ten = await (await place("SAVE10", "cod")).json();
  assert.equal(ten.order.discount, 100);
  assert.equal(ten.order.total, 1400);
  assert.equal((await place("SAVE10", "cod")).status, 400);

  // Use limits: NAVNEET allows 2; cancelling an order gives its use back.
  const two = await (await place("NAVNEET")).json();
  assert.equal(two.order.total, 1);
  assert.equal((await place("NAVNEET")).status, 400);
  await api(`/customer/orders/${two.order.number}/cancel`, "POST", {}, shopper);
  assert.equal((await place("NAVNEET")).status, 201);
  const listed = (await (await api("/admin/coupons")).json()).find(
    (c: { code: string }) => c.code === "NAVNEET",
  );
  assert.equal(listed.used, 2);

  // Switched-off coupons stop working immediately.
  await api(`/admin/coupons/${test.id}`, "PUT", {
    ...base,
    code: "NAVNEET",
    type: "fixed_total",
    value: 1,
    maxUses: 5,
    active: false,
  });
  assert.equal(
    (await api("/customer/coupon", "POST", { code: "NAVNEET" }, shopper))
      .status,
    400,
  );
  // Code cannot be renamed.
  assert.equal(
    (
      await api(`/admin/coupons/${test.id}`, "PUT", {
        ...base,
        code: "OTHER",
        type: "flat",
        value: 5,
        maxUses: 0,
      })
    ).status,
    400,
  );
}
