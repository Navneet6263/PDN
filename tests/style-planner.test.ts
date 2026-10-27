import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialProfile,
  parseProfile,
  styleMatches,
  plannerDays,
  planProducts,
} from "../lib/style-planner";
import { womenProducts } from "../scripts/women-catalog";
const products = womenProducts.map((p, i) => ({ ...p, id: String(i) }));
test("the launch catalog fills a Monday–Saturday office plan with a bold Saturday", () => {
  const plan = planProducts(products, {
    ...initialProfile,
    budget: 10000000,
    saturday: true,
  });
  assert.equal(plan.length, 6);
  assert.ok(plan.every((p) => p.searchKeywords.includes("mood:office")));
  assert.ok(plan[5].searchKeywords.includes("style:bold"));
});
test("office picks exclude occasion wear and obey stock and budget", () => {
  const picks = styleMatches(products, { ...initialProfile, budget: 1500 });
  assert.ok(picks.length > 0);
  assert.ok(picks.every((p) => p.price <= 1500));
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
});
test("festive mood finds the ethnic occasion pieces", () => {
  const picks = styleMatches(products, {
    ...initialProfile,
    mood: "festive",
    budget: 10000000,
  });
  assert.ok(picks.some((p) => /saree/i.test(p.name)));
  assert.ok(picks.every((p) => p.searchKeywords.includes("mood:festive")));
});
test("Saturday is opt-in and small pools do not fabricate extra products", () => {
  assert.equal(plannerDays(initialProfile).length, 5);
  const days = plannerDays({ ...initialProfile, saturday: true });
  assert.equal(days.length, 6);
  assert.match(days[5].note, /Your calendar let you down/);
  assert.equal(plannerDays({ ...initialProfile, mood: "college" }).length, 3);
});
test("saved profiles are validated; older profiles with an audience still load", () => {
  assert.deepEqual(
    parseProfile(JSON.stringify(initialProfile)),
    initialProfile,
  );
  assert.deepEqual(
    parseProfile(JSON.stringify({ ...initialProfile, audience: "women" })),
    initialProfile,
  );
  for (const value of [
    "broken",
    "{}",
    JSON.stringify({ ...initialProfile, budget: -1 }),
  ])
    assert.equal(parseProfile(value), null);
});
test("admin mood tags can opt an in-stock product into a mood", () => {
  const p = { ...products[0], searchKeywords: ["mood:office", "style:ethnic"] };
  assert.equal(
    styleMatches([p], { ...initialProfile, budget: 10000000 })[0].id,
    p.id,
  );
  assert.equal(
    styleMatches([{ ...p, searchKeywords: ["mood:festive"] }], initialProfile)
      .length,
    0,
  );
});
