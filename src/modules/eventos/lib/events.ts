/* Tipos, modelos y almacenamiento para el módulo de Eventos y Formación */

import { loadTemplatesFromStorage, type CertificateTemplate } from "@/modules/certificados/lib/templates";

export type CourseType = "curso" | "taller" | "seminario" | "bootcamp" | "conferencia";

export type Modality = "presencial" | "virtual" | "hibrida";

export type CourseStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";

export type CourseSession = {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // en horas normales (múltiplos de 0.25 h / 15 min)
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_custom?: boolean; // true si es una excepción con horario personalizado respecto al global
};

export type ClosingEventConfig = {
  enabled: boolean;
  title?: string;
  date?: string;
  time?: string;
  modality?: Modality;
  location?: string;
  platform_link?: string;
  mandatory_attendance: boolean;
};

export type CourseCertificationConfig = {
  enabled: boolean;
  template_id?: string;
  min_attendance_percentage?: number;
  require_pass_evaluation?: boolean;
  min_passing_grade?: number;
  require_final_project?: boolean;
  require_closing_event?: boolean;
};

export type Course = {
  id: string;
  code: string;
  type: CourseType;
  title: string;
  description: string;
  category: string;
  instructor: string;
  instructor_role?: string;
  learning_objectives: string[];
  academic_hours: number;
  start_date: string;
  end_date: string;
  sessions_count: number;
  schedule_summary: string;
  sessions?: CourseSession[];
  modality: Modality;
  location?: string;
  platform_link?: string;
  unlimited_capacity: boolean;
  max_capacity?: number;
  attendance_mandatory: boolean;
  min_attendance_percentage: number;
  requires_evaluation: boolean;
  min_passing_grade?: number;
  requires_final_project: boolean;
  closing_event: ClosingEventConfig;
  certification: CourseCertificationConfig;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
};

