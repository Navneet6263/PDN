import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import seed from "./fixtures/demo-products.json";
type Api = (path: string, method?: string, body?: unknown, session?: string) => Promise<Response>;
export async function checkShopping(api: Api, base: string) {
  await api("/admin/categories", "POST", {
    slug: "shopping-test",
    label: "Shopping test",
    image: "",
    subCategories: [],
    position: 100,
    active: true,
  });
  const created = await api("/admin/products", "POST", {
    ...seed[0],
    slug: "shopping-test-product",
    category: "shopping-test",
    published: true,
    stock: 10,
  });
  assert.equal(created.status, 201);
  const email = "shopper@test.local",
    password = "customer-test-password";
  const account = await api(
    "/customer/register",
    "POST",
    { name: "Test Shopper", email, password },
    "",
  );
  assert.equal(account.status, 200);
  const cookie = account.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await account.json()).passwordHash, undefined);
  assert.equal((await api("/admin/products", "GET", undefined, cookie)).status, 401);
  const p = (await (await api("/products")).json()).find((p: { stock: number }) => p.stock >= 2);
  assert.ok(p);
  const item = {
    productId: p.id,
    size: p.sizes[0] || "One size",
    color: p.colors[0] || "",
    quantity: 1,
  };
  const merge = { token: randomUUID(), items: [item] };
  for (let i = 0; i < 2; i++)
    assert.equal((await api("/customer/cart/merge", "POST", merge, cookie)).status, 200);
  assert.deepEqual(await (await api("/customer/cart", "GET", undefined, cookie)).json(), [item]);
  assert.equal(
    (await api("/customer/cart/merge", "POST", { token: randomUUID(), items: [item] }, cookie))
      .status,
    200,
  );
  assert.equal(
    (await (await api("/customer/cart", "GET", undefined, cookie)).json())[0].quantity,
    2,
  );
  const bad = await (
    await api("/bag/quote", "POST", [{ ...item, size: "invalid-size" }], "")
  ).json();
  assert.equal(bad.valid, false);
  assert.equal((await api("/customer/checkout", "POST", {}, cookie)).status, 400);
  const address = {
    name: "Test Shopper",
    phone: "9876543210",
    line: "12 Test Street",
    city: "Delhi",
    state: "Delhi",
    pin: "110001",
  };
  const checkout = await api("/customer/checkout", "POST", address, cookie);
  assert.equal(checkout.status, 200);
  assert.equal((await checkout.json()).subtotal, p.price * 2);
  assert.deepEqual(
    (await (await api("/customer/checkout", "GET", undefined, cookie)).json()).address,
    address,
  );
  assert.equal(
    (
      await api(
        `/reviews/${p.id}`,
        "POST",
        { rating: 5, text: "Lovely fabric and a comfortable fit.", photos: [] },
        "",
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await api(
        `/reviews/${p.id}`,
        "POST",
        {
          rating: 5,
          text: "Lovely fabric and a comfortable fit.",
          photos: ["/media/not-owned.webp"],
        },
        cookie,
      )
    ).status,
    400,
  );
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "pink" } })
    .png()
    .toBuffer();
  const photo = await fetch(`${base}/api/reviews/photos`, {
    method: "POST",
    headers: { origin: "http://localhost:3000", cookie, "Content-Type": "image/png" },
    body: new Uint8Array(png),
  });
  assert.equal(photo.status, 201);
  const { url } = await photo.json();
  for (const rating of [5, 4])
    assert.equal(
      (
        await api(
          `/reviews/${p.id}`,
          "POST",
          { rating, text: "Lovely fabric and a comfortable fit.", photos: [url] },
          cookie,
        )
      ).status,
      201,
    );
  const reviews = await (await api(`/reviews/${p.id}`, "GET", undefined, "")).json();
  assert.equal(reviews.count, 1);
  assert.equal(reviews.average, 4);
  assert.deepEqual(reviews.reviews[0].photos, [url]);
  assert.equal(reviews.reviews[0].customer.email, undefined);
  const card = (await (await api("/products", "GET", undefined, "")).json()).find((item: { id: string }) => item.id === p.id);
  assert.equal(card.reviewCount, 1);
  assert.equal(card.ratingAverage, 4);
  await api("/customer/logout", "POST", {}, cookie);
  assert.equal((await api("/customer/cart", "GET", undefined, cookie)).status, 401);
  const login = await api("/customer/login", "POST", { email, password }, "");
  const newCookie = login.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await (await api("/customer/cart", "GET", undefined, newCookie)).json())[0].quantity,
    2,
  );
}
