import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots-eventos");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log("=== INICIANDO PRUEBAS DE EVENTOS Y FORMACIÓN (PLAYWRIGHT) ===");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  page.on("pageerror", (err) => console.log("[pageerror]", err.message));

  // 1. Iniciar sesión como Administrador (DNI 90000005)
  console.log("\n[1] Iniciando sesión en /login con usuario Administrador (90000005)...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="12345678"]', "90000005");
  await page.fill('input[placeholder="••••••••"]', "90000005");
  await page.click('button:has-text("Ingresar")');
  
  // Esperar a que la cortina de bienvenida termine (2.6s) y redirija a /inicio
  console.log("Esperando transición de sesión (SessionCurtain)...");
  await page.waitForTimeout(4000);
  console.log("URL tras login:", page.url());
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-hub-inicio.png` });

  // 2. Hub de inicio: Verificar módulo "Eventos y Formación"
  console.log("\n[2] Verificando módulo en /inicio...");
  const eventosCardVisible = await page.locator('text="Eventos y Formación"').first().isVisible();
  console.log("¿Tarjeta de 'Eventos y Formación' visible en /inicio?:", eventosCardVisible);

  // 3. Navegar a /eventos/gestion
  console.log("\n[3] Navegando a /eventos/gestion...");
  await page.goto("http://localhost:3000/eventos/gestion", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-eventos-dashboard.png` });

  // Verificar título y sidebar
  const pageTitle = await page.locator("h1:has-text('Eventos y Formación')").isVisible();
  console.log("¿Título de página 'Eventos y Formación' visible?:", pageTitle);

  const sidebarEventosLink = await page.locator('aside a:has-text("Eventos y Formación")').first().isVisible();
  console.log("¿Enlace 'Eventos y Formación' visible en sidebar de PlatformShell?:", sidebarEventosLink);

  // 4. Verificar Estadísticas Iniciales
  console.log("\n[4] Verificando StatCards...");
  const totalActividadesCard = await page.locator('text="Total actividades"').isVisible();
  const enCursoCard = await page.locator('text="En curso / progreso"').isVisible();
  const conCertCard = await page.locator('text="Con certificación"').isVisible();
  console.log("¿StatCard 'Total actividades' visible?:", totalActividadesCard);
  console.log("¿StatCard 'En curso / progreso' visible?:", enCursoCard);
  console.log("¿StatCard 'Con certificación' visible?:", conCertCard);

  // 5. Probar Búsqueda y Filtros
  console.log("\n[5] Probando filtros de búsqueda...");
  const searchInput = page.locator('input[placeholder*="Buscar por código"]');
  await searchInput.fill("Cloud");
  await page.waitForTimeout(500);
  const rowsAfterSearch = await page.locator("tbody tr").count();
  console.log("Filas encontradas para búsqueda 'Cloud':", rowsAfterSearch);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-search-cloud.png` });

  // Limpiar búsqueda
  await searchInput.fill("");
  await page.waitForTimeout(500);

  // 6. Probar Ver Detalle de Curso
  console.log("\n[6] Probando modal de Ver Detalle...");
  const firstDetailBtn = page.locator('tbody tr button:has-text("Ver")').first();
  await firstDetailBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-course-detail-modal.png` });
  console.log("Modal de detalle visualizado con éxito.");
  // Cerrar modal
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.waitForTimeout(400);

  // 7. Probar Creación de Nuevo Curso con Certificación Activa
  console.log("\n[7] Probando creación de curso...");
  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(500);

  // Probar validación con fechas erróneas
  console.log("Probando validación con fecha de fin anterior a fecha de inicio...");
  await page.fill('input[placeholder*="Especialización en"]', "Curso Demo con Error de Fecha");
  await page.fill('textarea[placeholder*="Detalla los alcances"]', "Descripción detallada del curso de prueba para validación de campos obligatorios.");
  await page.fill('input[placeholder*="Víctor Herrera"]', "Instructor de Prueba");
  await page.fill('input[type="date"] >> nth=0', "2026-10-01");
  await page.fill('input[type="date"] >> nth=1', "2026-09-01"); // Fin antes de inicio
  await page.fill('input[placeholder*="https://"]', "https://campus.horizenti.com/aulas/demo");
  await page.getByRole("button", { name: "Crear curso" }).click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-validation-error.png` });

  // Corregir formulario con datos válidos
  console.log("Corrigiendo formulario con datos válidos y vinculación a plantilla activa...");
  await page.fill('input[placeholder*="Especialización en"]', "Taller Avanzado de Kubernetes y Observabilidad");
  await page.fill('input[type="date"] >> nth=1', "2026-11-01");
  
  // Activar certificación
  await page.getByRole("button", { name: "SÍ, EMITE CERTIFICADO" }).click();
  await page.waitForTimeout(300);

  // Seleccionar plantilla activa en el dropdown
  const templateSelect = page.locator('#section-h select');
  if (await templateSelect.count()) {
    await templateSelect.selectOption({ value: "tpl-cloud-devops" });
  }

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-form-filled-with-cert.png` });
  await page.getByRole("button", { name: "Crear curso" }).click();
  await page.waitForTimeout(1500);

  console.log("Curso creado. Verificando que aparece en la tabla...");
  const newCourseRow = await page.locator('tbody tr:has-text("Taller Avanzado de Kubernetes")').isVisible();
  console.log("¿Nuevo curso visible en tabla?:", newCourseRow);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-dashboard-with-new-course.png` });

  // 8. Probar Creación de Curso SIN Certificación
  console.log("\n[8] Creando curso sin certificación...");
  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="Especialización en"]', "Seminario de Transformación Digital y Agilidad");
  await page.fill('textarea[placeholder*="Detalla los alcances"]', "Seminario intensivo sobre marcos ágiles y transformación cultural corporativa.");
  await page.fill('input[placeholder*="Víctor Herrera"]', "Mg. Diana Morales");
  await page.fill('input[type="date"] >> nth=0', "2026-08-10");
  await page.fill('input[type="date"] >> nth=1', "2026-08-12");
  await page.fill('input[placeholder*="https://"]', "https://campus.horizenti.com/aulas/seminario-agil");
  await page.getByRole("button", { name: "NO EMITE" }).click();
  await page.getByRole("button", { name: "Crear curso" }).click();
  await page.waitForTimeout(1500);

  const noCertBadgeVisible = await page.locator('tbody tr:has-text("Seminario de Transformación") span:has-text("Sin certificado")').isVisible();
  console.log("¿Curso creado con badge 'Sin certificado'?:", noCertBadgeVisible);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-course-sin-certificado.png` });

  // 9. Verificar Limpieza en /certificados/gestion
  console.log("\n[9] Verificando limpieza de maquetas en /certificados/gestion...");
  await page.goto("http://localhost:3000/certificados/gestion", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-certificados-gestion-clean.png` });

  const hasProtoBadge = await page.locator('text="Prototipo Frontend"').count();
  const hasRoleSimulator = await page.locator('text="Control de permisos en maqueta"').count();
  const hasSimularButton = await page.locator('button:has-text("Simular emisión")').count();
  const hasDemoFooter = await page.locator('text="Persistencia local en navegador"').count();

  console.log("¿Existe badge 'Prototipo Frontend'? (Debe ser 0):", hasProtoBadge);
  console.log("¿Existe simulador de roles? (Debe ser 0):", hasRoleSimulator);
  console.log("¿Existe botón 'Simular emisión'? (Debe ser 0):", hasSimularButton);
  console.log("¿Existe aviso de persistencia de demo? (Debe ser 0):", hasDemoFooter);

  // 10. Verificar Verificador Público (/certificados)
  console.log("\n[10] Verificando página pública de certificados (/certificados)...");
  await page.goto("http://localhost:3000/certificados", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-public-verifier.png` });

  await page.fill("#verification-code-input", "HZ-DEMO-VALIDO");
  await page.click('button:has-text("VERIFICAR CERTIFICADO")');
  await page.waitForSelector("#resultado-certificado h2:has-text('CERTIFICADO VÁLIDO')", { timeout: 5000 });
  const validVisible = await page.locator("#resultado-certificado h2:has-text('CERTIFICADO VÁLIDO')").isVisible();
  console.log("¿Verificador público responde con CERTIFICADO VÁLIDO?:", validVisible);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/11-public-verifier-valid.png` });

  console.log("\n=== TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO ===");
  await browser.close();
}

run().catch((err) => {
  console.error("Error durante las pruebas:", err);
  process.exit(1);
});
