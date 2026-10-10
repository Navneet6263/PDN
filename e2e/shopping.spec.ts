import "dotenv/config";
import { test, expect } from "@playwright/test";
import { openDatabase } from "../server/db";
import { mkdir } from "node:fs/promises";
test("spelling suggestions, guest bag, login, saved checkout and mobile layouts", async ({
  page,
}) => {
  const email = `e2e-shopping-${Date.now()}@example.test`;
  try {
    await page.goto("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const search = page.getByRole("combobox", { name: "Search the store" });
    await search.fill("sari");
    await expect(page.getByText("Showing matches for “saree”")).toBeVisible();
    await expect(page.locator("#search-suggestions li").first()).toBeVisible();
    await search.fill("pent");
    await expect(page.getByText("Showing matches for “pant”")).toBeVisible();
    await expect(page.locator("#search-suggestions li").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/product/sample-everyday-printed-kurti");
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(
      page.getByText("Please select your size first."),
    ).toBeVisible();
    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(page.getByText(/Added to your bag/)).toBeVisible();
    await page.goto("/cart");
    await expect(page.getByText("Size: M", { exact: false })).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Powder Blue Office Kurta Set" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sign in to checkout" }).click();
    await page
      .getByRole("button", { name: "New here? Create account" })
      .click();
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("Shopping Test");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("E2e-shopping-123!");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Hi, Shopping Test" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Open my bag" }).click();
    await expect(page.getByText("Size: M", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /Quantity for/ }),
    ).toHaveValue("1");
    await page.getByRole("link", { name: "Continue to checkout" }).click();
    for (const [label, value] of [
      ["Full name", "Shopping Test"],
      ["Mobile number", "9876543210"],
      ["House no., building, street, area", "12 Testing Street"],
      ["City / district", "Delhi"],
      ["State", "Delhi"],
      ["PIN code", "110001"],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await page
      .getByRole("button", { name: "Save address", exact: true })
      .click();
    await expect(page.getByText("12 Testing Street")).toBeVisible();
    await page.reload();
    await expect(page.getByText("12 Testing Street")).toBeVisible();
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page).toHaveURL(/\/checkout\/payment$/);
    await expect(
      page.getByRole("radio", { name: /Cash on delivery/ }),
    ).toBeVisible();
    await expect(page.getByText("Deliver to")).toBeVisible();
    await page.getByRole("link", { name: "Change" }).click();
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByLabel("House no., building, street, area")).toHaveValue(
      "12 Testing Street",
    );
    await mkdir("artifacts", { recursive: true });
    for (const width of [360, 390, 414]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: "artifacts/checkout-mobile.png",
      fullPage: true,
    });
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("E2e-shopping-123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Hi, Shopping Test" }),
    ).toBeVisible();
    await page.goto("/cart");
    await expect(
      page.getByRole("combobox", { name: /Quantity for/ }),
    ).toHaveValue("1");
    await page.screenshot({ path: "artifacts/bag-mobile.png", fullPage: true });
    await page.goto("/");
    for (const width of [360, 390, 414]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: "artifacts/shopping-home-mobile.png",
      fullPage: true,
    });
  } finally {
    const db = openDatabase();
    try {
      await db.customer.deleteMany({ where: { email } });
    } finally {
      await db.$disconnect();
    }
  }
});
test("hero rotates automatically and can be paused", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Featured collection" });
  const title = await hero.locator("h1").textContent();
  await expect(hero.locator("h1")).not.toHaveText(title!, { timeout: 8000 });
  await hero.getByRole("button", { name: "Pause banners" }).click();
  const paused = await hero.locator("h1").textContent();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(5500);
  await expect(hero.locator("h1")).toHaveText(paused!);
});

test("a signed-in customer can publish a review with a photo", async ({
  page,
}) => {
  const email = `e2e-review-${Date.now()}@example.test`;
  try {
    const response = await page.request.post("/api/customer/register", {
      headers: { origin: "http://localhost:3000" },
      data: { name: "Review Test", email, password: "E2e-review-123!" },
    });
    expect(response.ok()).toBe(true);
    await page.goto("/product/sample-everyday-printed-kurti");
    const reviews = page.locator("#reviews");
    await reviews.getByLabel("Rating", { exact: true }).selectOption("4");
    await reviews
      .getByLabel("Your experience")
      .fill("Temporary browser test: a comfortable fit and lovely fabric.");
    await reviews
      .locator('input[type="file"]')
      .setInputFiles("public/images/sample/office-monday.webp");
    await reviews.getByRole("button", { name: "Publish review" }).click();
    await expect(reviews.getByRole("status")).toContainText(
      "Your review is live",
    );
    await expect(
      reviews.getByAltText("Photo shared by Review Test"),
    ).toBeVisible();
    await page.reload();
    await expect(
      reviews.getByAltText("Photo shared by Review Test"),
    ).toBeVisible();
  } finally {
    const db = openDatabase();
    try {
      await db.customer.deleteMany({ where: { email } });
    } finally {
      await db.$disconnect();
    }
  }
});
