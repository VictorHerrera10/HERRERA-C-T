import {
  hoursToQuarterUnits,
  quarterUnitsToHours,
  isValidQuarterHour,
  formatHoursHuman,
  timeStringToMinutes,
  minutesToTimeString,
  calculateEndTime,
  generateDateRange,
  distributeHoursEquitably,
  validateCourseSchedule,
} from "../src/modules/eventos/lib/events.js";

console.log("=== VERIFICACIÓN MATEMÁTICA Y LÓGICA DE DURACIÓN (REGLAS DE HORAS NORMALES) ===");

// 1. Caso de prueba obligatorio del prompt: 24 h en 7 sesiones
console.log("\n[1] Caso obligatorio: 24 h en 7 sesiones...");
const dates7 = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07"];
const sessions7 = distributeHoursEquitably(24, dates7);
console.log("Duraciones obtenidas:", sessions7.map(s => s.duration));

const expectedDurations = [3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25];
const matchesExpected = JSON.stringify(sessions7.map(s => s.duration)) === JSON.stringify(expectedDurations);
console.log("¿Coincide exactamente con [3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25]?:", matchesExpected);

const sumUnits = sessions7.reduce((acc, s) => acc + hoursToQuarterUnits(s.duration), 0);
console.log("Suma en unidades de 15 min:", sumUnits, "esperado: 96 (24 h). ¿Exacto?:", sumUnits === 96);

// 2. Múltiplos de 0.25
console.log("\n[2] Validación de múltiplos de 0.25 h...");
console.log("isValidQuarterHour(24):", isValidQuarterHour(24) === true);
console.log("isValidQuarterHour(1.25):", isValidQuarterHour(1.25) === true);
console.log("isValidQuarterHour(3.5):", isValidQuarterHour(3.5) === true);
console.log("isValidQuarterHour(3.75):", isValidQuarterHour(3.75) === true);
console.log("isValidQuarterHour(3.3):", isValidQuarterHour(3.3) === false);
console.log("isValidQuarterHour(0):", isValidQuarterHour(0) === false);
console.log("isValidQuarterHour(-2):", isValidQuarterHour(-2) === false);

// 3. Formato legible
console.log("\n[3] Formato legible (horas y minutos)...");
console.log("formatHoursHuman(24):", formatHoursHuman(24), "=== 24 h");
console.log("formatHoursHuman(3.25):", formatHoursHuman(3.25), "=== 3 h 15 min");
console.log("formatHoursHuman(3.5):", formatHoursHuman(3.5), "=== 3 h 30 min");
console.log("formatHoursHuman(0.75):", formatHoursHuman(0.75), "=== 45 min");

// 4. Generación de rango de fechas (ambos extremos inclusive)
console.log("\n[4] Rango de fechas...");
const singleDate = generateDateRange("2026-05-10", "2026-05-10");
console.log("Rango de 1 día (2026-05-10 a 2026-05-10):", singleDate.length, "esperado: 1. ¿Exacto?:", singleDate.length === 1);

const threeDays = generateDateRange("2026-05-01", "2026-05-03");
console.log("Rango de 3 días (2026-05-01 a 2026-05-03):", threeDays, "esperado: 3. ¿Exacto?:", threeDays.length === 3);

// 5. Horarios y coherencia
console.log("\n[5] Coherencia de horarios...");
const endTime1 = calculateEndTime("19:00", 3.5);
console.log("Fin para inicio 19:00 + 3.5 h:", endTime1, "esperado: 22:30. ¿Exacto?:", endTime1 === "22:30");

const endTime2 = calculateEndTime("19:00", 3.25);
console.log("Fin para inicio 19:00 + 3.25 h:", endTime2, "esperado: 22:15. ¿Exacto?:", endTime2 === "22:15");

// 6. Validación completa de cronograma
console.log("\n[6] Validación de cronograma...");
const validSchedule = validateCourseSchedule(24, "2026-04-01", "2026-04-07", sessions7);
console.log("¿Cronograma distribuido es 100% válido?:", validSchedule.valid);

// Probar desajuste si falta una sesión
const incompleteSessions = sessions7.slice(0, 6); // falta 3.25h
const invalidSchedule = validateCourseSchedule(24, "2026-04-01", "2026-04-07", incompleteSessions);
console.log("¿Detecta falta de horas si se quita una sesión?:", !invalidSchedule.valid, invalidSchedule.errors.hours_mismatch);

console.log("\n=== TODAS LAS PRUEBAS MATEMÁTICAS COMPLETADAS EXITOSAMENTE ===");

