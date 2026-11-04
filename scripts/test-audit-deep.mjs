import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

async function runAuditDeep() {
  console.log("=== INICIANDO AUDITORÍA PROFUNDA Y EXHAUSTIVA DE PASO 2 ===");

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => {
    console.error(" [PAGE ERROR DETECTADO]:", err.message);
    pageErrors.push(err.message);
  });

  try {
    // 1. Iniciar sesión
    console.log(`\n[Auditoría 1] Iniciando sesión en ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[placeholder="12345678"]', "90000005");
    await page.fill('input[placeholder="••••••••"]', "90000005");
    await page.click('button:has-text("Ingresar")');
    await page.waitForTimeout(3000);

    // 2. Navegar a /eventos/gestion
    console.log("[Auditoría 2] Navegando a /eventos/gestion...");
    await page.goto(`${BASE_URL}/eventos/gestion`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 3. COMPATIBILIDAD CON CURSOS ANTIGUOS (sin `sessions`)
    console.log("\n[Auditoría 3] Verificando compatibilidad con registros antiguos preexistentes...");
    // Buscar la tarjeta de un curso inicial, ej. CRS-2026-001 (Arquitectura Cloud Nativa)
    const oldCourseCard = page.locator('div:has-text("CRS-2026-001")').first();
    await oldCourseCard.waitFor({ state: "visible", timeout: 5000 });
    console.log("-> Curso antiguo CRS-2026-001 localizado en la lista.");

    // Abrir detalle del curso antiguo
    const viewDetailOldBtn = oldCourseCard.locator('button[title*="Ver detalles"]').first();
    await viewDetailOldBtn.click();
    await page.waitForSelector("text=Calendario de ejecución");
    console.log("-> Modal de detalle para curso antiguo abierto SIN errores.");
    // Cerrar detalle
    await page.locator('button[title="Cerrar modal"]').first().click();
    await page.waitForTimeout(500);

    // Abrir modal de edición del curso antiguo
    console.log("-> Abriendo modal de edición para curso antiguo CRS-2026-001...");
    const editOldBtn = oldCourseCard.locator('button[title*="Editar curso"]').first();
    await editOldBtn.click();
    await page.waitForSelector("text=Editar curso o actividad");
    console.log("-> Modal de edición abierto correctamente.");

    // Navegar al Paso 2 en el curso antiguo
    const nextBtn = page.locator('#course-wizard-footer').getByRole("button", { name: /Siguiente/i });
    await nextBtn.click();
    await page.waitForSelector("text=2. Días de Dictado (Sesiones Activas)");
    console.log("-> Paso 2 en curso antiguo abierto e inicializado sin excepciones.");

    // Cerrar modal de edición
    await page.locator('#course-wizard-footer').getByRole("button", { name: /Cancelar/i }).click();
    await page.waitForTimeout(500);

    // 4. VALIDACIÓN DE BLOQUEOS ESTRICTOS EN PASO 2
    console.log("\n[Auditoría 4] Verificando rechazo y bloqueos estrictos en Paso 2...");
    // Abrir modal de nueva actividad
    await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
    await page.waitForSelector("text=Crear nuevo curso o actividad");

    // Llenar Paso 1
    await page.locator('input[placeholder*="Arquitectura Cloud"]').fill("Curso de Auditoría Estricta");
    await page.locator('input[placeholder*="ej. Ing. Víctor Herrera"]').fill("Auditor QA");
    await page.locator('textarea[placeholder*="Detalla los alcances"]').fill("Descripción de auditoría técnica.");
    await nextBtn.click();
    await page.waitForSelector("text=2. Días de Dictado (Sesiones Activas)");

    // Test 4.1: Valor no múltiplo de 0.25 (ej. 24.33)
    console.log("-> Test 4.1: Probando duración total inválida (24.33 h)...");
    const hoursInput = page.locator('input[type="number"][step="0.25"]').first();
    await hoursInput.fill("24.33");
    
    // Verificar que aparece el mensaje de error inline
    await page.waitForSelector("text=Debe ser múltiplo de 0.25 h (15 min)");
    console.log("   ✓ Mensaje inline de validación detectado: 'Debe ser múltiplo de 0.25 h'.");

    // Intentar avanzar con 24.33 h -> Debe ser BLOQUEADO
    await nextBtn.click();
    // Confirmar que seguimos en Paso 2 (no avanzó)
    const stillOnStep2 = await page.locator("text=2. Días de Dictado (Sesiones Activas)").isVisible();
    if (!stillOnStep2) {
      throw new Error("ERROR DE SEGURIDAD: Se permitió avanzar con una duración que no es múltiplo de 0.25!");
    }
    console.log("   ✓ Avance BLOQUEADO con éxito ante duración inválida.");

    // Corregir a 24h y poner fechas
    await hoursInput.fill("24");
    const startDateInput = page.locator('input[type="date"]').nth(0);
    const endDateInput = page.locator('input[type="date"]').nth(1);
    await startDateInput.fill("2026-06-01");
    await endDateInput.fill("2026-06-07");
    await page.waitForSelector("text=en el rango calendario seleccionado");

    // Test 4.2: Intentar avanzar sin fechas activas (0 sesiones)
    console.log("-> Test 4.2: Probando intento de avance con 0 sesiones activas...");
    const clearDatesBtn = page.getByRole("button", { name: "Desmarcar" });
    await clearDatesBtn.click();
    await page.waitForSelector("text=No hay sesiones activas en este momento");

    await nextBtn.click();
    const stillOnStep2NoSessions = await page.locator("text=2. Días de Dictado (Sesiones Activas)").isVisible();
    if (!stillOnStep2NoSessions) {
      throw new Error("ERROR DE SEGURIDAD: Se permitió avanzar sin ninguna sesión activa!");
    }
    console.log("   ✓ Avance BLOQUEADO con éxito ante 0 sesiones activas.");

    // Test 4.3: Intentar avanzar con descuadre de horas (ej. faltan horas)
    console.log("-> Test 4.3: Probando intento de avance con descuadre de balance...");
    // Activar solo un día (2 horas por defecto) para un total de 24 horas requeridas
    const mondayChip = page.locator('button[role="button"]:has-text("1 JUN")');
    await mondayChip.click();
    await page.waitForSelector("text=FALTA 22 h");
    console.log("   ✓ Descuadre detectado: 'FALTA 22 h'.");

    await nextBtn.click();
    const stillOnStep2Mismatch = await page.locator("text=2. Días de Dictado (Sesiones Activas)").isVisible();
    if (!stillOnStep2Mismatch) {
      throw new Error("ERROR DE SEGURIDAD: Se permitió avanzar con descuadre de horas!");
    }
    console.log("   ✓ Avance BLOQUEADO con éxito ante descuadre de balance.");

    // Test 4.4: Redistribución automática y confirmación de que la edición manual no altera las demás
    console.log("-> Test 4.4: Verificando independencia de edición manual (sin efectos colaterales)...");
    const selectAllBtn = page.getByRole("button", { name: /Todos/i });
    await selectAllBtn.click();
    const redistributeBtn = page.getByRole("button", { name: /Redistribuir horas automáticamente/i });
    await redistributeBtn.click();
    await page.waitForSelector("text=✓ SUMA EXACTA");

    const desktopRows = page.locator('tbody tr[data-session-row="true"]');
    const initialSession2Dur = await desktopRows.nth(1).locator('td:nth-child(3)').innerText();

    // Modificar sesión 1 con botón "Cambiar" (excepción puntual: 18:00 a 22:00 = 4h)
    await desktopRows.first().getByRole("button", { name: "Cambiar" }).click();
    const editingRow = page.locator('tr.bg-steel\\/30');
    await editingRow.locator('input[type="time"]').nth(0).fill("18:00");
    await editingRow.locator('input[type="time"]').nth(1).fill("22:00");
    await editingRow.getByRole("button", { name: "Guardar" }).click();
    await page.waitForSelector("text=Excepción guardada");

    // Verificar que sesión 2 permanece inalterada
    const currentSession2Dur = await desktopRows.nth(1).locator('td:nth-child(3)').innerText();
    if (initialSession2Dur !== currentSession2Dur) {
      throw new Error(`ERROR: Modificar la sesión 1 alteró la sesión 2 (${initialSession2Dur} -> ${currentSession2Dur})`);
    }
    console.log(`   ✓ Independencia garantizada: Sesión 2 mantuvo ${currentSession2Dur} al editar Sesión 1.`);

    // Test 4.5: Intento de avance con horario que descuadra el balance
    console.log("-> Test 4.5: Probando intento de avance con descuadre generado por la excepción...");
    await nextBtn.click();
    const stillOnStep2Incoherent = await page.locator("text=2. Días de Dictado (Sesiones Activas)").isVisible();
    if (!stillOnStep2Incoherent) {
      throw new Error("ERROR DE SEGURIDAD: Se permitió avanzar con descuadre de balance!");
    }
    console.log("   ✓ Avance BLOQUEADO con éxito ante balance descuadrado.");

    // Restaurar sesión 1 con botón "Restaurar" y redistribuir para cuadrar
    await desktopRows.first().getByRole("button", { name: "Restaurar" }).click();
    await page.waitForSelector("text=Horario restaurado");
    await redistributeBtn.click();
    await page.waitForSelector("text=✓ SUMA EXACTA");
    await page.waitForTimeout(300);

    await nextBtn.click();
    await page.waitForSelector("text=Modalidad de dictado");
    console.log("   ✓ Avance PERMITIDO únicamente cuando todos los criterios son 100% conformes.");

    // Cerrar modal
    await page.locator('#course-wizard-footer').getByRole("button", { name: /Cancelar/i }).click();

    // 5. RESUMEN DE EXCEPCIONES EN CONSOLA
    if (pageErrors.length > 0) {
      throw new Error(`Se detectaron ${pageErrors.length} errores de JavaScript en la página: ${pageErrors.join(", ")}`);
    }
    console.log("\n[Auditoría 5] Cero errores de JavaScript detectados durante toda la interacción.");

    console.log("\n=================================================================");
    console.log("¡AUDITORÍA PROFUNDA Y EXHAUSTIVA DE PASO 2: 100% APROBADA!");
    console.log("=================================================================");
  } catch (err) {
    console.error("\n❌ AUDITORÍA FALLIDA:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAuditDeep();
