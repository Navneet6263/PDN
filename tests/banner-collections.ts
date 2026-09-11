import assert from "node:assert/strict";
type Api = (path: string, method?: string, body?: unknown, session?: string) => Promise<Response>;
export async function checkCollections(api: Api) {
  const products = await (await api("/admin/products")).json();
  const p = products.find((p: { published: boolean }) => p.published);
  assert.ok(p);
  const b = {
    title: "Festival test",
    subtitle: "Selected celebration styles",
    eyebrow: "Festive edit",
    image: p.image,
    mobileImage: "",
    buttonLabel: "Shop the edit",
    link: "/#catalog",
    slot: "hero",
    active: true,
    position: 0,
    startsAt: null,
    endsAt: null,
    destination: "collection",
    productIds: [p.id],
  };
  assert.equal((await api("/admin/banners", "POST", b, "")).status, 401);
  assert.equal(
    (await api("/admin/banners", "POST", { ...b, productIds: ["missing"] })).status,
    400,
  );
  const response = await api("/admin/banners", "POST", b);
  assert.equal(response.status, 201);
  const banner = await response.json();
  const find = async () =>
    (await (await api("/storefront", "GET", undefined, "")).json()).banners.find(
      (row: { id: string }) => row.id === banner.id,
    );
  assert.deepEqual((await find()).productIds, [p.id]);
  assert.equal((await find()).destination, "collection");
  await api(`/admin/banners/${banner.id}`, "PUT", { ...b, startsAt: "2099-01-01T00:00:00.000Z" });
  assert.equal(await find(), undefined);
  await api(`/admin/banners/${banner.id}`, "PUT", { ...b, active: false });
  assert.equal(await find(), undefined);
  await api(`/admin/banners/${banner.id}`, "DELETE");
}
