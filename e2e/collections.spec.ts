import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Banner } from "../lib/store-types";
import type { Product } from "../lib/types";
test("admin selects festival products and customers use staged mobile filters", async ({
  page,
}) => {
  const title = `Festival Preview ${Date.now()}`;
  const headers = { Origin: "http://localhost:3000" };
  const login = await page.request.post("/api/auth/login", {
    headers,
    data: { email: process.env.E2E_EMAIL || "admin@pdn.com", password: process.env.E2E_PASSWORD },
  });
  expect(login.ok()).toBe(true);
  const products: Product[] = await (await page.request.get("/api/products")).json();
  const chosen = ["sample-everyday-printed-kurti", "sample-floral-everyday-kurta"].map((slug) =>
    products.find((p) => p.slug === slug)!,
  );
  expect(chosen.every(Boolean)).toBe(true);
  let banner: Banner | undefined;
  try {
    await page.goto("/admin?section=Banners");
    await page.getByRole("button", { name: "Add new", exact: true }).click();
    await page.getByLabel("Banner title", { exact: true }).fill(title);
    await page
      .getByLabel("Description", { exact: true })
      .fill("Discover the styles selected for your next celebration.");
    await page
      .getByLabel("Desktop image", { exact: true })
      .fill("/images/sample/festive-family.png");
    await page.getByLabel("Banner destination type", { exact: true }).selectOption("collection");
    for (const product of chosen)
      await page.getByRole("checkbox", { name: new RegExp(product.name) }).check();
    await page.getByLabel("Enable banner", { exact: true }).check();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Saved successfully");
    banner = (await (await page.request.get("/api/admin/banners")).json()).find(
      (b: Banner) => b.title === title,
    );
    expect(banner?.productIds).toEqual(chosen.map((p) => p.id));
    await page.reload();
    await page
      .getByRole("row")
      .filter({ hasText: title })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await expect(page.getByText("Selected styles (2/100)", { exact: true })).toBeVisible();
    await mkdir("artifacts", { recursive: true });
    await page.screenshot({ path: "artifacts/admin-festival-collection.png", fullPage: true });
    await page.addInitScript(() =>
      localStorage.setItem(
        "terra-style-profile-v1",
        JSON.stringify({
          audience: "kids",
          mood: "festive",
          style: "ethnic",
          budget: 1000,
          saturday: false,
        }),
      ),
    );
    await page.goto("/");
    await page.getByRole("link", { name: `Explore ${title}`, exact: true }).click();
    await expect(page).toHaveURL(`/collection/${banner!.id}`);
    await expect(page.locator("#catalog a h3")).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#catalog").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Open mobile filters" }).click();
    const dialog = page.getByRole("dialog", { name: "Filter & sort styles" });
    await dialog.getByRole("checkbox", { name: "Size: M", exact: true }).check();
    await dialog.getByRole("checkbox", { name: "Size: L", exact: true }).check();
    await dialog.getByRole("button", { name: "Close filters" }).click();
    await expect(page.locator('[aria-label="Selected filters"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Open mobile filters" }).click();
    await expect(dialog.getByRole("checkbox", { name: "Size: M", exact: true })).not.toBeChecked();
    await dialog.getByRole("checkbox", { name: "Size: M", exact: true }).check();
    await dialog.getByRole("checkbox", { name: "Size: L", exact: true }).check();
    await dialog
      .getByRole("checkbox", { name: `Colour: ${chosen[0].colors[0]}`, exact: true })
      .check();
    await expect(
      dialog.getByRole("button", { name: "Apply filters · 1 style", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: "artifacts/mobile-festival-filters.png" });
    await dialog.getByRole("button", { name: /^Apply filters/ }).click();
    await expect(page.locator("#catalog a h3")).toHaveCount(1);
    await expect(page.locator("#catalog a h3")).toHaveText(chosen[0].name);
    await page.getByRole("button", { name: "Open mobile filters" }).click();
    await expect(dialog.getByRole("checkbox", { name: "Size: M", exact: true })).toBeChecked();
    await dialog.getByRole("button", { name: "Clear filters", exact: true }).click();
    await dialog.getByRole("button", { name: /^Apply filters/ }).click();
    await expect(page.locator("#catalog a h3")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: "artifacts/festival-collection-mobile.png", fullPage: true });
    await page.request.put(`/api/admin/banners/${banner!.id}`, {
      headers,
      data: { ...banner, active: false },
    });
    const inactive = await page.goto(`/collection/${banner!.id}`);
    expect(inactive?.status()).toBe(404);
  } finally {
    const rows: Banner[] = await (await page.request.get("/api/admin/banners")).json();
    for (const b of rows.filter((b) => b.title === title))
      await page.request.delete(`/api/admin/banners/${b.id}`, { headers });
  }
});
