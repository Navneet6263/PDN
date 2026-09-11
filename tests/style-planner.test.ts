import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialProfile,
  parseProfile,
  styleMatches,
  plannerDays,
  planProducts,
} from "../lib/style-planner";
import { sampleProducts } from "../scripts/sample-catalog";
const products = sampleProducts.map((p, i) => ({ ...p, id: String(i) }));
test("a six-style office pool reserves a distinct bold Saturday look", () => {
  const six = Array.from({ length: 6 }, (_, i) => ({
    ...products[1],
    id: String(i),
    searchKeywords: ["mood:office", i === 5 ? "style:bold" : "style:minimal"],
  }));
  const plan = planProducts(six, { ...initialProfile, saturday: true });
  assert.equal(new Set(plan.map((p) => p.id)).size, 6);
  assert.equal(plan[5].id, "5");
});
test("office excludes occasion wear and obeys department, stock and budget", () => {
  const picks = styleMatches(products, { ...initialProfile, budget: 1000 });
  assert.ok(picks.length > 0);
  assert.ok(picks.every((p) => p.category === "women" && p.price <= 1000));
  assert.ok(picks.every((p) => !/lehenga|saree|anarkali/i.test(p.name)));
  const one = picks[0];
  assert.equal(
    styleMatches(
      [
        { ...one, published: false },
        { ...one, stock: 0 },
      ],
      initialProfile,
    ).length,
    0,
  );
  assert.equal(
    styleMatches(products, { ...initialProfile, audience: "kids", mood: "everyday", budget: 1000 })
      .length,
    0,
  );
});
test("Saturday is opt-in and small pools do not fabricate extra products", () => {
  assert.equal(plannerDays(initialProfile).length, 5);
  const days = plannerDays({ ...initialProfile, saturday: true });
  assert.equal(days.length, 6);
  assert.match(days[5].note, /Your calendar let you down/);
  assert.equal(plannerDays({ ...initialProfile, mood: "college" }).length, 3);
});
test("saved profile validation rejects malformed or inappropriate values", () => {
  assert.deepEqual(parseProfile(JSON.stringify(initialProfile)), initialProfile);
  for (const value of [
    "broken",
    "{}",
    JSON.stringify({ ...initialProfile, budget: -1 }),
    JSON.stringify({ ...initialProfile, audience: "kids", mood: "office" }),
  ])
    assert.equal(parseProfile(value), null);
});
test("admin mood tags can opt an in-stock product into a mood", () => {
  const p = {
    ...products.find((p) => p.category === "men" && p.subCategory === "Kurtas")!,
    searchKeywords: ["mood:office", "style:ethnic"],
  };
  assert.equal(styleMatches([p], { ...initialProfile, audience: "men" })[0].id, p.id);
  assert.equal(
    styleMatches([{ ...p, searchKeywords: ["mood:festive"] }], {
      ...initialProfile,
      audience: "men",
    }).length,
    0,
  );
});
