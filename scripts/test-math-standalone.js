// Prueba unitaria de las funciones matemáticas y lógicas del Paso 2

const QUARTER_HOUR = 0.25;

function hoursToQuarterUnits(hours) {
  if (typeof hours !== "number" || isNaN(hours)) return 0;
  return Math.round(hours * 4);
}

function quarterUnitsToHours(units) {
  return units / 4;
}

function isValidQuarterHour(hours) {
  if (typeof hours !== "number" || isNaN(hours) || hours <= 0) return false;
  const units = hours * 4;
  return Math.abs(units - Math.round(units)) < 1e-5;
}

function formatHoursHuman(hours) {
  if (isNaN(hours) || hours < 0) return "0 h";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h} h`;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return -1;
  const parts = timeStr.trim().split(":");
  if (parts.length !== 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

function minutesToTimeString(minutes) {
  const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calculateEndTime(startTime, durationHours) {
  const startMin = timeStringToMinutes(startTime);
  if (startMin < 0 || durationHours <= 0) return "";
  const durationMin = Math.round(durationHours * 60);
  const endMin = startMin + durationMin;
  if (endMin >= 24 * 60) return "23:59";
  return minutesToTimeString(endMin);
}

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date(NaN);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const dates = [];
  const current = new Date(start.getTime());
  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function distributeHoursEquitably(totalHours, dates, defaultStartTime = "19:00") {
  if (!isValidQuarterHour(totalHours) || dates.length === 0) {
    return [];
  }

  const totalUnits = hoursToQuarterUnits(totalHours);
  const numSessions = dates.length;
  const baseUnits = Math.floor(totalUnits / numSessions);
  const residue = totalUnits % numSessions;

  const sortedDates = [...dates].sort();

  return sortedDates.map((date, idx) => {
    const sessionUnits = baseUnits + (idx < residue ? 1 : 0);
    const duration = quarterUnitsToHours(sessionUnits);
    const startTime = defaultStartTime;
    const endTime = calculateEndTime(startTime, duration);

    return {
      id: `session-${date}`,
      date,
      duration,
      start_time: startTime,
      end_time: endTime,
    };
  });
}

// 1. Caso obligatorio: 24 horas en 7 sesiones
console.log("=== TEST 1: 24 horas en 7 sesiones ===");
const dates7 = ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07"];
const sessions = distributeHoursEquitably(24, dates7, "19:00");
const durations = sessions.map(s => s.duration);
console.log("Duraciones obtenidas:", durations);
console.log("Esperado: [3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25]");
const sum = durations.reduce((a, b) => a + b, 0);
console.log("Suma total:", sum, "h (Esperado: 24)");
if (JSON.stringify(durations) === JSON.stringify([3.5, 3.5, 3.5, 3.5, 3.5, 3.25, 3.25]) && sum === 24) {
  console.log("TEST 1 PASSED!");
} else {
  console.error("TEST 1 FAILED!");
  process.exit(1);
}

// 2. Comprobación de múltiplos de 0.25
console.log("\n=== TEST 2: Validación de 0.25 h ===");
const testValues = [
  { val: 24, valid: true },
  { val: 24.25, valid: true },
  { val: 24.5, valid: true },
  { val: 24.75, valid: true },
  { val: 0, valid: false },
  { val: -1, valid: false },
  { val: 3.3, valid: false },
  { val: 1.1, valid: false },
  { val: 1.25, valid: true }
];
for (const t of testValues) {
  const res = isValidQuarterHour(t.val);
  if (res !== t.valid) {
    console.error(`TEST 2 FAILED for ${t.val}: expected ${t.valid}, got ${res}`);
    process.exit(1);
  }
}
console.log("TEST 2 PASSED!");

// 3. Rango de fechas inclusivo
console.log("\n=== TEST 3: Rango de fechas inclusivo ===");
const singleDay = generateDateRange("2026-06-01", "2026-06-01");
console.log("1 día:", singleDay);
if (singleDay.length !== 1 || singleDay[0] !== "2026-06-01") {
  console.error("TEST 3 Failed for 1 day");
  process.exit(1);
}
const threeDays = generateDateRange("2026-06-01", "2026-06-03");
console.log("3 días:", threeDays);
if (threeDays.length !== 3 || threeDays[0] !== "2026-06-01" || threeDays[2] !== "2026-06-03") {
  console.error("TEST 3 Failed for 3 days");
  process.exit(1);
}
console.log("TEST 3 PASSED!");

// 4. Formato legible
console.log("\n=== TEST 4: Formato legible ===");
console.log("3.25 h ->", formatHoursHuman(3.25));
console.log("3.5 h ->", formatHoursHuman(3.5));
console.log("24 h ->", formatHoursHuman(24));
if (formatHoursHuman(3.25) !== "3 h 15 min" || formatHoursHuman(3.5) !== "3 h 30 min" || formatHoursHuman(24) !== "24 h") {
  console.error("TEST 4 Failed");
  process.exit(1);
}
console.log("TEST 4 PASSED!");

// 5. Cálculo y validación de horarios
console.log("\n=== TEST 5: calculateDurationFromTimes y validateScheduleTimes ===");
function calculateDurationFromTimes(startTime, endTime) {
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  if (startMin < 0 || endMin <= startMin) return 0;
  const diffMin = endMin - startMin;
  return diffMin / 60;
}

function validateScheduleTimes(startTime, endTime) {
  if (!startTime || !endTime) {
    return { valid: false, error: "Debe ingresar tanto la hora de inicio como la de fin.", durationHours: 0 };
  }
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  if (startMin < 0 || endMin < 0) {
    return { valid: false, error: "Formato de hora inválido (HH:mm).", durationHours: 0 };
  }
  if (endMin <= startMin) {
    return { valid: false, error: "La hora de fin debe ser posterior a la de inicio en el mismo día.", durationHours: 0 };
  }
  const diffMin = endMin - startMin;
  if (diffMin % 15 !== 0) {
    return { valid: false, error: "El intervalo entre inicio y fin debe ser múltiplo de 15 minutos (0.25 h).", durationHours: diffMin / 60 };
  }
  return { valid: true, durationHours: diffMin / 60 };
}

// 5.1 Duraciones derivadas
if (calculateDurationFromTimes("19:00", "21:00") !== 2) throw new Error("19:00 - 21:00 debe ser 2h");
if (calculateDurationFromTimes("19:00", "20:15") !== 1.25) throw new Error("19:00 - 20:15 debe ser 1.25h");
if (calculateDurationFromTimes("19:00", "19:00") !== 0) throw new Error("Misma hora debe ser 0");
if (calculateDurationFromTimes("21:00", "19:00") !== 0) throw new Error("Fin antes de inicio debe ser 0");

// 5.2 Validaciones estrictas
const v1 = validateScheduleTimes("19:00", "21:00");
if (!v1.valid || v1.durationHours !== 2) throw new Error("v1 falló");

const v2 = validateScheduleTimes("21:00", "19:00");
if (v2.valid) throw new Error("v2 debería ser inválido por cruzar medianoche");

const v3 = validateScheduleTimes("19:00", "19:10"); // 10 min no es múltiplo de 15
if (v3.valid) throw new Error("v3 debería ser inválido por no ser múltiplo de 15 min");

const v4 = validateScheduleTimes("08:00", "12:45"); // 4h 45m = 4.75h
if (!v4.valid || v4.durationHours !== 4.75) throw new Error("v4 falló");

console.log("TEST 5 PASSED!");

console.log("\nTODOS LOS TESTS DE MATEMÁTICA Y FECHAS PASARON CON ÉXITO.");

