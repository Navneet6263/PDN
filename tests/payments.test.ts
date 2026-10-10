import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { razorpay } from "../server/payments/razorpay";
import { orderTotals } from "../lib/orders";

const hmac = (secret: string, data: string) =>
  createHmac("sha256", secret).update(data).digest("hex");

test("razorpay creates gateway orders in paise and verifies signatures", async () => {
  let received: { amount?: number; auth?: string } = {};
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      received = {
        amount: JSON.parse(raw).amount,
        auth: req.headers.authorization,
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ id: "order_ABC" }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const gateway = razorpay({
    keyId: "rzp_test_key",
    keySecret: "secret",
    webhookSecret: "hook",
    apiBase: `http://127.0.0.1:${port}`,
  });
  const created = await gateway.create({
    orderNumber: "TS1",
    paymentId: "pay1",
    amount: 679.5,
    currency: "INR",
    storeName: "Terra",
    customer: { name: "A", email: "a@b.c", phone: "9876543210" },
  });
  server.close();
  assert.equal(received.amount, 67950);
  assert.equal(
    received.auth,
    `Basic ${Buffer.from("rzp_test_key:secret").toString("base64")}`,
  );
  assert.equal(created.providerOrderId, "order_ABC");
  assert.equal(created.checkout.key, "rzp_test_key");

  const good = {
    razorpay_order_id: "order_ABC",
    razorpay_payment_id: "pay_XYZ",
    razorpay_signature: hmac("secret", "order_ABC|pay_XYZ"),
  };
  assert.equal((await gateway.verify(good)).status, "paid");
  await assert.rejects(
    gateway.verify({ ...good, razorpay_payment_id: "pay_OTHER" }),
  );

  const body = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_XYZ", order_id: "order_ABC" } } },
  });
  const result = await gateway.webhook!(Buffer.from(body), {
    "x-razorpay-signature": hmac("hook", body),
  });
  assert.deepEqual(result, {
    providerOrderId: "order_ABC",
    providerPaymentId: "pay_XYZ",
    status: "paid",
  });
  await assert.rejects(
    gateway.webhook!(Buffer.from(body), { "x-razorpay-signature": "bad" }),
  );
});

test("order totals apply free-shipping threshold and COD fee", () => {
  const s = {
    shippingFee: 79,
    freeShippingAbove: 999,
    codEnabled: true,
    codFee: 20,
    codMaxOrder: 0,
  };
  assert.deepEqual(orderTotals(500, s, "cod"), {
    subtotal: 500,
    shippingFee: 79,
    codFee: 20,
    discount: 0,
    total: 599,
  });
  assert.equal(orderTotals(999, s, "online").total, 999);
  assert.equal(
    orderTotals(0.1 + 0.2, { ...s, shippingFee: 0 }, "online").total,
    0.3,
  );
});
