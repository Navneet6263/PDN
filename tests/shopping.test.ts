import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearch } from "../lib/search";
import { cartSchema, mergeCart } from "../lib/shopping";
test("fashion spellings normalize consistently", () => {
  assert.equal(normalizeSearch("silk sari"), normalizeSearch("silk sarees"));
  for (const word of ["pent", "paint", "trousers", "pants"])
    assert.equal(normalizeSearch(word), "pant");
  assert.equal(normalizeSearch("t-shirt"), normalizeSearch("tees"));
});
test("cart merges variants without losing sizes and caps quantities", () => {
  const a = { productId: "one", size: "M", color: "Blue", quantity: 2 };
  assert.deepEqual(
    mergeCart(
      [a],
      [
        { ...a, quantity: 3 },
        { ...a, size: "L" },
      ],
    ),
    [
      { ...a, quantity: 5 },
      { ...a, size: "L" },
    ],
  );
  assert.equal(mergeCart([a], [{ ...a, quantity: 10 }])[0].quantity, 10);
  assert.equal(cartSchema.safeParse([{ ...a, quantity: -1 }]).success, false);
});
