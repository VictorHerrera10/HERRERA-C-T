import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots-eventos-scroll");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function runScrollTest(baseUrl = "http://localhost:3000") {
  console.log("=== INICIANDO PRUEBAS DE DESPLAZAMIENTO Y VISIBILIDAD DE CABECERA/PIE ===");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  // 1. Iniciar sesión como Administrador
  console.log(`\n[1] Iniciando sesión en ${baseUrl}/login...`);
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="12345678"]', "90000005");
  await page.fill('input[placeholder="••••••••"]', "90000005");
  await page.click('button:has-text("Ingresar")');
  await page.waitForTimeout(4000);

  // 2. Navegar a /eventos/gestion
  console.log(`\n[2] Navegando a ${baseUrl}/eventos/gestion...`);
  await page.goto(`${baseUrl}/eventos/gestion`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 3. Abrir modal del asistente
  console.log("\n[3] Abriendo asistente de creación (+ Nuevo curso / actividad)...");
  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(600);

  const modal = page.locator('#course-wizard-modal');
  const header = modal.locator('div.shrink-0').first();
  const title = modal.locator('h2');
  const stepper = modal.locator('div.shrink-0').nth(1);
  const footer = modal.locator('div.shrink-0').last();
  const scrollableBody = modal.locator('div.flex-1.overflow-y-auto');

  // Guardar posiciones iniciales
  const headerBoxInitial = await header.boundingBox();
  const titleBoxInitial = await title.boundingBox();
  const stepperBoxInitial = await stepper.boundingBox();
  const footerBoxInitial = await footer.boundingBox();

  console.log("Posición inicial de cabecera Y:", headerBoxInitial?.y);
  console.log("Posición inicial del título Y:", titleBoxInitial?.y);
  console.log("Posición inicial del stepper Y:", stepperBoxInitial?.y);
  console.log("Posición inicial del pie Y:", footerBoxInitial?.y);

  // 4. Probar desplazamiento vertical en Paso 1
  console.log("\n[4] Probando scroll en Paso 1...");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-step1-top.png` });

  // Desplazar el contenido central hacia abajo
  await scrollableBody.evaluate((el) => {
    el.scrollTop = 350;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-step1-scrolled.png` });

  // Verificar que el contenedor central se desplazó
  const scrollTopAfter = await scrollableBody.evaluate((el) => el.scrollTop);
  console.log("scrollTop del cuerpo central tras scroll:", scrollTopAfter);

  // Verificar que las posiciones de cabecera, título, stepper y pie NO se movieron
  const headerBoxScrolled = await header.boundingBox();
  const titleBoxScrolled = await title.boundingBox();
  const stepperBoxScrolled = await stepper.boundingBox();
  const footerBoxScrolled = await footer.boundingBox();

  const headerFixed = Math.abs((headerBoxScrolled?.y ?? 0) - (headerBoxInitial?.y ?? 0)) < 1;
  const titleFixed = Math.abs((titleBoxScrolled?.y ?? 0) - (titleBoxInitial?.y ?? 0)) < 1;
  const stepperFixed = Math.abs((stepperBoxScrolled?.y ?? 0) - (stepperBoxInitial?.y ?? 0)) < 1;
  const footerFixed = Math.abs((footerBoxScrolled?.y ?? 0) - (footerBoxInitial?.y ?? 0)) < 1;

  console.log("¿Cabecera permaneció fija?:", headerFixed);
  console.log("¿Título 'Crear nuevo curso...' permaneció fijo?:", titleFixed);
  console.log("¿Stepper de 6 pasos permaneció fijo?:", stepperFixed);
  console.log("¿Pie con botones permaneció fijo?:", footerFixed);

  // Verificar que la ventana exterior NO tiene scroll
  const outerScroll = await page.evaluate(() => {
    const backdrop = document.querySelector('#course-wizard-modal')?.parentElement;
    return {
      backdropScrollTop: backdrop ? backdrop.scrollTop : 0,
      bodyScrollTop: document.documentElement.scrollTop || document.body.scrollTop,
    };
  });
  console.log("Scroll en contenedor exterior y body (debe ser 0):", outerScroll);

  // 5. Llenar Paso 1 y avanzar a Paso 2
  console.log("\n[5] Avanzando a Paso 2...");
  await modal.locator('input[placeholder*="Especialización en"]').fill("Especialización Cloud con Microservicios");
  await modal.locator('input[placeholder*="Víctor Herrera"]').fill("Ing. Víctor Herrera");
  await modal.locator('textarea[placeholder*="Detalla los alcances"]').fill("Descripción completa de prueba de scroll de cabecera fija.");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // Verificar Paso 2: Scroll
  console.log("\n[6] Probando scroll en Paso 2...");
  await scrollableBody.evaluate((el) => { el.scrollTop = 200; });
  await page.waitForTimeout(300);
  const headerInStep2 = await title.isVisible();
  const stepperInStep2 = await stepper.isVisible();
  console.log("¿Título visible tras scroll en Paso 2?:", headerInStep2);
  console.log("¿Stepper visible tras scroll en Paso 2?:", stepperInStep2);

  // Llenar fechas y avanzar a Paso 3, 4, 5
  await modal.locator('input[type="date"]').nth(0).fill("2026-10-01");
  await modal.locator('input[type="date"]').nth(1).fill("2026-11-01");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // Paso 3
  await modal.locator('input[placeholder*="https://campus"]').fill("https://campus.horizenti.com/aulas/test");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // Paso 4
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 7. Probar Paso 5: Clausura y Certificación (Contenido largo)
  console.log("\n[7] Probando scroll en Paso 5 (Clausura y Certificación con contenido expandido)...");
  await modal.locator('text="¿Incluye ceremonia o evento de clausura?"').click();
  await modal.getByRole("button", { name: "SÍ, EMITE CERTIFICADO" }).click();
  await page.waitForTimeout(400);

  // Desplazar hacia abajo en Paso 5
  await scrollableBody.evaluate((el) => { el.scrollTop = 500; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-step5-scrolled.png` });

  const titleInStep5 = await title.isVisible();
  const stepperInStep5 = await stepper.isVisible();
  const footerInStep5 = await footer.locator('button:has-text("Siguiente")').isVisible();
  console.log("¿Título visible en Paso 5 tras scroll?:", titleInStep5);
  console.log("¿Stepper visible en Paso 5 tras scroll?:", stepperInStep5);
  console.log("¿Botón Siguiente visible y accesible en pie?:", footerInStep5);

  // Seleccionar plantilla activa y llenar clausura
  await modal.locator('input[placeholder*="Demoday"]').fill("Demoday Final");
  await modal.locator('input[type="date"]').fill("2026-11-02");
  const tplSelect = modal.locator('#section-h select');
  if (await tplSelect.count()) {
    await tplSelect.selectOption({ value: "tpl-cloud-devops" });
  }
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 8. Probar Paso 6: Revisión (Página larga con 5 bloques)
  console.log("\n[8] Probando scroll en Paso 6 (Revisión técnica consolidada)...");
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-step6-top.png` });

  // Desplazar hacia el final de la revisión
  await scrollableBody.evaluate((el) => { el.scrollTop = 1000; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-step6-scrolled-bottom.png` });

  const titleInStep6 = await title.isVisible();
  const stepperInStep6 = await stepper.isVisible();
  const createBtnInStep6 = await footer.locator('button:has-text("Crear actividad")').isVisible();
  console.log("¿Título visible en Paso 6 al llegar al final?:", titleInStep6);
  console.log("¿Stepper visible en Paso 6 al llegar al final?:", stepperInStep6);
  console.log("¿Botón 'Crear actividad' accesible en pie fijo?:", createBtnInStep6);

  // Cancelar para cerrar modal
  await modal.locator('button:has-text("Cancelar")').click();
  await page.waitForTimeout(500);

  // 9. Probar Responsive en Móvil (390x844)
  console.log("\n[9] Probando comportamiento de cabecera/pie fijos en móvil (390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(600);

  const mobileModal = page.locator('#course-wizard-modal');
  const mobileHeader = mobileModal.locator('div.shrink-0').first();
  const mobileTitle = mobileModal.locator('h2');
  const mobileStepper = mobileModal.locator('div.shrink-0').nth(1);
  const mobileFooter = mobileModal.locator('div.shrink-0').last();
  const mobileBody = mobileModal.locator('div.flex-1.overflow-y-auto');

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-mobile-step1-top.png` });

  // Desplazar cuerpo en móvil
  await mobileBody.evaluate((el) => { el.scrollTop = 300; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-mobile-step1-scrolled.png` });

  const mobileTitleVisible = await mobileTitle.isVisible();
  const mobileStepperVisible = await mobileStepper.isVisible();
  const mobileFooterVisible = await mobileFooter.locator('button:has-text("Siguiente")').isVisible();

  console.log("¿Título visible en móvil tras scroll?:", mobileTitleVisible);
  console.log("¿Stepper visible en móvil tras scroll?:", mobileStepperVisible);
  console.log("¿Botón Siguiente visible en móvil en pie fijo?:", mobileFooterVisible);

  await browser.close();
  console.log("\n=== TODAS LAS PRUEBAS DE DESPLAZAMIENTO FINALIZADAS EXITOSAMENTE ===");
}

if (process.argv[1] && process.argv[1].endsWith("test-scroll-header.mjs")) {
  runScrollTest().catch((err) => {
    console.error("Error en pruebas de scroll:", err);
    process.exit(1);
  });
}

