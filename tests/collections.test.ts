import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesFilters, emptyFilters, filterCount } from "../lib/catalog-filters";
import { bannerSchema } from "../server/admin-schemas";
import { bannerLink } from "../lib/banner-link";
import seed from "./fixtures/demo-products.json";
import { productSchema } from "../server/validation";
test("multiple size selections use OR, colour and budget narrow the same result", () => {
  const p = {
    ...productSchema.parse(seed[0]),
    id: "filter-test",
    sizes: ["S", "M"],
    colors: ["Blue"],
    price: 1500,
    stock: 2,
  };
  const filters = { ...emptyFilters, sizes: ["M", "L"], colors: ["Blue"], budget: 2000 };
  assert.equal(matchesFilters(p, filters), true);
  assert.equal(matchesFilters(p, { ...filters, colors: ["Red"] }), false);
  assert.equal(matchesFilters(p, { ...filters, budget: 999 }), false);
  assert.equal(matchesFilters(p, { ...filters, sizes: ["XL"] }), false);
  assert.equal(matchesFilters({ ...p, stock: 0 }, { ...filters, available: true }), false);
  assert.equal(filterCount(filters), 4);
});
test("collection banner requires products and derives its own safe destination", () => {
  const b = {
    title: "Celebration",
    subtitle: "",
    eyebrow: "",
    image: "/images/hero-bg.jpg",
    mobileImage: "",
    buttonLabel: "Shop",
    link: "/#catalog",
    slot: "hero",
    active: true,
    position: 0,
    startsAt: null,
    endsAt: null,
    destination: "collection",
    productIds: [],
  };
  assert.equal(bannerSchema.safeParse(b).success, false);
  assert.equal(bannerSchema.safeParse({ ...b, productIds: ["one"] }).success, true);
  assert.equal(
    bannerLink({ id: "one", destination: "collection", link: "/#catalog" }),
    "/collection/one",
  );
  assert.equal(bannerLink({ destination: "link", link: "/product/saree" }), "/product/saree");
});
