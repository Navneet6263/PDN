import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1540 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((img) => img.getBoundingClientRect().top < innerHeight)
        .map((img) => img.decode().catch(() => {})),
    );
  });
  await page.screenshot({ path: "artifacts/storefront-desktop.png", animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: "artifacts/storefront-mobile.png", animations: "disabled" });
  const broken = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.src),
  );
  if (broken.length) throw new Error(`Broken images: ${broken.join(", ")}`);
  console.log("Saved desktop and mobile previews; no broken images.");
} finally {
  await browser.close();
}
