import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="12345678"]', "00000000");
  await page.fill('input[placeholder="••••••••"]', "Herrera2026!");
  await page.click('button:has-text("Ingresar")');
  await page.waitForTimeout(4500);

  console.log("Final URL:", page.url());
  const body = await page.textContent("body");
  console.log("Body snippet:", body?.slice(0, 300));

  await page.screenshot({ path: "debug-login.png" });
  await browser.close();
}

main().catch(console.error);

