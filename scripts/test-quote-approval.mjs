import { chromium } from "playwright";

const PASSWORD = process.argv[2] ?? "Herrera2026!";
const browser = await chromium.launch();
const page = await browser.newPage();

page.on("pageerror", (err) => console.log("[pageerror]", err.message));
page.on("response", async (res) => {
  if (res.url().includes("supabase.co") && res.status() >= 400) {
    console.log("[http-err]", res.status(), res.url());
    try { console.log("  body:", await res.text()); } catch {}
  }
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill('input[placeholder="12345678"]', "00000000");
await page.fill('input[placeholder="••••••••"]', PASSWORD);
await page.click('button:has-text("Ingresar")');
await page.waitForTimeout(4000);
console.log("URL tras login:", page.url());
await page.screenshot({ path: "snap-q0-post-login.png" });

await page.goto("http://localhost:3000/cotizaciones/gestion", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: "snap-q1-lista.png" });
console.log("URL cotizaciones/gestion:", page.url());

await page.click('button:has-text("+ Nueva cotización")');
await page.waitForTimeout(2000);
console.log("URL tras crear:", page.url());
await page.screenshot({ path: "snap-q2-editor.png" });

const bodyText = await page.textContent("body");
console.log("Contiene 'Creada por':", bodyText?.includes("Creada por"));
console.log("Contiene 'Aprobación interna':", bodyText?.includes("Aprobación interna"));

// Seleccionar aprobador (el único admin: Administrador Herrera C&T) y enviar
const select = page.locator("select").filter({ hasText: "Elegir aprobador" }).first();
if (await select.count()) {
  await select.selectOption({ label: "Administrador Herrera C&T" });
  await page.click('button:has-text("Enviar a aprobación")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "snap-q3-en-aprobacion.png" });
  console.log("Tras enviar a aprobación, body incluye 'En aprobación':", (await page.textContent("body"))?.includes("En aprobación"));
}

// Como somos el mismo admin asignado, debe verse el bloque de decisión
const approveBtn = page.locator('button:has-text("Aprobar internamente")');
if (await approveBtn.count()) {
  await approveBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "snap-q4-aprobada.png" });
  console.log("Tras aprobar, body incluye 'Aprobada internamente':", (await page.textContent("body"))?.includes("Aprobada internamente"));
}

await browser.close();
