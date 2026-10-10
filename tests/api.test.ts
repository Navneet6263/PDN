import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { scryptSync, randomUUID } from "node:crypto";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { Client } from "pg";
import sharp from "sharp";
import { createApp } from "../server/app";
import { openDatabase, type Database } from "../server/db";
import { productSchema } from "../server/validation";
import seed from "./fixtures/demo-products.json";
import { checkControls, checkRoles } from "./admin-controls";
import { checkShopping } from "./customer-flow";
import { checkCollections } from "./banner-collections";
import { checkOrders } from "./order-flow";
import { testGateway } from "../server/payments/test-gateway";
let connection: Client,
  db: Database,
  server: Server,
  base: string,
  directory: string,
  databaseUrl: string;
const schema = `terra_test_${randomUUID().replaceAll("-", "")}`;
const origin = "http://localhost:3000";
const salt = "a".repeat(32);
let cookie = "";
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "terra-test-"));
  const url = new URL(
    process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/terra_store",
  );
  connection = new Client({ connectionString: url.href });
  await connection.connect();
  await connection.query(`CREATE SCHEMA "${schema}"`);
  await connection.query(`SET search_path TO "${schema}"`);
  const migrations = new URL("../prisma/migrations/", import.meta.url);
  for (const entry of (await readdir(migrations, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    await connection.query(
      await readFile(new URL(`${entry.name}/migration.sql`, migrations), "utf8"),
    );
  }
  await connection.query("SET search_path TO public");
  url.searchParams.set("schema", schema);
  databaseUrl = url.href;
  db = openDatabase(databaseUrl);
  const app = createApp(db, {
    email: "test@terra.local",
    hash: `${salt}:${scryptSync("test-password", salt, 64).toString("hex")}`,
    origin,
    secure: false,
    uploadDir: directory,
    onlinePayment: testGateway(),
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await db?.$disconnect();
  if (connection) {
    assert.match(schema, /^terra_test_[a-f0-9]{32}$/);
    await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await connection.query("SET search_path TO public");
    await connection.end();
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});
const api = (path: string, method = "GET", body?: unknown, session = cookie) =>
  fetch(`${base}/api${path}`, {
    method,
    headers: {
      Origin: origin,
      Cookie: session,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
test("all seed products satisfy product validation", () => {
  for (const product of seed) assert.equal(productSchema.safeParse(product).success, true);
});
test("admin authentication, origin enforcement and session cookies", async () => {
  assert.equal((await api("/admin/products", "GET", undefined, "")).status, 401);
  assert.equal(
    (
      await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/auth/login", "POST", {
        email: "test@terra.local",
        password: "wrong",
      })
    ).status,
    401,
  );
  const login = await api("/auth/login", "POST", {
    email: "test@terra.local",
    password: "test-password",
  });
  assert.equal(login.status, 200);
  const header = login.headers.get("set-cookie")!;
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Strict/);
  cookie = header.split(";")[0];
  assert.equal((await api("/auth/me")).status, 200);
});
test("draft lifecycle, package data, unique slugs and durable PostgreSQL storage", async () => {
  const draft = {
    ...seed[0],
    published: false,
    returnPolicy: "Test return instructions, written by the store.",
    exchangePolicy: "Test exchange instructions, written by the store.",
    shippingInfo: "Test dispatch instructions.",
    warrantyInfo: "Test warranty details.",
    additionalInfo: "Test additional details.",
    packageContents: [
      { name: "Saree", quantity: 1 },
      { name: "Blouse piece", quantity: 2 },
    ],
  };
  const created = await api("/admin/products", "POST", draft);
  assert.equal(created.status, 201);
  const p = await created.json();
  assert.equal((await (await api("/products")).json()).length, 0);
  assert.equal((await api(`/products/${p.slug}`)).status, 404);
  assert.equal((await api("/admin/products", "POST", draft)).status, 409);
  assert.equal(
    (
      await api(`/admin/products/${p.id}`, "PUT", {
        ...draft,
        published: true,
        stock: 3,
      })
    ).status,
    200,
  );
  const visible = await (await api(`/products/${p.slug}`)).json();
  assert.equal(visible.packageContents[1].quantity, 2);
  assert.equal(visible.stock, 3);
  for (const key of [
    "returnPolicy",
    "exchangePolicy",
    "shippingInfo",
    "warrantyInfo",
    "additionalInfo",
  ] as const)
    assert.equal(visible[key], draft[key]);
  assert.equal(
    (
      await api("/admin/products", "POST", {
        ...draft,
        slug: "invalid-policy",
        returnPolicy: "a".repeat(5001),
      })
    ).status,
    400,
  );
  const reopened = openDatabase(databaseUrl);
  assert.equal((await reopened.product.findUnique({ where: { slug: p.slug } }))?.stock, 3);
  await reopened.$disconnect();
  assert.equal(
    (
      await api("/admin/products", "POST", {
        ...draft,
        slug: "bad-packet",
        packageContents: [],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api("/admin/products", "POST", {
        ...draft,
        slug: "bad-price",
        price: -1,
      })
    ).status,
    400,
  );
  assert.equal((await api("/admin/products/not-valid", "PUT", draft)).status, 404);
  assert.equal((await api(`/admin/products/${p.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/products/${p.slug}`)).status, 404);
  assert.equal(await db.packageItem.count({ where: { productId: p.id } }), 0);
});
test("image uploads require login, validate content and produce optimized WebP", async () => {
  const png = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#ff0000" },
  })
    .png()
    .toBuffer();
  const upload = (buffer: Buffer, session = cookie) =>
    fetch(`${base}/api/admin/uploads`, {
      method: "POST",
      headers: { Origin: origin, Cookie: session, "Content-Type": "image/png" },
      body: new Uint8Array(buffer),
    });
  assert.equal((await upload(png, "")).status, 401);
  assert.equal((await upload(Buffer.from("<script>invalid</script>"))).status, 400);
  const result = await upload(png);
  assert.equal(result.status, 201);
  const { url } = await result.json();
  assert.match(url, /\.webp$/);
  const image = await fetch(`${base}${url}`);
  assert.equal(image.status, 200);
  const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  assert.equal(meta.format, "webp");
});
test("merchandising, category visibility, scheduled banners and settings persist", async () =>
  checkControls(api));
test("team roles, revoked sessions, support and sales use real records", async () =>
  checkRoles(api));
test("customer cart merges once, checkout validates and photo reviews persist", async () =>
  checkShopping(api, base));

test("orders reserve stock, take COD or online payment and follow fulfilment rules", async () =>
  checkOrders(api, base));

test("festival banner selections validate, persist and respect scheduling", async () =>
  checkCollections(api));

test("logout invalidates session and failed logins are rate limited", async () => {
  assert.equal((await api("/auth/logout", "POST")).status, 200);
  assert.equal((await api("/admin/products")).status, 401);
  for (let i = 0; i < 10; i++)
    assert.equal(
      (
        await api("/auth/login", "POST", {
          email: "test@terra.local",
          password: "wrong",
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await api("/auth/login", "POST", {
        email: "test@terra.local",
        password: "wrong",
      })
    ).status,
    429,
  );
});
