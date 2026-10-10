import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("terra-style-skip-v1", "1"));
});
test("fashion homepage, department navigation and header search work", async ({
  page,
  request,
}) => {
  const products = await (await request.get("/api/products")).json();
  // Studio catalog (scripts/load-catalog.ts) plus the ethnic preview listings.
  expect(products.filter((p: { slug: string }) => p.slug.startsWith("c-")).length).toBe(191);
  expect(
    new Set(products.map((p: { image: string }) => p.image)).size,
  ).toBe(products.length);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const store = await (await request.get("/api/storefront")).json();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    store.banners.find((b: { slot: string }) => b.slot === "hero")?.title ||
      store.settings.heroTitle,
  );
  await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
  await page.screenshot({ path: "test-results/fashion-home-desktop.png", animations: "disabled" });
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Women", exact: true })
    .click();
  await page.locator("header").getByRole("link", { name: "Sarees", exact: true }).click();
  await expect(page).toHaveURL(/type=Sarees/);
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter((p: { subCategory: string }) => p.subCategory === "Sarees").length,
  );
  await page.getByRole("combobox", { name: "Search the store" }).fill("Sunshine");
  await page.getByRole("combobox", { name: "Search the store" }).press("Enter");
  await expect(page.locator("#catalog a h3")).toHaveCount(1);
  await expect(page.locator("#catalog a h3")).toHaveText("Girls Sunshine Lehenga");
  await page.goto("/");
  await page.locator("#catalog").getByLabel("Filter by price").selectOption("999");
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter((p: { price: number }) => p.price <= 999).length,
  );
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/fashion-home-mobile.png", animations: "disabled" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open categories" }).click();
  const mobile = page.getByRole("navigation", { name: "Mobile categories", exact: true });
  await mobile.locator("summary").filter({ hasText: "Kids" }).click();
  await mobile.getByRole("link", { name: "Girls Ethnic Wear", exact: true }).click();
  await expect(page.locator("#catalog a h3")).toHaveCount(
    products.filter((p: { subCategory: string }) => p.subCategory === "Girls Ethnic Wear").length,
  );
  await page.locator("#catalog a").first().click();
  await expect(page.getByRole("heading", { name: "What’s in the package" })).toBeVisible();
  await expect(
    page.getByText("Sample product for storefront preview.", { exact: false }),
  ).toBeVisible();
});