export const INITIAL_COURSES: Course[] = [
  {
    id: "crs-cloud-devops-2026",
    code: "CRS-2026-001",
    type: "curso",
    title: "Arquitectura Cloud Nativa & DevOps Empresarial",
    description:
      "Programa intensivo enfocado en infraestructura como código con Terraform, contenedores en Kubernetes y automatización de pipelines CI/CD sobre AWS.",
    category: "Cloud & DevOps",
    instructor: "Ing. Víctor Herrera",
    instructor_role: "Director de Tecnología — Horizen TI",
    learning_objectives: [
      "Diseñar topologías de nube seguras y de alta disponibilidad en AWS.",
      "Aprovisionar infraestructura inmutable utilizando Terraform y GitOps.",
      "Implementar pipelines de integración y entrega continua con análisis SAST/DAST.",
      "Desplegar microservicios en clústeres gestionados de Kubernetes.",
    ],
    academic_hours: 48,
    start_date: "2026-04-06",
    end_date: "2026-05-29",
    sessions_count: 16,
    schedule_summary: "Lunes y Miércoles 19:00 - 22:00",
    modality: "virtual",
    platform_link: "https://campus.horizenti.com/aulas/cloud-devops",
    unlimited_capacity: false,
    max_capacity: 30,
    attendance_mandatory: true,
    min_attendance_percentage: 85,
    requires_evaluation: true,
    min_passing_grade: 14,
    requires_final_project: true,
    closing_event: {
      enabled: true,
      title: "Demoday de Proyectos & Clausura",
      date: "2026-05-30",
      time: "10:00 - 13:00",
      modality: "virtual",
      platform_link: "https://campus.horizenti.com/eventos/clausura-devops",
      mandatory_attendance: true,
    },
    certification: {
      enabled: true,
      template_id: "tpl-cloud-devops",
      min_attendance_percentage: 85,
      require_pass_evaluation: true,
      min_passing_grade: 14,
      require_final_project: true,
      require_closing_event: true,
    },
    status: "in_progress",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-25T14:30:00Z",
  },
  {
    id: "crs-seguridad-iso-2026",
    code: "CRS-2026-002",
    type: "taller",
    title: "Implementación Práctica del SGSI conforme a ISO/IEC 27001",
    description:
      "Taller ejecutivo dirigido a comités de riesgo y oficiales de seguridad para la estructuración de políticas, análisis de amenazas y gestión de incidentes.",
    category: "Ciberseguridad",
    instructor: "Lic. Carlos Mendoza",
    instructor_role: "Gerente de Operaciones y Estrategia",
    learning_objectives: [
      "Mapear los dominios de control del anexo A de la norma ISO/IEC 27001:2022.",
      "Diseñar matrices de riesgos operacionales y planes de tratamiento.",
      "Establecer protocolos de respuesta ante incidentes y continuidad del negocio.",
    ],
    academic_hours: 32,
    start_date: "2026-05-12",
    end_date: "2026-06-18",
    sessions_count: 12,
    schedule_summary: "Martes y Jueves 18:30 - 21:00",
    modality: "hibrida",
    location: "Centro de Capacitación Horizen TI — Sala Magna 3",
    platform_link: "https://campus.horizenti.com/aulas/iso27001",
    unlimited_capacity: false,
    max_capacity: 25,
    attendance_mandatory: true,
    min_attendance_percentage: 80,
    requires_evaluation: true,
    min_passing_grade: 14,
    requires_final_project: false,
    closing_event: {
      enabled: false,
      mandatory_attendance: false,
    },
    certification: {
      enabled: false,
    },
    status: "scheduled",
    created_at: "2026-03-10T11:00:00Z",
    updated_at: "2026-03-28T09:15:00Z",
  },
  {
    id: "crs-fullstack-moderno",
    code: "CRS-2026-003",
    type: "bootcamp",
    title: "Desarrollo Web Moderno con React, Next.js y Supabase",
    description:
      "Formación integral de frontend y backend serverless orientada a la construcción de aplicaciones empresariales escalables con arquitectura modular.",
    category: "Desarrollo",
    instructor: "Ing. Víctor Herrera",
    instructor_role: "Director de Tecnología — Horizen TI",
    learning_objectives: [
      "Construir interfaces reactivas con Server Components y diseño oscuro corporativo.",
      "Implementar seguridad RLS y funciones serverless en Supabase PostgreSQL.",
      "Optimizar rendimiento, accesibilidad y cobertura de pruebas automatizadas.",
    ],
    academic_hours: 60,
    start_date: "2026-06-01",
    end_date: "2026-07-24",
    sessions_count: 24,
    schedule_summary: "Lunes, Miércoles y Viernes 19:00 - 21:30",
    modality: "presencial",
    location: "Sede Corporativa Horizen TI — Laboratorio de Innovación",
    unlimited_capacity: false,
    max_capacity: 20,
    attendance_mandatory: true,
    min_attendance_percentage: 80,
    requires_evaluation: true,
    min_passing_grade: 15,
    requires_final_project: true,
    closing_event: {
      enabled: true,
      title: "Exposición de Proyectos y Clausura Presencial",
      date: "2026-07-25",
      time: "09:00 - 13:00",
      modality: "presencial",
      location: "Auditorio Principal Horizen TI",
      mandatory_attendance: true,
    },
    certification: {
      enabled: false,
    },
    status: "draft",
    created_at: "2026-03-20T16:00:00Z",
    updated_at: "2026-03-29T18:20:00Z",
  },
];

const STORAGE_KEY = "horizen_events_courses_v1";

export function loadCoursesFromStorage(): Course[] {
  if (typeof window === "undefined") {
    return INITIAL_COURSES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COURSES));
      return INITIAL_COURSES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_COURSES;
  } catch (err) {
    console.error("Error al cargar cursos de localStorage:", err);
    return INITIAL_COURSES;
  }
}

