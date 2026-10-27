import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("terra-style-skip-v1", "1"),
  );
});
test("customer catalog handles real products and an empty store", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/products");
  expect(response.status()).toBe(200);
  const products = await response.json();
  await page.goto("/");
  const store = await (await request.get("/api/storefront")).json();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    store.banners.find((b: { slot: string }) => b.slot === "hero")?.title ||
      store.settings.heroTitle,
  );
  if (products.length) {
    const product = products[0];
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(product.name);
    await expect(
      page
        .locator("#catalog")
        .getByRole("heading", { name: product.name, exact: true }),
    ).toBeVisible();
    await page.goto("/product/" + product.slug);
    await expect(
      page.getByRole("heading", { name: "What’s in the package" }),
    ).toBeVisible();
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp("/product/" + product.slug + "$"),
    );
  } else {
    await expect(
      page.getByRole("heading", { name: "Our collection is coming soon" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reset filters" }),
    ).toHaveCount(0);
  }
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/store-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("admin creates, edits and deletes a product with packet items", async ({
  page,
}) => {
  if (!process.env.E2E_PASSWORD)
    throw new Error("Set E2E_PASSWORD to the development admin password.");
  await page.goto("/admin");
  await page
    .getByLabel("Email address")
    .fill(process.env.E2E_EMAIL || "admin@terra.local");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add product" })).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Add product" }).click();
  const name = `Browser Test Set ${Date.now()}`;
  await page.getByLabel("Product name", { exact: true }).fill(name);
  await page.getByLabel("Brand", { exact: true }).fill("Browser test brand");
  await page
    .getByLabel("Exchange rules", { exact: true })
    .fill("Test exchange conditions entered by the store.");
  await page
    .getByLabel("Return & refund rules", { exact: true })
    .fill("Test return conditions entered by the store.");
  await page
    .getByLabel("Shipping & delivery information", { exact: true })
    .fill("Test delivery information.");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A test cotton kurta set with trousers and a matching dupatta.");
  await page.getByLabel("Item name", { exact: true }).fill("Kurta");
  await page.getByRole("button", { name: "Add another item" }).click();
  await page.getByLabel("Item name", { exact: true }).nth(1).fill("Dupatta");
  await page.getByLabel("Quantity", { exact: true }).nth(1).fill("2");
  await page.getByLabel("Selling price").fill("1299");
  await page.getByLabel("Stock quantity").fill("10");
  await page.getByLabel("Sizes (comma separated)").fill("S, M, L");
  await page
    .getByLabel("Upload product photos")
    .setInputFiles("public/images/women/emerald-embroidered-anarkali-set.webp");
  await expect(
    page.getByRole("img", { name: "Product photo 1" }),
  ).toBeVisible();
  await page.getByLabel("Published on storefront").check();
  await page.screenshot({
    path: "test-results/admin-product-editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByRole("status")).toContainText("Product saved");
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await expect(
    page.getByLabel("Item name", { exact: true }).nth(1),
  ).toHaveValue("Dupatta");
  await expect(page.getByLabel("Quantity", { exact: true }).nth(1)).toHaveValue(
    "2",
  );
  await expect(page.getByLabel("Exchange rules", { exact: true })).toHaveValue(
    "Test exchange conditions entered by the store.",
  );
  await expect(
    page.getByLabel("Return & refund rules", { exact: true }),
  ).toHaveValue("Test return conditions entered by the store.");
  await page.getByLabel("Stock quantity").fill("4");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByRole("status")).toContainText("Product saved");
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toContainText("4 units");
  const href = await row
    .getByRole("link", { name: `View ${name}` })
    .getAttribute("href");
  const product = await page.context().newPage();
  await product.goto(href!);
  await expect(
    product.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  await expect(product.getByText("Only 4 left in stock")).toBeVisible();
  await expect(product.getByText("Dupatta", { exact: true })).toBeVisible();
  await expect(
    product.getByText("Test exchange conditions entered by the store.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    product.getByText("Test return conditions entered by the store.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    product.getByText("Test delivery information.", { exact: true }),
  ).toBeVisible();
  await product.close();
  await page
    .getByRole("button", { name: `Delete ${name}`, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete product", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Product deleted");
  await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open admin menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
