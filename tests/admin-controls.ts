import assert from "node:assert/strict";
import { defaultSettings } from "../lib/store-types";
import { orderProducts, topTenProducts } from "../lib/catalog-order";
import type { Product } from "../lib/types";
import seed from "./fixtures/demo-products.json";
type Api = (path: string, method?: string, body?: unknown, session?: string) => Promise<Response>;
export async function checkControls(api: Api) {
  const settings = {
    ...defaultSettings,
    storeName: "Test store",
    returnPolicy: "Default test policy",
  };
  assert.equal((await api("/admin/settings", "PUT", settings)).status, 200);
  assert.equal((await (await api("/storefront")).json()).settings.storeName, "Test store");
  const category = await (
    await api("/admin/categories", "POST", {
      slug: "test-edit",
      label: "Test edit",
      image: "",
      subCategories: ["Cotton"],
      position: 0,
      active: true,
    })
  ).json();
  const one = (await (
    await api("/admin/products", "POST", {
      ...seed[0],
      slug: "rank-one",
      category: category.slug,
      published: true,
      stock: 4,
    })
  ).json()) as Product;
  const two = (await (
    await api("/admin/products", "POST", {
      ...seed[0],
      slug: "rank-two",
      category: category.slug,
      published: true,
      stock: 4,
    })
  ).json()) as Product;
  const merch = {
    topTenRank: 1,
    displayOrder: 1,
    searchPriority: 900,
    searchKeywords: ["festival"],
    featured: true,
  };
  assert.equal((await api(`/admin/merchandising/${one.id}`, "PATCH", merch)).status, 200);
  assert.equal((await api(`/admin/merchandising/${two.id}`, "PATCH", merch)).status, 409);
  assert.equal(
    (await api(`/admin/merchandising/${two.id}`, "PATCH", { ...merch, topTenRank: 11 })).status,
    400,
  );
  let products = (await (await api("/products")).json()) as Product[];
  assert.equal(topTenProducts(products)[0].id, one.id);
  assert.equal(orderProducts(products, "festival", "featured")[0].id, one.id);
  assert.equal(orderProducts(products, "does-not-match", "featured").length, 0);
  const boosted = {
    ...one,
    searchPriority: 100,
    searchKeywords: ["match"],
    price: 200,
    displayOrder: 100,
  };
  const cheap = {
    ...two,
    searchPriority: 0,
    searchKeywords: ["match"],
    price: 100,
    displayOrder: 1,
  };
  assert.equal(orderProducts([cheap, boosted], "match", "featured")[0].id, one.id);
  assert.equal(orderProducts([cheap, boosted], "match", "low")[0].id, two.id);
  assert.equal((await api(`/admin/inventory/${one.id}`, "PATCH", { stock: 0 })).status, 200);
  products = await (await api("/products")).json();
  assert.equal(topTenProducts(products).length, 0);
  assert.equal((await api(`/admin/inventory/${one.id}`, "PATCH", { delta: -1 })).status, 409);
  assert.equal((await api(`/admin/categories/${category.id}`, "DELETE")).status, 409);
  assert.equal(
    (await api(`/admin/categories/${category.id}`, "PUT", { ...category, active: false })).status,
    200,
  );
  assert.equal((await (await api("/products")).json()).length, 0);
  assert.equal((await api(`/products/${one.slug}`)).status, 404);
  const banner = {
    title: "Test hero",
    subtitle: "",
    eyebrow: "",
    image: "/images/hero-bg.jpg",
    mobileImage: "",
    buttonLabel: "Shop",
    link: "/#catalog",
    slot: "hero",
    position: 1,
    active: true,
    startsAt: null,
    endsAt: null,
  };
  const live = await (await api("/admin/banners", "POST", banner)).json();
  const future = await (
    await api("/admin/banners", "POST", {
      ...banner,
      title: "Future",
      startsAt: "2099-01-01T00:00:00.000Z",
    })
  ).json();
  const expired = await (
    await api("/admin/banners", "POST", {
      ...banner,
      title: "Expired",
      endsAt: "2000-01-01T00:00:00.000Z",
    })
  ).json();
  const publicStore = await (await api("/storefront")).json();
  assert.deepEqual(
    publicStore.banners.map((b: { id: string }) => b.id),
    [live.id],
  );
  assert.equal(
    (await api("/admin/banners", "POST", { ...banner, link: "//evil.example" })).status,
    400,
  );
  for (const b of [live, future, expired])
    assert.equal((await api(`/admin/banners/${b.id}`, "DELETE")).status, 200);
  for (const p of [one, two]) await api(`/admin/products/${p.id}`, "DELETE");
  assert.equal((await api(`/admin/categories/${category.id}`, "DELETE")).status, 200);
}
export async function checkRoles(api: Api) {
  const member = {
    name: "Inventory test",
    email: "inventory@test.local",
    role: "inventory",
    active: true,
    password: "test-password",
  };
  const created = await api("/admin/team", "POST", member);
  assert.equal(created.status, 201);
  const user = await created.json();
  assert.equal(user.passwordHash, undefined);
  const login = await api("/auth/login", "POST", {
    email: member.email,
    password: member.password,
  });
  assert.equal(login.status, 200);
  const session = login.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await api("/auth/me", "GET", undefined, session)).status, 200);
  assert.equal((await api("/admin/products", "GET", undefined, session)).status, 200);
  for (const path of ["settings", "team", "banners", "sales", "support"])
    assert.equal((await api(`/admin/${path}`, "GET", undefined, session)).status, 403);
  assert.equal((await api("/admin/products", "POST", seed[0], session)).status, 403);
  assert.equal(
    (await api(`/admin/team/${user.id}`, "PUT", { ...member, active: false })).status,
    200,
  );
  assert.equal((await api("/auth/me", "GET", undefined, session)).status, 401);
  await api(`/admin/team/${user.id}`, "DELETE");
  const support = await (
    await api("/admin/team", "POST", { ...member, email: "support@test.local", role: "support" })
  ).json();
  const supportLogin = await api("/auth/login", "POST", {
    email: support.email,
    password: member.password,
  });
  const supportSession = supportLogin.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await api("/admin/products", "GET", undefined, supportSession)).status, 403);
  const ticket = await (
    await api(
      "/admin/support",
      "POST",
      {
        customer: "Test customer",
        email: "customer@test.local",
        subject: "Package question",
        message: "Is a dupatta included?",
        priority: "high",
        status: "open",
        assigneeId: support.id,
      },
      supportSession,
    )
  ).json();
  assert.equal(
    (
      await api(
        `/admin/support/${ticket.id}/replies`,
        "POST",
        { text: "Confirmed package contents with customer." },
        supportSession,
      )
    ).status,
    201,
  );
  const tickets = await (await api("/admin/support", "GET", undefined, supportSession)).json();
  assert.equal(tickets[0].replies.length, 1);
  assert.equal(tickets[0].status, "pending");
  await api(`/admin/team/${support.id}`, "DELETE");
  const sale = {
    orderRef: "TEST-001",
    customerEmail: "customer@test.local",
    region: "Delhi",
    amount: 1299,
    status: "completed",
    soldAt: new Date().toISOString(),
  };
  const result = await api("/admin/sales", "POST", sale);
  assert.equal(result.status, 201);
  const saved = await result.json();
  assert.equal(saved.amount, 1299);
  assert.equal((await api("/admin/sales", "POST", sale)).status, 409);
  assert.equal(
    (await api(`/admin/sales/${saved.id}`, "PUT", { ...sale, status: "returned" })).status,
    200,
  );
  assert.equal((await api(`/admin/sales/${saved.id}`, "DELETE")).status, 200);
}