export function saveCoursesToStorage(courses: Course[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (err) {
    console.error("Error al guardar cursos en localStorage:", err);
  }
}

export function getCourseById(id: string): Course | null {
  const courses = loadCoursesFromStorage();
  return courses.find((c) => c.id === id) || null;
}

export function generateNextCourseCode(courses: Course[]): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CRS-${currentYear}-`;
  
  let maxSeq = 0;
  for (const c of courses) {
    if (c.code && c.code.startsWith(yearPrefix)) {
      const parts = c.code.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  
  const nextSeq = maxSeq + 1;
  return `${yearPrefix}${String(nextSeq).padStart(3, "0")}`;
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * REGLAS DE DURACIÓN Y CRONOGRAMA (Horas normales, múltiplos de 0.25 h)
 * ══════════════════════════════════════════════════════════════════════════
 * 1 hora normal = 60 minutos. No se emplean horas pedagógicas ni académicas.
 * Para evitar problemas de coma flotante de JS (0.1 + 0.2 !== 0.3), todos los
 * cálculos y comparaciones se realizan internamente en unidades enteras de
 * 15 minutos (0.25 h): 1 h = 4 unidades, 1.25 h = 5 unidades, etc.
 */
export const QUARTER_HOUR = 0.25;

export function hoursToQuarterUnits(hours: number): number {
  if (typeof hours !== "number" || isNaN(hours)) return 0;
  return Math.round(hours * 4);
}

export function quarterUnitsToHours(units: number): number {
  return units / 4;
}

export function isValidQuarterHour(hours: number): boolean {
  if (typeof hours !== "number" || isNaN(hours) || hours <= 0) return false;
  const units = hours * 4;
  return Math.abs(units - Math.round(units)) < 1e-5;
}

export function formatHoursHuman(hours: number): string {
  if (isNaN(hours) || hours < 0) return "0 h";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h} h`;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return -1;
  const parts = timeStr.trim().split(":");
  if (parts.length !== 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMin = timeStringToMinutes(startTime);
  if (startMin < 0 || durationHours <= 0) return "";
  const durationMin = Math.round(durationHours * 60);
  const endMin = startMin + durationMin;
  if (endMin >= 24 * 60) return "23:59";
  return minutesToTimeString(endMin);
}

/**
 * Calcula la duración en horas normales derivada de la diferencia entre inicio y fin.
 */
export function calculateDurationFromTimes(startTime: string, endTime: string): number {
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  if (startMin < 0 || endMin <= startMin) return 0;
  const diffMin = endMin - startMin;
  return diffMin / 60;
}

/**
 * Valida coherencia estricta de un intervalo de horario (HH:mm a HH:mm):
 * - Ambos campos requeridos.
 * - Formato válido.
 * - Hora de fin estrictamente posterior a la de inicio en el mismo día (sin cruce de medianoche).
 * - Intervalo múltiplo de 15 minutos (0.25 h).
 */
export function validateScheduleTimes(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string; durationHours: number } {
  if (!startTime || !endTime) {
    return {
      valid: false,
      error: "Debe ingresar tanto la hora de inicio como la de fin.",
      durationHours: 0,
    };
  }
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  if (startMin < 0 || endMin < 0) {
    return { valid: false, error: "Formato de hora inválido (HH:mm).", durationHours: 0 };
  }
  if (endMin <= startMin) {
    return {
      valid: false,
      error: "La hora de fin debe ser posterior a la de inicio en el mismo día (no se permite cruzar medianoche).",
      durationHours: 0,
    };
  }
  const diffMin = endMin - startMin;
  if (diffMin % 15 !== 0) {
    return {
      valid: false,
      error: "El intervalo entre inicio y fin debe ser múltiplo de 15 minutos (0.25 h).",
      durationHours: diffMin / 60,
    };
  }
  return { valid: true, durationHours: diffMin / 60 };
}

/**
 * Parsea fechas YYYY-MM-DD en hora local fija (mediodía) para evitar desfases
 * de día debidos al huso horario UTC (ej. GMT-5 restando 5 horas a medianoche).
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date(NaN);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Genera el rango completo de fechas de inicio a fin (ambos extremos inclusive).
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  if (!startDateStr || !endDateStr) return [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const current = new Date(start.getTime());
  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Distribución determinista y equitativa usando unidades enteras de 15 minutos:
 * 1. totalUnits = round(totalHours * 4)
 * 2. base = floor(totalUnits / numSessions)
 * 3. residue = totalUnits % numSessions
 * 4. Primeras `residue` sesiones reciben (base + 1) unidades, resto recibe base unidades.
 * 
 * Ejemplo canónico:
 * 24 h = 96 unidades en 7 sesiones:
 * 96 / 7 = base 13, residuo 5.
 * Primeras 5 sesiones = 14 unidades (3.5 h = 3 h 30 min).
 * Últimas 2 sesiones = 13 unidades (3.25 h = 3 h 15 min).
 * Suma = 5*3.5 + 2*3.25 = 17.5 + 6.5 = 24.0 h exactas.
 */
export function distributeHoursEquitably(
  totalHours: number,
  dates: string[],
  defaultStartTime: string = "19:00"
): CourseSession[] {
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

/**
 * Validador exhaustivo de coherencia de horario y distribución del Paso 2.
 */
export function validateCourseSchedule(
  totalHours: number,
  startDate: string,
  endDate: string,
  sessions: CourseSession[]
): {
  valid: boolean;
  errors: Record<string, string>;
  summary: {
    totalUnits: number;
    assignedUnits: number;
    pendingUnits: number;
    isExact: boolean;
  };
} {
  const errors: Record<string, string> = {};

  if (!totalHours || totalHours <= 0) {
    errors.academic_hours = "La duración total debe ser mayor a cero.";
  } else if (!isValidQuarterHour(totalHours)) {
    errors.academic_hours =
      "La duración total debe ser múltiplo de 0.25 h (15 min), ej. 24, 24.25, 24.5.";
  }

  if (!startDate) {
    errors.start_date = "La fecha de inicio es requerida.";
  }

  if (!endDate) {
    errors.end_date = "La fecha de finalización es requerida.";
  }

  if (startDate && endDate) {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.date_range = "Formato de fechas inválido.";
    } else if (end < start) {
      errors.end_date = "La fecha de fin no puede ser anterior a la de inicio.";
    }
  }

  const totalUnits = hoursToQuarterUnits(totalHours);
  let assignedUnits = 0;

  if (sessions.length === 0) {
    errors.sessions = "Debe activar al menos una fecha de clase en el calendario.";
  } else {
    sessions.forEach((s, idx) => {
      // 1. Validación de duración
      if (!s.duration || s.duration <= 0) {
        errors[`session_${s.date}_duration`] =
          `Sesión ${idx + 1} (${s.date}): Duración inválida (debe ser mayor a cero).`;
      } else if (!isValidQuarterHour(s.duration)) {
        errors[`session_${s.date}_duration`] =
          `Sesión ${idx + 1} (${s.date}): La duración debe ser múltiplo de 0.25 h (15 min).`;
      } else {
        assignedUnits += hoursToQuarterUnits(s.duration);
      }

      // 2. Validación de horario
      if (!s.start_time || !s.end_time) {
        errors[`session_${s.date}_schedule`] =
          `Sesión ${idx + 1} (${s.date}): Debe ingresar tanto la hora de inicio como la de fin.`;
      } else {
        const startMin = timeStringToMinutes(s.start_time);
        const endMin = timeStringToMinutes(s.end_time);

        if (startMin < 0 || endMin < 0) {
          errors[`session_${s.date}_schedule`] =
            `Sesión ${idx + 1} (${s.date}): Formato de hora inválido.`;
        } else if (endMin <= startMin) {
          errors[`session_${s.date}_schedule`] =
            `Sesión ${idx + 1} (${s.date}): La hora de fin debe ser posterior a la de inicio en el mismo día (no se permiten horarios que crucen medianoche).`;
        } else {
          const diffMin = endMin - startMin;
          const expectedMin = Math.round(s.duration * 60);
          if (diffMin !== expectedMin) {
            errors[`session_${s.date}_schedule`] =
              `Sesión ${idx + 1} (${s.date}): El horario (${s.start_time} - ${s.end_time} = ${formatHoursHuman(diffMin / 60)}) no coincide con la duración asignada (${formatHoursHuman(s.duration)}).`;
          }
        }
      }
    });

    // 3. Comparación de unidades totales asignadas vs requeridas
    if (totalHours > 0 && isValidQuarterHour(totalHours)) {
      if (assignedUnits !== totalUnits) {
        const diffUnits = totalUnits - assignedUnits;
        const diffHours = Math.abs(quarterUnitsToHours(diffUnits));
        if (diffUnits > 0) {
          errors.hours_mismatch = `Faltan ${formatHoursHuman(diffHours)} por asignar (${quarterUnitsToHours(assignedUnits)} h asignadas de ${totalHours} h requeridas).`;
        } else {
          errors.hours_mismatch = `Exceso de ${formatHoursHuman(diffHours)} asignadas (${quarterUnitsToHours(assignedUnits)} h asignadas de ${totalHours} h requeridas).`;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    summary: {
      totalUnits,
      assignedUnits,
      pendingUnits: totalUnits - assignedUnits,
      isExact: totalUnits > 0 && assignedUnits === totalUnits,
    },
  };
}

export function validateCourseData(data: Partial<Course>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("El nombre o título del curso es obligatorio.");
  }

  if (!data.description || data.description.trim() === "") {
    errors.push("La descripción del curso es obligatoria.");
  }

  if (!data.instructor || data.instructor.trim() === "") {
    errors.push("El instructor o facilitador es obligatorio.");
  }

  if (!data.academic_hours || Number(data.academic_hours) <= 0) {
    errors.push("La duración debe ser un número positivo mayor a cero.");
  } else if (!isValidQuarterHour(Number(data.academic_hours))) {
    errors.push("La duración total debe ser múltiplo de 0.25 h (15 minutos).");
  }

  if (!data.start_date) {
    errors.push("La fecha de inicio es requerida.");
  }

  if (!data.end_date) {
    errors.push("La fecha de finalización es requerida.");
  }

  if (data.start_date && data.end_date) {
    const start = parseLocalDate(data.start_date);
    const end = parseLocalDate(data.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      errors.push("La fecha de finalización no puede ser anterior a la fecha de inicio.");
    }
  }

  if (data.sessions && data.sessions.length > 0) {
    const scheduleValidation = validateCourseSchedule(
      Number(data.academic_hours || 0),
      data.start_date || "",
      data.end_date || "",
      data.sessions
    );
    if (!scheduleValidation.valid) {
      Object.values(scheduleValidation.errors).forEach((err) => {
        if (!errors.includes(err)) errors.push(err);
      });
    }
  }

  if (data.modality === "presencial" || data.modality === "hibrida") {
    if (!data.location || data.location.trim() === "") {
      errors.push("Para modalidad presencial o híbrida, debe especificar la sede o aula física.");
    }
  }

  if (data.modality === "virtual" || data.modality === "hibrida") {
    if (!data.platform_link || data.platform_link.trim() === "") {
      errors.push("Para modalidad virtual o híbrida, debe indicar la plataforma o enlace de acceso.");
    }
  }

  if (!data.unlimited_capacity) {
    if (!data.max_capacity || Number(data.max_capacity) <= 0) {
      errors.push("Si los cupos son limitados, la capacidad máxima debe ser mayor a cero.");
    }
  }

  if (
    data.min_attendance_percentage !== undefined &&
    (data.min_attendance_percentage < 0 || data.min_attendance_percentage > 100)
  ) {
    errors.push("El porcentaje de asistencia debe estar entre 0% y 100%.");
  }

  // Validación de cierre de evento
  if (data.closing_event?.enabled) {
    if (!data.closing_event.title || data.closing_event.title.trim() === "") {
      errors.push("Debe especificar el título del evento de cierre.");
    }
    if (!data.closing_event.date) {
      errors.push("Debe indicar la fecha del evento de cierre.");
    }
  }

  // Validación de vinculación con certificado
  if (data.certification?.enabled) {
    if (!data.certification.template_id) {
      errors.push("Debe seleccionar una plantilla de certificado activa para este curso.");
    } else {
      const templates = loadTemplatesFromStorage();
      const selectedTpl = templates.find((t) => t.id === data.certification?.template_id);
      if (!selectedTpl) {
        errors.push("La plantilla de certificado seleccionada no existe.");
      } else if (selectedTpl.status !== "active") {
        errors.push(
          `La plantilla seleccionada ("${selectedTpl.name}") está en estado "${selectedTpl.status}". Solo se permite vincular plantillas activas.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createCourse(
  input: Omit<Course, "id" | "code" | "created_at" | "updated_at">
): Course {
  const current = loadCoursesFromStorage();
  const nextCode = generateNextCourseCode(current);
  const now = new Date().toISOString();

  const newCourse: Course = {
    ...input,
    id: `crs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: nextCode,
    created_at: now,
    updated_at: now,
  };

  const updated = [newCourse, ...current];
  saveCoursesToStorage(updated);
  return newCourse;
}

export function updateCourse(id: string, updates: Partial<Course>): Course | null {
  const current = loadCoursesFromStorage();
  const index = current.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updatedCourse: Course = {
    ...current[index],
    ...updates,
    id: current[index].id,
    code: current[index].code,
    updated_at: now,
  };

  current[index] = updatedCourse;
  saveCoursesToStorage(current);
  return updatedCourse;
}

export function updateCourseStatus(id: string, status: CourseStatus): Course | null {
  return updateCourse(id, { status });
}

export function deleteCourse(id: string): boolean {
  const current = loadCoursesFromStorage();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length === current.length) return false;
  saveCoursesToStorage(filtered);
  return true;
}

export type CourseStats = {
  total: number;
  in_progress: number;
  scheduled: number;
  completed: number;
  draft: number;
  with_certificate: number;
};

export function calculateCourseStats(courses: Course[]): CourseStats {
  return {
    total: courses.length,
    in_progress: courses.filter((c) => c.status === "in_progress").length,
    scheduled: courses.filter((c) => c.status === "scheduled").length,
    completed: courses.filter((c) => c.status === "completed").length,
    draft: courses.filter((c) => c.status === "draft").length,
    with_certificate: courses.filter((c) => c.certification?.enabled).length,
  };
}

export function getLinkedTemplate(course: Course): CertificateTemplate | null {
  if (!course.certification?.enabled || !course.certification.template_id) {
    return null;
  }
  const templates = loadTemplatesFromStorage();
  return templates.find((t) => t.id === course.certification.template_id) || null;
}

