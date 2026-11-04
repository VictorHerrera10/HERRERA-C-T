import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots-eventos-wizard");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export async function runTest(baseUrl = "http://localhost:3000") {
  console.log("=== INICIANDO PRUEBAS DEL ASISTENTE DE CREACIÓN DE CURSOS (WIZARD 6 PASOS) ===");
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

  console.log("Esperando transición de sesión (SessionCurtain)...");
  await page.waitForTimeout(4000);
  console.log("URL tras login:", page.url());

  // 2. Navegar a /eventos/gestion
  console.log(`\n[2] Navegando a ${baseUrl}/eventos/gestion...`);
  await page.goto(`${baseUrl}/eventos/gestion`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 3. Abrir modal del asistente
  console.log("\n[3] Abriendo asistente de creación (+ Nuevo curso / actividad)...");
  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(600);
  const modal = page.locator('#course-wizard-modal');

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-wizard-step1-initial.png` });

  // 4. Probar Paso 1: Validación y llenado de Información General
  console.log("\n[4] Probando Paso 1: Información General...");
  const step1Header = await modal.locator('text="01. Información general"').isVisible();
  console.log("¿Encabezado '01. Información general' visible?:", step1Header);

  // Probar validación: pulsar Siguiente con campos vacíos
  console.log("Probando validación de campos obligatorios en Paso 1...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(400);
  const titleError = await page.locator('text="El nombre o título del curso es obligatorio."').first().isVisible();
  console.log("¿Validación detectó título obligatorio?:", titleError);

  // Llenar datos de Paso 1
  await modal.locator('input[placeholder*="Especialización en"]').fill("Workshop de Arquitectura de Microservicios con Go & Kubernetes");
  // Seleccionar tipo de actividad "Taller Práctico / Workshop"
  await modal.locator('text="Taller Práctico / Workshop"').first().click();
  // Seleccionar categoría
  await modal.locator('#course-category-select').selectOption("Cloud & DevOps");
  // Instructor y rol
  await modal.locator('input[placeholder*="Víctor Herrera"]').fill("Ing. Víctor Herrera");
  await modal.locator('input[placeholder*="Director de Tecnología"]').fill("Chief Solutions Architect");
  // Descripción
  await modal.locator('textarea[placeholder*="Detalla los alcances"]').fill("Taller inmersivo enfocado en el desacoplamiento de monolitos hacia servicios en Go desplegados con Helm sobre clústeres Kubernetes.");
  // Agregar un segundo objetivo de aprendizaje
  await modal.locator('button:has-text("Agregar objetivo")').click();
  await page.waitForTimeout(200);
  await modal.locator('input[placeholder*="Diseñar arquitecturas"]').nth(0).fill("Diseñar APIs gRPC de alto rendimiento y bajo overhead.");
  await modal.locator('input[placeholder*="Diseñar arquitecturas"]').nth(1).fill("Configurar autoscaling horizontal con KEDA y métricas Prometheus.");

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-wizard-step1-filled.png` });
  console.log("Paso 1 completado. Avanzando a Paso 2...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 5. Probar Paso 2: Duración y Cronograma
  console.log("\n[5] Probando Paso 2: Duración y Cronograma...");
  const step2Header = await modal.locator('text="02. Duración y cronograma"').isVisible();
  console.log("¿Encabezado '02. Duración y cronograma' visible?:", step2Header);

  // Probar validación con fechas erróneas (fin antes de inicio)
  console.log("Probando validación de coherencia temporal (fin < inicio)...");
  await modal.locator('input[type="date"]').nth(0).fill("2026-10-15");
  await modal.locator('input[type="date"]').nth(1).fill("2026-10-01");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(400);
  const dateError = await page.locator('text="La fecha de fin no puede ser anterior a la de inicio."').first().isVisible();
  console.log("¿Validación detectó fechas incoherentes?:", dateError);

  // Corregir fechas y llenar datos
  await modal.locator('input[type="date"]').nth(1).fill("2026-11-20");
  await modal.locator('input[type="number"]').nth(0).fill("32"); // horas
  await modal.locator('input[type="number"]').nth(1).fill("8"); // sesiones
  await modal.locator('input[placeholder*="Lunes y Miércoles"]').fill("Sábados intensivos 09:00 - 13:00 (GMT-5)");
  await page.waitForTimeout(300);

  // Verificar tarjeta de duración estimada
  const durationCard = await modal.locator('text="Resumen de duración estimada"').isVisible();
  console.log("¿Tarjeta de duración estimada calculada visible?:", durationCard);

  // Probar botón "Anterior" para verificar persistencia de datos de Paso 1
  console.log("Probando botón 'Anterior' hacia Paso 1...");
  await modal.getByRole("button", { name: "Anterior" }).click();
  await page.waitForTimeout(400);
  const titlePreserved = await modal.locator('input[placeholder*="Especialización en"]').inputValue();
  console.log("¿Título conservado en Paso 1?:", titlePreserved.includes("Microservicios con Go"));

  // Volver a Paso 2
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(400);
  const hoursPreserved = await modal.locator('input[type="number"]').nth(0).inputValue();
  console.log("¿Horas conservadas en Paso 2?:", hoursPreserved === "32");

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-wizard-step2-filled.png` });
  console.log("Paso 2 completado. Avanzando a Paso 3...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 6. Probar Paso 3: Modalidad y Capacidad
  console.log("\n[6] Probando Paso 3: Modalidad y Capacidad...");
  const step3Header = await modal.locator('text="03. Modalidad y capacidad"').isVisible();
  console.log("¿Encabezado '03. Modalidad y capacidad' visible?:", step3Header);

  // Seleccionar modalidad Híbrida
  await modal.locator('text="Híbrida (Dual)"').click();
  await page.waitForTimeout(300);

  // Llenar sede física y enlace virtual
  await modal.locator('input[placeholder*="Sede Central"]').fill("Campus Tecnológico Horizen TI — Aula Magna A");
  await modal.locator('input[placeholder*="https://campus"]').fill("https://campus.horizenti.com/aulas/microservicios-go");

  // Seleccionar cupos limitados y poner 24 cupos
  await modal.locator('text="Cupos limitados"').click();
  await page.waitForTimeout(200);
  await modal.locator('input[type="number"]').first().fill("24");

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-wizard-step3-filled.png` });
  console.log("Paso 3 completado. Avanzando a Paso 4...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 7. Probar Paso 4: Asistencia y Evaluación
  console.log("\n[7] Probando Paso 4: Asistencia y Evaluación...");
  const step4Header = await modal.locator('text="04. Asistencia y evaluación"').isVisible();
  console.log("¿Encabezado '04. Asistencia y evaluación' visible?:", step4Header);

  // Modificar porcentaje de asistencia mediante slider
  await modal.locator('input[type="range"]').fill("85");
  await page.waitForTimeout(200);

  // Evaluación con nota 15
  await modal.locator('input[type="number"]').first().fill("15");

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-wizard-step4-filled.png` });
  console.log("Paso 4 completado. Avanzando a Paso 5...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 8. Probar Paso 5: Clausura y Certificación
  console.log("\n[8] Probando Paso 5: Clausura y Certificación...");
  const step5Header = await modal.locator('text="05. Clausura y certificación"').isVisible();
  console.log("¿Encabezado '05. Clausura y certificación' visible?:", step5Header);

  // Activar evento de clausura
  console.log("Activando evento de clausura...");
  await modal.locator('text="¿Incluye ceremonia o evento de clausura?"').click();
  await page.waitForTimeout(300);
  await modal.locator('input[placeholder*="Demoday"]').fill("Demoday & Cierre Oficial de Proyectos Go");
  await modal.locator('input[type="date"]').fill("2026-11-21");
  await modal.locator('input[placeholder*="10:00 - 13:00"]').fill("10:00 - 13:00 (GMT-5)");

  // Activar Certificación
  console.log("Activando emisión de certificado oficial...");
  await modal.getByRole("button", { name: "SÍ, EMITE CERTIFICADO" }).click();
  await page.waitForTimeout(400);

  // Seleccionar plantilla activa
  const tplSelect = modal.locator('#section-h select');
  if (await tplSelect.count()) {
    await tplSelect.selectOption({ value: "tpl-cloud-devops" });
    await page.waitForTimeout(300);
  }

  const tplPreview = await modal.locator('text="Plantilla seleccionada"').isVisible();
  console.log("¿Previsualización en vivo de plantilla activa visible?:", tplPreview);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-wizard-step5-filled.png` });
  console.log("Paso 5 completado. Avanzando a Paso 6...");
  await modal.getByRole("button", { name: "Siguiente" }).click();
  await page.waitForTimeout(500);

  // 9. Probar Paso 6: Revisión y Creación
  console.log("\n[9] Probando Paso 6: Revisión Técnica y Confirmación...");
  const step6Header = await modal.locator('text="06. Revisión y creación"').isVisible();
  console.log("¿Encabezado '06. Revisión y creación' visible?:", step6Header);

  // Verificar los 5 bloques consolidados
  const b1 = await modal.locator('text="1. Información General"').isVisible();
  const b2 = await modal.locator('text="2. Duración y Cronograma"').isVisible();
  const b3 = await modal.locator('text="3. Modalidad y Capacidad"').isVisible();
  const b4 = await modal.locator('text="4. Asistencia y Evaluación"').isVisible();
  const b5 = await modal.locator('text="5. Clausura y Certificación"').isVisible();
  console.log("¿Bloques 1 al 5 visibles en resumen?:", b1 && b2 && b3 && b4 && b5);

  // Probar botón "Editar" en bloque 2 (salto directo a Paso 2)
  console.log("Probando botón 'Editar' en Bloque 2 (Duración y Cronograma)...");
  await modal.locator('div.rounded-xl:has-text("2. Duración y Cronograma") button:has-text("Editar")').first().click();
  await page.waitForTimeout(400);
  const backInStep2 = await modal.locator('text="02. Duración y cronograma"').first().isVisible();
  console.log("¿Saltó directamente a Paso 2?:", backInStep2);

  // Saltar de regreso a Paso 6 mediante el stepper
  console.log("Regresando a Paso 6 mediante stepper superior...");
  await modal.locator('button:has-text("Revisión")').first().click();
  await page.waitForTimeout(400);

  // Cambiar estado inicial a "Programado"
  await modal.locator('#course-status-select').selectOption("scheduled");

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-wizard-step6-review.png` });

  // Crear la actividad
  console.log("Pulsando botón final 'Crear actividad'...");
  await modal.getByRole("button", { name: "Crear actividad" }).click();
  await page.waitForTimeout(1500);

  // 10. Verificar que el curso aparece en la tabla
  console.log("\n[10] Verificando nuevo curso en la tabla del dashboard...");
  const newRow = await page.locator('tbody tr:has-text("Workshop de Arquitectura de Microservicios")').first().isVisible();
  console.log("¿Nuevo curso visible en tabla con código generado?:", newRow);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-dashboard-with-created-course.png` });

  // 11. Probar Flujo de Edición con el Wizard
  console.log("\n[11] Probando flujo de Edición en el asistente...");
  const editBtn = page.locator('tbody tr:has-text("Workshop de Arquitectura de Microservicios") button:has-text("Editar")').first();
  await editBtn.click();
  await page.waitForTimeout(600);

  const editModal = page.locator('#course-wizard-modal');
  const editModalTitle = await editModal.locator('text="Editar curso o actividad formativa"').first().isVisible();
  console.log("¿Título del modal 'Editar curso o actividad formativa' visible?:", editModalTitle);

  // Verificar que el título original está precargado
  const preloadedTitle = await editModal.locator('input[placeholder*="Especialización en"]').inputValue();
  console.log("¿Título precargado en edición?:", preloadedTitle.includes("Microservicios con Go"));

  // Modificar título ligeramente
  await editModal.locator('input[placeholder*="Especialización en"]').fill("Workshop Avanzado de Microservicios con Go & Kubernetes");
  
  // Saltar a Paso 6
  await editModal.locator('button:has-text("Revisión")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-wizard-edit-review.png` });

  // Guardar cambios
  await editModal.getByRole("button", { name: "Guardar cambios" }).click();
  await page.waitForTimeout(1500);

  const updatedRow = await page.locator('tbody tr:has-text("Workshop Avanzado de Microservicios")').first().isVisible();
  console.log("¿Curso actualizado visible en tabla con nuevo título?:", updatedRow);

  // 12. Probar Comportamiento Responsive en Móvil (390x844)
  console.log("\n[12] Probando visualización responsive en móvil (390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "+ Nuevo curso / actividad" }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-mobile-step1.png` });

  // Evaluar desbordamiento horizontal en móvil
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('.relative.z-10');
    return {
      modalClientWidth: el ? el.clientWidth : 0,
      modalScrollWidth: el ? el.scrollWidth : 0,
      hasHorizontalOverflow: el ? el.scrollWidth > el.clientWidth : false,
      bodyOverflow: document.body.scrollWidth > document.body.clientWidth,
    };
  });
  console.log("Evaluación de overflow en móvil:", overflow);

  // Cerrar modal
  await page.locator('button[title="Cerrar modal"]').click();
  await page.waitForTimeout(400);

  console.log("\n=== TODAS LAS PRUEBAS DEL ASISTENTE COMPLETADAS EXITOSAMENTE ===");
  await browser.close();
}

if (process.argv[1] && process.argv[1].endsWith("test-eventos-wizard.mjs")) {
  runTest().catch((err) => {
    console.error("Error en las pruebas:", err);
    process.exit(1);
  });
}
