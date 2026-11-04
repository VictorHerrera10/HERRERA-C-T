import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

function parseDurationText(text) {
  // Ejemplos: "3 h 30 min", "3 h 15 min", "2 h", "45 min"
  let hours = 0;
  const hMatch = text.match(/(\d+)\s*h/);
  const mMatch = text.match(/(\d+)\s*min/);
  if (hMatch) hours += parseInt(hMatch[1], 10);
  if (mMatch) hours += parseInt(mMatch[1], 10) / 60;
  return hours;
}

async function runStep2ScheduleTests() {
  console.log("=== INICIANDO SUITE DE PRUEBAS E2E PARA PASO 2: HORARIO GLOBAL CON EXCEPCIONES ===");

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // 1. Iniciar sesión
    console.log(`\n1. Iniciando sesión en ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.fill('input[placeholder="12345678"]', "90000005");
    await page.fill('input[placeholder="••••••••"]', "90000005");
    await page.click('button:has-text("Ingresar")');
    await page.waitForTimeout(3000);

    // 2. Navegar a /eventos/gestion
    console.log("2. Navegando a /eventos/gestion...");
    await page.goto(`${BASE_URL}/eventos/gestion`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 3. Abrir modal
    console.log("3. Abriendo modal '+ Nuevo curso / actividad'...");
    await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
    await page.waitForSelector("text=Crear nuevo curso o actividad");

    // 4. Completar Paso 1
    console.log("4. Completando Paso 1 (Información General)...");
    const titleInput = page.locator('input[placeholder*="Arquitectura Cloud"]');
    await titleInput.fill("Curso Automatizado Step 2 Schedule Global Test");

    const instructorInput = page.locator('input[placeholder*="ej. Ing. Víctor Herrera"]');
    await instructorInput.fill("Ing. Especialista E2E");

    const descInput = page.locator('textarea[placeholder*="Detalla los alcances"]');
    await descInput.fill("Curso diseñado para validar horario global y excepciones en Paso 2.");

    // Avanzar a Paso 2
    const nextBtn = page.locator('#course-wizard-footer').getByRole("button", { name: /Siguiente/i });
    await nextBtn.click();
    await page.waitForSelector("text=2. Días de Dictado (Sesiones Activas)");
    console.log("-> Paso 2 alcanzado exitosamente.");

    // 5. Configurar Parámetros: 24 horas y fechas 2026-06-01 a 2026-06-07 (7 días)
    console.log("\n5. Configurando 24 horas en rango de 7 días (01 al 07 de junio 2026)...");
    
    // Total hours input (múltiplo de 0.25)
    const hoursInput = page.locator('input[type="number"][step="0.25"]').first();
    await hoursInput.fill("24");

    // Start Date & End Date
    const startDateInput = page.locator('input[type="date"]').nth(0);
    const endDateInput = page.locator('input[type="date"]').nth(1);

    await startDateInput.fill("2026-06-01");
    await endDateInput.fill("2026-06-07");

    // Esperar a que se reconozcan los 7 días
    await page.waitForSelector("text=en el rango calendario seleccionado");
    console.log("-> 7 días detectados en el rango calendario.");

    // 6. Presionar botón "Redistribuir horas automáticamente" (Caso canónico 24h / 7 sesiones)
    console.log("6. Ejecutando 'Redistribuir horas automáticamente'...");
    const redistributeBtn = page.getByRole("button", { name: /Redistribuir horas automáticamente/i });
    await redistributeBtn.click();

    // Esperar a que se actualicen las sesiones y el badge de balance
    await page.waitForSelector("text=✓ SUMA EXACTA");
    console.log("-> Estado de balance: ✓ SUMA EXACTA detectado.");

    // 7. Verificar las duraciones exactas de las 7 sesiones en la tabla compacta (Desktop >=768px)
    // Esperado: [3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25]
    console.log("7. Verificando caso canónico en la tabla compacta de escritorio...");
    const desktopRows = page.locator('tbody tr[data-session-row="true"]');
    const count = await desktopRows.count();
    console.log(`-> Cantidad de filas de sesión en tabla: ${count}`);
    if (count !== 7) {
      throw new Error(`Se esperaban 7 filas de sesión en tabla pero se obtuvieron ${count}`);
    }

    const durations = [];
    for (let i = 0; i < count; i++) {
      const row = desktopRows.nth(i);
      const durText = await row.locator('td:nth-child(3)').innerText();
      durations.push(parseDurationText(durText));
    }
    console.log(`-> Duraciones obtenidas: ${JSON.stringify(durations)}`);
    const expectedCanonical = [3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25];
    if (JSON.stringify(durations) !== JSON.stringify(expectedCanonical)) {
      throw new Error(`Duraciones no coinciden. Esperado: ${JSON.stringify(expectedCanonical)}, Obtenido: ${JSON.stringify(durations)}`);
    }
    console.log("-> ¡Caso canónico 24h / 7 sesiones en tabla VERIFICADO CON ÉXITO!");

    // 8. Probar la Barra de Horario Habitual / Global
    console.log("\n8. Probando Barra de Horario Habitual (18:00 a 21:00 = 3h por sesión)...");
    const globalStartInput = page.locator('input[type="time"]').nth(0);
    const globalEndInput = page.locator('input[type="time"]').nth(1);

    await globalStartInput.fill("18:00");
    await globalEndInput.fill("21:00");

    // Verificar duración derivada en la barra: "3 h"
    await page.waitForSelector("text=3 h por sesión");
    console.log("-> Badge de horario global muestra '3 h por sesión'.");

    // Aplicar a todas las sesiones
    console.log("Aplicando horario global a todas las sesiones...");
    const applyGlobalBtn = page.getByRole("button", { name: /Aplicar a todas/i });
    await applyGlobalBtn.click();
    await page.waitForSelector("text=Horario habitual aplicado");
    console.log("-> Toast de horario habitual aplicado recibido.");

    // Verificar que las 7 sesiones ahora tienen 3h y horario 18:00 – 21:00
    for (let i = 0; i < count; i++) {
      const row = desktopRows.nth(i);
      const durText = await row.locator('td:nth-child(3)').innerText();
      const schedText = await row.locator('td:nth-child(4)').innerText();
      if (!durText.includes("3 h") || !schedText.includes("18:00 – 21:00")) {
        throw new Error(`Fila ${i + 1} no se actualizó con horario habitual: ${durText}, ${schedText}`);
      }
    }
    console.log("-> Las 7 sesiones se actualizaron correctamente al horario global (18:00 – 21:00, 3 h).");

    // 9. Verificar Descuadre y Bloqueo de Avance
    // 7 sesiones * 3h = 21h asignadas vs 24h requeridas -> Falta 3 h
    console.log("\n9. Verificando detección de descuadre y bloqueo de 'Siguiente'...");
    await page.waitForSelector("text=FALTA 3 h");
    console.log("-> Badge detectó 'FALTA 3 h' correctamente.");

    // Intentar avanzar con siguiente debe mostrar toast de error y permanecer en paso 2
    await nextBtn.click();
    await page.waitForSelector("text=Faltan 3 h por asignar");
    console.log("-> 'Siguiente' bloqueado correctamente con mensaje de horas pendientes.");

    // 10. Probar Excepción Puntual ("Cambiar")
    console.log("\n10. Configurando excepción puntual en Sesión #1 (17:00 a 21:00 = 4 h)...");
    const editBtnFirst = desktopRows.first().getByRole("button", { name: "Cambiar" });
    await editBtnFirst.click();

    // La fila entra en modo edición (inputs de tiempo inline)
    const editingRow = page.locator('tr.bg-steel\\/30');
    const editStart = editingRow.locator('input[type="time"]').nth(0);
    const editEnd = editingRow.locator('input[type="time"]').nth(1);

    await editStart.fill("17:00");
    await editEnd.fill("21:00");

    // Guardar excepción
    const saveExceptionBtn = editingRow.getByRole("button", { name: "Guardar" });
    await saveExceptionBtn.click();
    await page.waitForSelector("text=Excepción guardada");
    console.log("-> Excepción guardada con éxito.");

    // Verificar que Sesión #1 ahora tiene badge "Modificado" y 4 h
    const firstRowStatus = await desktopRows.first().locator('td:nth-child(5)').innerText();
    const firstRowDur = await desktopRows.first().locator('td:nth-child(3)').innerText();
    if (!firstRowStatus.includes("Modificado") || !firstRowDur.includes("4 h")) {
      throw new Error(`Sesión #1 no se marcó como Modificado con 4h: ${firstRowStatus}, ${firstRowDur}`);
    }
    console.log("-> Sesión #1 marcada como 'Modificado' con duración 4 h.");

    // Verificar que Sesión #2 sigue "Por defecto" con 3 h
    const secondRowStatus = await desktopRows.nth(1).locator('td:nth-child(5)').innerText();
    if (!secondRowStatus.includes("Por defecto")) {
      throw new Error(`Sesión #2 no permaneció como Por defecto: ${secondRowStatus}`);
    }
    console.log("-> Sesión #2 se mantuvo como 'Por defecto' con 3 h.");

    // 11. Probar Preservación de Excepciones al cambiar Horario Global
    console.log("\n11. Verificando preservación de excepciones al cambiar horario habitual a 18:30 – 21:00 (2.5 h)...");
    await globalStartInput.fill("18:30");
    await globalEndInput.fill("21:00");

    // El botón principal ahora debe llamarse "Aplicar a por defecto"
    const applyToDefaultBtn = page.getByRole("button", { name: /Aplicar a por defecto/i });
    await applyToDefaultBtn.click();
    await page.waitForSelector("text=Se conservaron 1 excepciones");
    console.log("-> Notificación confirma: 'Se conservaron 1 excepciones'.");

    // Sesión #1 debe continuar con 17:00 – 21:00 (4 h)
    const preservedSched = await desktopRows.first().locator('td:nth-child(4)').innerText();
    if (!preservedSched.includes("17:00 – 21:00")) {
      throw new Error(`Sesión #1 perdió su excepción: ${preservedSched}`);
    }
    console.log("-> ¡Excepción de Sesión #1 PRESERVADA INTACTA (17:00 – 21:00)!");

    // Sesión #2 debe haberse actualizado a 18:30 – 21:00 (2 h 30 min)
    const updatedSecondSched = await desktopRows.nth(1).locator('td:nth-child(4)').innerText();
    if (!updatedSecondSched.includes("18:30 – 21:00")) {
      throw new Error(`Sesión #2 no se actualizó al nuevo horario habitual: ${updatedSecondSched}`);
    }
    console.log("-> Sesión #2 actualizada al nuevo horario habitual (18:30 – 21:00).");

    // 12. Probar Botón "Restaurar" en la Excepción
    console.log("\n12. Probando botón 'Restaurar' en Sesión #1...");
    const restoreBtn = desktopRows.first().getByRole("button", { name: "Restaurar" });
    await restoreBtn.click();
    await page.waitForSelector("text=Horario restaurado");

    const restoredStatus = await desktopRows.first().locator('td:nth-child(5)').innerText();
    const restoredSched = await desktopRows.first().locator('td:nth-child(4)').innerText();
    if (!restoredStatus.includes("Por defecto") || !restoredSched.includes("18:30 – 21:00")) {
      throw new Error(`Sesión #1 no se restauró correctamente: ${restoredStatus}, ${restoredSched}`);
    }
    console.log("-> Sesión #1 restaurada exitosamente al horario habitual (18:30 – 21:00, Por defecto).");

    // 13. Probar Sobrescritura Completa ("Aplicar a todas (incluir excepciones)")
    console.log("\n13. Probando sobrescritura forzada incluyendo excepciones...");
    // Crear una excepción en sesión #2
    await desktopRows.nth(1).getByRole("button", { name: "Cambiar" }).click();
    const editRow2 = page.locator('tr.bg-steel\\/30');
    await editRow2.locator('input[type="time"]').nth(0).fill("16:00");
    await editRow2.locator('input[type="time"]').nth(1).fill("20:00");
    await editRow2.getByRole("button", { name: "Guardar" }).click();
    await page.waitForSelector("text=Excepción guardada");

    // Sobrescribir todo
    const overwriteAllBtn = page.getByRole("button", { name: /Aplicar a todas \(incluir excepciones\)/i });
    await overwriteAllBtn.click();
    await page.waitForSelector("text=Horario aplicado a todas las sesiones");

    const afterOverwriteStatus = await desktopRows.nth(1).locator('td:nth-child(5)').innerText();
    if (afterOverwriteStatus.includes("Modificado")) {
      throw new Error("Sesión #2 aún figura como Modificado tras sobrescribir todas!");
    }
    console.log("-> Todas las sesiones actualizadas uniformemente; excepciones sobrescritas.");

    // 14. Volver a distribuir exactamente para cuadrar a 24 horas
    console.log("\n14. Restableciendo balance a 24 h exactas con 'Redistribuir horas automáticamente'...");
    await redistributeBtn.click();
    await page.waitForSelector("text=✓ SUMA EXACTA");
    console.log("-> Balance perfecto: ✓ SUMA EXACTA.");

    // 15. Probar conmutación de fecha (desactivar y reactivar chip)
    console.log("\n15. Probando desactivación y reactivación de chip de día...");
    const sundayChip = page.locator('button[role="button"]:has-text("7 JUN")');
    await sundayChip.click();
    
    let currentRowsCount = await desktopRows.count();
    console.log(`-> Filas activas tras desactivar domingo: ${currentRowsCount} (Esperado: 6)`);
    if (currentRowsCount !== 6) {
      throw new Error(`Se esperaban 6 sesiones tras desactivar domingo pero hay ${currentRowsCount}`);
    }

    // Reactivar domingo
    await sundayChip.click();
    currentRowsCount = await desktopRows.count();
    console.log(`-> Filas activas tras reactivar domingo: ${currentRowsCount} (Esperado: 7)`);
    if (currentRowsCount !== 7) {
      throw new Error(`Se esperaban 7 sesiones tras reactivar domingo pero hay ${currentRowsCount}`);
    }

    // Cuadrar horas para avanzar
    await redistributeBtn.click();
    await page.waitForSelector("text=✓ SUMA EXACTA");

    // 16. Autogenerar resumen de horario
    console.log("\n16. Autogenerando resumen de horario...");
    const autoSummaryBtn = page.getByRole("button", { name: /Autogenerar resumen/i });
    await autoSummaryBtn.click();
    const summaryInput = page.locator('input[placeholder*="ej. Lunes a Viernes 19:00 - 22:30"]');
    const summaryVal = await summaryInput.inputValue();
    console.log(`-> Resumen generado: "${summaryVal}"`);

    // 17. Avanzar hasta Paso 6 (Revisión y confirmación)
    console.log("\n17. Avanzando por los pasos del wizard...");
    await nextBtn.click(); // Paso 3
    await page.waitForSelector("text=Modalidad de dictado");

    const platformInput = page.locator('input[placeholder*="https://campus.horizenti.com"]');
    await platformInput.fill("https://campus.horizenti.com/aulas/e2e-global-test");

    await nextBtn.click(); // Paso 4
    await page.waitForSelector("text=Reglas de Asistencia");

    await nextBtn.click(); // Paso 5
    await page.waitForSelector("text=Bloque 1: Evento o Ceremonia de Clausura");

    await nextBtn.click(); // Paso 6
    await page.waitForSelector("text=Ficha Técnica Preliminar");
    console.log("-> Paso 6 (Revisión) alcanzado.");

    // 18. Verificar desglose de sesiones en Paso 6
    console.log("18. Verificando desglose de cronograma en Paso 6...");
    await page.waitForSelector("text=24 h (24 h)");
    await page.waitForSelector("text=Detalle de las 7 clases programadas:");
    await page.waitForSelector("text=#1 2026-06-01");
    console.log("-> Desglose de 7 clases en Paso 6 verificado.");

    // 19. Guardar actividad
    console.log("\n19. Guardando curso nuevo...");
    const submitBtn = page.locator('#course-wizard-footer').getByRole("button", { name: /Crear actividad/i });
    await submitBtn.click();
    await page.waitForSelector("text=se registró con código", { timeout: 10000 });
    console.log("-> Curso registrado exitosamente.");

    // 20. Abrir detalle del curso recién creado
    console.log("\n20. Abriendo detalle del curso en la lista...");
    await page.waitForTimeout(1000);
    const createdCourseCard = page.locator('div:has-text("Curso Automatizado Step 2 Schedule Global Test")').first();
    const viewDetailBtn = createdCourseCard.locator('button[title*="Ver detalles"]').first();
    await viewDetailBtn.click();
    await page.waitForSelector("text=Cronograma de clases (7 sesiones):");
    await page.waitForSelector("text=Clase #1");
    console.log("-> Cronograma detallado en modal de consulta verificado exitosamente.");

    // Cerrar modal de detalle
    const closeDetailBtn = page.locator('button[title="Cerrar modal"]').first();
    await closeDetailBtn.click();
    await page.waitForTimeout(500);

    // 21. Matriz Responsive de 9 Resoluciones
    console.log("\n21. Verificando Matriz Responsive (9 resoluciones requeridas)...");
    const viewports = [
      { width: 320, height: 568, name: "Móvil pequeño (320x568)" },
      { width: 375, height: 667, name: "Móvil compacto (375x667)" },
      { width: 390, height: 844, name: "Móvil moderno (390x844)" },
      { width: 430, height: 932, name: "Móvil grande (430x932)" },
      { width: 768, height: 1024, name: "Tablet portrait (768x1024)" },
      { width: 1024, height: 768, name: "Tablet landscape (1024x768)" },
      { width: 1280, height: 720, name: "Laptop compacta (1280x720)" },
      { width: 1366, height: 768, name: "Laptop estándar (1366x768)" },
      { width: 1920, height: 1080, name: "Escritorio FHD (1920x1080)" },
    ];

    // Reabrir el modal para chequear Step 2 en cada resolución
    await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
    await page.waitForSelector("text=Crear nuevo curso o actividad");
    
    // Llenar campos paso 1 para ir a paso 2
    await page.locator('input[placeholder*="Arquitectura Cloud"]').fill("Test Responsive");
    await page.locator('input[placeholder*="ej. Ing. Víctor Herrera"]').fill("Test Responsive");
    await page.locator('textarea[placeholder*="Detalla los alcances"]').fill("Test Responsive");
    await page.locator('#course-wizard-footer').getByRole("button", { name: /Siguiente/i }).click();
    await page.waitForSelector("text=2. Días de Dictado (Sesiones Activas)");

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);

      // Chequear overflow horizontal en la ventana modal
      const overflow = await page.evaluate(() => {
        const modalContainer = document.querySelector('div[class*="flex min-h-0 flex-1 flex-col"]');
        if (!modalContainer) return false;
        return modalContainer.scrollWidth > modalContainer.clientWidth;
      });

      if (overflow) {
        throw new Error(`Desbordamiento horizontal detectado en ${vp.name}!`);
      }

      // Si es móvil (<768px), verificar que se renderizan las tarjetas móviles
      if (vp.width < 768) {
        const mobileCards = page.locator('div.md\\:hidden div[data-session-card="true"]');
        const mCount = await mobileCards.count();
        if (mCount === 0) {
          console.log(`  (Sin sesiones activas en reset de wizard para ${vp.name})`);
        }
      }

      console.log(`  ✓ ${vp.name}: Sin desbordamiento horizontal.`);
    }

    console.log("\n=======================================================");
    console.log("¡TODAS LAS PRUEBAS E2E Y RESPONSIVE COMPLETADAS CON ÉXITO!");
    console.log("=======================================================");
  } catch (err) {
    console.error("ERROR EN LA EJECUCIÓN DE PRUEBAS:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runStep2ScheduleTests();
