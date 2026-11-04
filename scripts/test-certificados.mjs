import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots-certificados");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTests() {
  console.log("Iniciando pruebas de validación con Playwright...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  // 1. Desktop Test (1280x800)
  console.log("\n=== 1. Probando en Escritorio (1280x800) ===");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await desktopContext.newPage();

  await page.goto("http://localhost:3000/certificados", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-desktop-initial.png`, fullPage: false });

  // ── Test 1: Indicador de carga y prevención de duplicados ──
  console.log("\n[1] Probando estado de carga y prevención de envíos duplicados...");
  await page.fill("#verification-code-input", "HZ-DEMO-VALIDO");
  const submitBtn = page.locator('button[type="submit"]');

  // Hacer click e inmediatamente verificar estado de carga
  await submitBtn.click();
  const isLoadingTextVisible = await page.locator('text="Estamos verificando tu certificado…"').isVisible();
  const isSpinnerVisible = await page.locator('button[type="submit"] .animate-spin').isVisible();
  const isBtnDisabled = await submitBtn.isDisabled();

  console.log("¿Texto 'Estamos verificando tu certificado…' visible?:", isLoadingTextVisible);
  console.log("¿Spinner circular visible?:", isSpinnerVisible);
  console.log("¿Botón deshabilitado durante la carga?:", isBtnDisabled);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-desktop-loading-state.png`, fullPage: false });

  // ── Test 2: Certificado Válido (Terminada la carga, sin modal) ──
  console.log("\n[2] Probando resultado válido tras la carga...");
  await page.waitForSelector("#resultado-certificado h2");
  const modalCountValido = await page.locator('[role="dialog"]').count();
  console.log("¿Modal visible para HZ-DEMO-VALIDO? (Debe ser false):", modalCountValido > 0);

  const validHeader = await page.locator("#resultado-certificado h2:has-text('CERTIFICADO VÁLIDO')").isVisible();
  const participantVisible = await page.locator("text=Juan Pérez García").isVisible();
  console.log("CERTIFICADO VÁLIDO visible:", validHeader);
  console.log("Participante Juan Pérez García visible:", participantVisible);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-desktop-valido-directo.png`, fullPage: false });

  // ── Test 3: Código Inválido (Modal de CERTIFICADO INVÁLIDO) ──
  console.log("\n[3] Probando código inválido (HZ-NO-EXISTE)...");
  await page.fill("#verification-code-input", "HZ-NO-EXISTE");
  await page.click('button:has-text("VERIFICAR CERTIFICADO")');

  await page.waitForSelector('[role="dialog"]', { state: "visible" });
  await page.waitForTimeout(350);
  const modalTitle = await page.locator('[role="dialog"] #modal-invalido-title').textContent();
  console.log("Modal de inválido visible. Título:", modalTitle?.trim());
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-desktop-modal-invalido.png`, fullPage: false });
  await page.click('[role="dialog"] button:has-text("Entendido")');
  await page.waitForTimeout(400);

  // ── Test 4: Error de Conexión (Aviso discreto + Botón VOLVER A INTENTAR) ──
  console.log("\n[4] Probando error de conexión con HZ-ERROR-RED...");
  await page.fill("#verification-code-input", "HZ-ERROR-RED");
  await page.click('button:has-text("VERIFICAR CERTIFICADO")');

  // Esperar a que termine la carga simulada
  await page.waitForTimeout(700);

  // Verificar que NO hay modal grande
  const modalCountError = await page.locator('[role="dialog"]').count();
  console.log("¿Modal emergente para error de conexión? (Debe ser false):", modalCountError > 0);

  // Verificar aviso amigable discreto junto al formulario
  const errorNotice = page.locator("#code-connection-error");
  const isErrorNoticeVisible = await errorNotice.isVisible();
  const errorNoticeText = await errorNotice.textContent();
  console.log("¿Aviso amigable visible junto al formulario?:", isErrorNoticeVisible);
  console.log("Texto del aviso amigable:", errorNoticeText?.trim());

  // Verificar que el botón cambió a VOLVER A INTENTAR
  const retryBtnVisible = await page.locator('button:has-text("VOLVER A INTENTAR")').isVisible();
  console.log("¿Botón principal cambió a 'VOLVER A INTENTAR'?:", retryBtnVisible);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-desktop-error-discreto-retry.png`, fullPage: false });

  // ── Test 5: Reintento fallido ──
  console.log("\n[5] Probando reintento fallido con 'VOLVER A INTENTAR'...");
  await page.click('button:has-text("VOLVER A INTENTAR")');
  // Verificar spinner durante el nuevo intento
  const isRetrying = await page.locator('text="Estamos verificando tu certificado…"').isVisible();
  console.log("¿Spinner activo durante nuevo intento?:", isRetrying);
  await page.waitForTimeout(700);

  const errorStillVisible = await page.locator("#code-connection-error").isVisible();
  const btnStillRetry = await page.locator('button:has-text("VOLVER A INTENTAR")').isVisible();
  console.log("¿Aviso amigable persiste tras nuevo intento fallido?:", errorStillVisible);
  console.log("¿Botón permanece como 'VOLVER A INTENTAR'?:", btnStillRetry);

  // ── Test 6: Reintento exitoso ──
  console.log("\n[6] Probando nuevo intento exitoso cambiando el código a HZ-DEMO-VALIDO...");
  await page.fill("#verification-code-input", "HZ-DEMO-VALIDO");
  await page.click('button:has-text("VOLVER A INTENTAR")');
  await page.waitForTimeout(700);

  const errorGone = (await page.locator("#code-connection-error").count()) === 0;
  const validAgain = await page.locator("#resultado-certificado h2:has-text('CERTIFICADO VÁLIDO')").isVisible();
  const btnReset = await page.locator('button:has-text("VERIFICAR CERTIFICADO")').isVisible();
  console.log("¿Aviso de error desapareció tras éxito?:", errorGone);
  console.log("¿Resultado válido visible directamente?:", validAgain);
  console.log("¿Botón volvió a 'VERIFICAR CERTIFICADO'?:", btnReset);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-desktop-retry-exitoso.png`, fullPage: false });

  await desktopContext.close();

  // 2. Mobile Test (390x844 - iPhone)
  console.log("\n=== 2. Probando en Móvil (390x844) ===");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto("http://localhost:3000/certificados", { waitUntil: "networkidle" });

  const hasHScroll = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log("Móvil - ¿Desborde horizontal?:", hasHScroll);

  // Error de conexión en móvil
  await mobilePage.fill("#verification-code-input", "HZ-ERROR-RED");
  await mobilePage.click('button:has-text("VERIFICAR CERTIFICADO")');
  await mobilePage.waitForTimeout(700);

  const mobileErrorNotice = await mobilePage.locator("#code-connection-error").isVisible();
  const mobileRetryBtn = await mobilePage.locator('button:has-text("VOLVER A INTENTAR")').isVisible();
  console.log("Móvil - ¿Aviso amigable visible?:", mobileErrorNotice);
  console.log("Móvil - ¿Botón VOLVER A INTENTAR visible?:", mobileRetryBtn);

  const hasHScrollWithError = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log("Móvil - ¿Desborde horizontal con aviso de error?:", hasHScrollWithError);
  await mobilePage.screenshot({ path: `${SCREENSHOTS_DIR}/07-mobile-error-discreto.png`, fullPage: false });

  await mobileContext.close();
  await browser.close();
  console.log("\nPruebas automatizadas finalizadas con éxito.");
}

runTests().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
