import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { createServer } from "node:http";
import { razorpay } from "../server/payments/razorpay";
import { payu } from "../server/payments/payu";
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

test("payu signs the hosted checkout form and verifies PayU's response hash", async () => {
  const sha = (s: string) => createHash("sha512").update(s).digest("hex");
  const gateway = payu({
    key: "TESTKEY",
    salt: "TESTSALT",
    mode: "test",
    siteUrl: "https://pdn.example.in",
  });
  const created = await gateway.create({
    orderNumber: "TS261010-ABC",
    paymentId: "pay1",
    amount: 679,
    currency: "INR",
    storeName: "Terra",
    customer: { name: "Priya (Sharma)", email: "p@x.in", phone: "9876543210" },
  });
  const f = created.checkout.fields as Record<string, string>;
  assert.equal(created.checkout.action, "https://test.payu.in/_payment");
  assert.equal(f.amount, "679.00");
  assert.equal(f.firstname, "Priya Sharma");
  assert.equal(f.surl, "https://pdn.example.in/api/payments/return/payu");
  assert.equal(f.txnid, created.providerOrderId);
  assert.equal(
    f.hash,
    sha(
      `TESTKEY|${f.txnid}|679.00|${f.productinfo}|Priya Sharma|p@x.in|TS261010-ABC||||||||||TESTSALT`,
    ),
  );

  const reply = (
    status: string,
    amount = "679.00",
    extra: Record<string, string> = {},
  ) => {
    const base = `TESTSALT|${status}||||||||||TS261010-ABC|p@x.in|Priya Sharma|${f.productinfo}|${amount}|${f.txnid}|TESTKEY`;
    return {
      key: "TESTKEY",
      txnid: f.txnid,
      status,
      amount,
      productinfo: f.productinfo,
      firstname: "Priya Sharma",
      email: "p@x.in",
      udf1: "TS261010-ABC",
      mihpayid: "403993715531",
      hash: sha(
        extra.additionalCharges ? `${extra.additionalCharges}|${base}` : base,
      ),
      ...extra,
    };
  };
  const ok = await gateway.verify(reply("success"));
  assert.equal(ok.status, "paid");
  assert.equal(ok.amount, 679);
  assert.equal(ok.providerPaymentId, "403993715531");
  assert.equal((await gateway.verify(reply("failure"))).status, "failed");
  assert.equal((await gateway.verify(reply("pending"))).status, "pending");
  assert.equal(
    (
      await gateway.verify(
        reply("success", "679.00", { additionalCharges: "12.00" }),
      )
    ).status,
    "paid",
  );
  // Changing any signed field (here the amount) breaks the hash.
  await assert.rejects(gateway.verify({ ...reply("success"), amount: "1.00" }));
  await assert.rejects(gateway.verify({ ...reply("success"), key: "OTHER" }));
  const hook = await gateway.webhook!(
    Buffer.from(new URLSearchParams(reply("success")).toString()),
    {},
  );
  assert.equal(hook?.status, "paid");
});

test("razorpay refuses tiny amounts and hides key errors from customers", async () => {
  const server = createServer((_req, res) => {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: { description: "Authentication failed" } }),
    );
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const gateway = razorpay({
    keyId: "rzp_test_x",
    keySecret: "wrong",
    apiBase: `http://127.0.0.1:${port}`,
  });
  const request = {
    orderNumber: "TS1",
    paymentId: "pay1",
    amount: 0.5,
    currency: "INR",
    storeName: "Terra",
    customer: { name: "A", email: "a@b.c", phone: "9876543210" },
  };
  await assert.rejects(gateway.create(request), /at least ₹1/);
  const logged: string[] = [];
  const original = console.error;
  console.error = (m: string) => logged.push(m);
  try {
    await assert.rejects(
      gateway.create({ ...request, amount: 10 }),
      (e: Error & { status?: number }) => {
        assert.equal(e.status, 502);
        assert.doesNotMatch(e.message, /key/i);
        return true;
      },
    );
  } finally {
    console.error = original;
    server.close();
  }
  assert.match(logged.join(" "), /rejected the API keys \(401\)/);
});
