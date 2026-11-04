import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="12345678"]', "90000005");
  await page.fill('input[placeholder="••••••••"]', "90000005");
  await page.click('button:has-text("Ingresar")');
  await page.waitForTimeout(4000);

  await page.goto("http://localhost:3000/eventos/gestion", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click Ver on first row
  await page.locator('tbody tr button:has-text("Ver")').first().click();
  await page.waitForTimeout(500);

  // Close modal with exact name: 'Cerrar'
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.waitForTimeout(500);

  console.log("Modal closed successfully. Now opening '+ Nuevo curso / actividad'...");
  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(500);

  console.log("Course form modal opened! Is title visible?:", await page.locator('h2:has-text("Crear nuevo curso o actividad")').isVisible());

  await browser.close();
}

main().catch(console.error);
