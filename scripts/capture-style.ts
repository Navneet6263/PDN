import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto("http://localhost:3000/");
  await page.getByRole("dialog").waitFor();
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: "artifacts/style-quiz.png" });
  await page.getByRole("dialog").getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yes, Saturdays too.", exact: false })
    .click();
  await page.screenshot({ path: "artifacts/saturday-question.png" });
  await page.getByRole("button", { name: "Show my style plan" }).click();
  await page.locator("#style-studio article").first().waitFor();
  await page.setViewportSize({width:1440,height:2000});
  await page.locator("#style-studio").scrollIntoViewIfNeeded();
  await page.locator("#style-studio").screenshot({ path: "artifacts/office-style-plan.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error("Mobile overflow");
  await page.setViewportSize({width:390,height:3500});
  await page.locator("#style-studio").screenshot({ path: "artifacts/style-plan-mobile.png" });
  console.log("Saved quiz, Saturday question, desktop and mobile planner previews.");
} finally {
  await browser.close();
}
