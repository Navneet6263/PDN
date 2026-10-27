import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("terra-style-skip-v1", "1"),
  );
});
test("fashion homepage, department navigation and header search work", async ({
  page,
  request,
}) => {
  const products = await (await request.get("/api/products")).json();
  // Women-only launch catalog: every product has its own photo.
  expect(products.length).toBeGreaterThanOrEqual(11);
  expect(new Set(products.map((p: { image: string }) => p.image)).size).toBe(
    products.length,
  );
  const departments = (
    await (await request.get("/api/storefront")).json()
  ).categories.map((c: { slug: string }) => c.slug);
  expect(departments).not.toContain("men");
  expect(departments).not.toContain("kids");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const store = await (await request.get("/api/storefront")).json();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    store.banners.find((b: { slot: string }) => b.slot === "hero")?.title ||
      store.settings.heroTitle,
  );
  await expect(
    page.getByRole("heading", { name: "Shop by category" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/fashion-home-desktop.png",
    animations: "disabled",
  });
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Ethnic Wear", exact: true })
    .click();
  await page
    .locator("header")
    .getByRole("link", { name: "Sarees", exact: true })
    .click();
  await expect(page).toHaveURL(/type=Sarees/);
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter((p: { subCategory: string }) => p.subCategory === "Sarees")
      .length,
  );
  await page
    .getByRole("combobox", { name: "Search the store" })
    .fill("Banarasi");
  await page.getByRole("combobox", { name: "Search the store" }).press("Enter");
  await expect(page.locator("#catalog a h3")).toHaveCount(1);
  await expect(page.locator("#catalog a h3")).toHaveText(
    "Banarasi Zari Silk Saree",
  );
  await page.goto("/");
  await page
    .locator("#catalog")
    .getByLabel("Filter by price")
    .selectOption("999");
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter((p: { price: number }) => p.price <= 999).length,
  );
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/fashion-home-mobile.png",
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open categories" }).click();
  const mobile = page.getByRole("navigation", {
    name: "Mobile categories",
    exact: true,
  });
  await mobile.locator("summary").filter({ hasText: "Workwear" }).click();
  await mobile
    .getByRole("link", { name: "Shirt & Trouser Sets", exact: true })
    .click();
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter(
      (p: { subCategory: string }) => p.subCategory === "Shirt & Trouser Sets",
    ).length,
  );
  await page.locator("#catalog a").first().click();
  await expect(
    page.getByRole("heading", { name: "What’s in the package" }),
  ).toBeVisible();
});
