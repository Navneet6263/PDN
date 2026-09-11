import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("terra-style-skip-v1", "1"));
});
import { readFileSync } from "node:fs";
const fixture = JSON.parse(readFileSync("tests/fixtures/demo-products.json", "utf8"));
test("admin placement, banners and settings appear on the customer page", async ({ page }) => {
  if (!process.env.E2E_PASSWORD) throw new Error("Set E2E_PASSWORD");
  await page.goto("/admin");
  await page.getByLabel("Email address").fill(process.env.E2E_EMAIL || "admin@pdn.com");
  await page.getByLabel("Password", { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add product" })).toBeVisible();
  const origin = new URL(page.url()).origin;
  const api = page.request;
  const headers = { Origin: origin };
  const unique = Date.now();
  const original = await (await api.get("/api/admin/settings")).json();
  const existing = await (await api.get("/api/admin/products")).json();
  const free =
    Array.from({ length: 10 }, (_, i) => i + 1).find(
      (rank) => !existing.some((p: { topTenRank: number | null }) => p.topTenRank === rank),
    ) || 10;
  const displaced = existing.find((p: { topTenRank: number | null }) => p.topTenRank === free);
  expect(free).toBeTruthy();
  const response = await api.post("/api/admin/products", {
    headers,
    data: {
      ...fixture[0],
      name: `Placement Test ${unique}`,
      slug: `placement-test-${unique}`,
      published: true,
      stock: 8,
    },
  });
  expect(response.status()).toBe(201);
  const product = await response.json();
  let bannerId = "";
  try {
    if (displaced)
      expect(
        (
          await api.patch(`/api/admin/merchandising/${displaced.id}`, {
            headers,
            data: { ...displaced, topTenRank: null },
          })
        ).status(),
      ).toBe(200);
    await page.reload();
    await page.getByRole("button", { name: "Top 10 & Search", exact: true }).click();
    await page.getByRole("button").filter({ hasText: product.name }).last().click();
    await page.getByLabel("Top 10 position").selectOption(String(free));
    await page.getByLabel("Search priority").fill("900");
    await page.getByLabel("Search keywords").fill(`unique${unique}`);
    await page.getByRole("button", { name: "Save placement" }).click();
    await expect(page.getByRole("status")).toContainText("Placement saved");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Top 10 & Search" })).toBeVisible();
    await page.screenshot({ path: "test-results/admin-merchandising.png", fullPage: true });
    await page.getByRole("button", { name: "Banners", exact: true }).click();
    await page.getByRole("button", { name: "Add new" }).click();
    await page.getByLabel("Banner title").fill(`Test Campaign ${unique}`);
    await page.getByLabel("Desktop image").fill("/images/hero-bg.jpg");
    await page.getByLabel("Display position").fill("0");
    await page.getByLabel("Enable banner").check();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toContainText("Saved successfully");
    const banners = await (await api.get("/api/admin/banners")).json();
    bannerId = banners.find((b: { title: string }) => b.title === `Test Campaign ${unique}`).id;
    await page.getByRole("button", { name: "Store Settings", exact: true }).click();
    await page.getByLabel("Store Name").fill("Browser Test Store");
    await page.getByRole("button", { name: "Save store settings" }).click();
    await expect(page.getByRole("status")).toContainText("Store settings saved");
    const customer = await page.context().newPage();
    await customer.goto("/");
    await expect(customer.getByRole("heading", { level: 1 })).toHaveText(`Test Campaign ${unique}`);
    await expect(customer.getByRole("link", { name: "Browser Test Store home" })).toBeVisible();
    const top = customer
      .locator("section")
      .filter({ has: customer.getByRole("heading", { name: original.topTenTitle, exact: true }) });
    await expect(top.getByRole("heading", { name: product.name, exact: true })).toBeVisible();
    await customer.getByRole("textbox", { name: "Search products" }).fill(`unique${unique}`);
    await expect(
      customer.locator("#catalog").getByRole("heading", { name: product.name, exact: true }),
    ).toBeVisible();
    await customer.close();
    for (const section of [
      "Categories",
      "Inventory",
      "Sales & Regions",
      "Support",
      "Team & Roles",
    ]) {
      await page.getByRole("button", { name: section, exact: true }).click();
      await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    test.setTimeout(90000);
    await api.put("/api/admin/settings", { headers, data: original });
    if (bannerId) await api.delete(`/api/admin/banners/${bannerId}`, { headers });
    else {
      const rows = await (await api.get("/api/admin/banners")).json();
      for (const b of rows.filter((b: { title: string }) => b.title === `Test Campaign ${unique}`))
        await api.delete(`/api/admin/banners/${b.id}`, { headers });
    }
    await api.delete(`/api/admin/products/${product.id}`, { headers });
    if (displaced)
      expect(
        (
          await api.patch(`/api/admin/merchandising/${displaced.id}`, { headers, data: displaced })
        ).status(),
      ).toBe(200);
  }
});
