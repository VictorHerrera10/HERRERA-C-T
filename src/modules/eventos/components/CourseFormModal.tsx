"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Course,
  type CourseType,
  type Modality,
  type CourseStatus,
  type CourseSession,
  createCourse,
  updateCourse,
  validateCourseData,
  validateCourseSchedule,
  distributeHoursEquitably,
  generateDateRange,
  parseLocalDate,
  formatLocalDate,
  formatHoursHuman,
  isValidQuarterHour,
  calculateEndTime,
  timeStringToMinutes,
  hoursToQuarterUnits,
  quarterUnitsToHours,
  calculateDurationFromTimes,
  validateScheduleTimes,
} from "../lib/events";
import {
  loadTemplatesFromStorage,
  type CertificateTemplate,
} from "@/modules/certificados/lib/templates";

export type StepId = 1 | 2 | 3 | 4 | 5 | 6;

interface StepMeta {
  id: StepId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

const STEPS: StepMeta[] = [
  {
    id: 1,
    number: "01",
    title: "Información general",
    shortTitle: "General",
    description: "Identificación, tipo, instructor y objetivos de aprendizaje.",
    icon: "info",
  },
  {
    id: 2,
    number: "02",
    title: "Duración y cronograma",
    shortTitle: "Cronograma",
    description: "Horas académicas, sesiones y calendario de ejecución.",
    icon: "clock",
  },
  {
    id: 3,
    number: "03",
    title: "Modalidad y capacidad",
    shortTitle: "Modalidad",
    description: "Entorno de dictado, sede o plataforma y cupos de aforo.",
    icon: "globe",
  },
  {
    id: 4,
    number: "04",
    title: "Asistencia y evaluación",
    shortTitle: "Evaluación",
    description: "Exigencia de asistencia, evaluaciones técnicas y proyecto.",
    icon: "chart",
  },
  {
    id: 5,
    number: "05",
    title: "Clausura y certificación",
    shortTitle: "Certificación",
    description: "Ceremonia de clausura y vinculación a plantilla oficial.",
    icon: "certificate",
  },
  {
    id: 6,
    number: "06",
    title: "Revisión y creación",
    shortTitle: "Revisión",
    description: "Ficha técnica consolidada y registro final de la actividad.",
    icon: "check",
  },
];

const COURSE_TYPES: { value: CourseType; label: string; icon: string; desc: string }[] = [
  {
    value: "curso",
    label: "Curso Especializado",
    icon: "academic",
    desc: "Formación estructurada teórico-práctica con temario por módulos.",
  },
  {
    value: "taller",
    label: "Taller Práctico / Workshop",
    icon: "wrench",
    desc: "Sesiones dinámicas enfocadas en laboratorios aplicados y casos reales.",
  },
  {
    value: "seminario",
    label: "Seminario Ejecutivo",
    icon: "chip",
    desc: "Exposiciones de alto nivel sobre tendencias y gestión estratégica.",
  },
  {
    value: "bootcamp",
    label: "Bootcamp Intensivo",
    icon: "rocket",
    desc: "Inmersión acelerada de alta exigencia para dominio tecnológico.",
  },
  {
    value: "conferencia",
    label: "Conferencia / Masterclass",
    icon: "video",
    desc: "Ponencia magistral orientada a divulgación y actualización tecnológica.",
  },
];

const MODALITIES: { value: Modality; label: string; icon: string; desc: string }[] = [
  {
    value: "presencial",
    label: "Presencial",
    icon: "building",
    desc: "Clases físicas en sede u auditorio corporativo.",
  },
  {
    value: "virtual",
    label: "Virtual (En línea)",
    icon: "video",
    desc: "Transmisión en vivo vía videoconferencia o campus digital.",
  },
  {
    value: "hibrida",
    label: "Híbrida (Dual)",
    icon: "globe",
    desc: "Combinación simultánea de asistencia física y remota.",
  },
];

const CATEGORIES = [
  "Tecnología",
  "Cloud & DevOps",
  "Ciberseguridad",
  "Desarrollo",
  "Gestión TI",
  "Inteligencia Artificial",
  "Infraestructura",
  "Metodologías Ágiles",
];

type FormDataShape = Omit<Course, "id" | "code" | "created_at" | "updated_at">;

const DEFAULT_COURSE: FormDataShape = {
  type: "curso",
  title: "",
  description: "",
  category: "Tecnología",
  instructor: "",
  instructor_role: "Instructor Especialista — Horizen TI",
  learning_objectives: [""],
  academic_hours: 24,
  start_date: "",
  end_date: "",
  sessions_count: 8,
  schedule_summary: "",
  sessions: [],
  modality: "virtual",
  location: "",
  platform_link: "",
  unlimited_capacity: false,
  max_capacity: 30,
  attendance_mandatory: true,
  min_attendance_percentage: 80,
  requires_evaluation: true,
  min_passing_grade: 14,
  requires_final_project: true,
  closing_event: {
    enabled: false,
    title: "",
    date: "",
    time: "",
    modality: "virtual",
    location: "",
    platform_link: "",
    mandatory_attendance: false,
  },
  certification: {
    enabled: false,
    template_id: "",
    min_attendance_percentage: 80,
    require_pass_evaluation: true,
    min_passing_grade: 14,
    require_final_project: true,
    require_closing_event: false,
  },
  status: "draft",
};

function getInitialFormData(course: Course | null): FormDataShape {
  if (!course) return DEFAULT_COURSE;
  return {
    type: course.type,
    title: course.title,
    description: course.description,
    category: course.category,
    instructor: course.instructor,
    instructor_role: course.instructor_role || "",
    learning_objectives:
      course.learning_objectives?.length > 0 ? course.learning_objectives : [""],
    academic_hours: course.academic_hours,
    start_date: course.start_date,
    end_date: course.end_date,
    sessions_count: course.sessions_count,
    schedule_summary: course.schedule_summary || "",
    sessions:
      course.sessions && course.sessions.length > 0
        ? course.sessions
        : course.start_date && course.end_date && course.academic_hours > 0
        ? distributeHoursEquitably(
            course.academic_hours,
            generateDateRange(course.start_date, course.end_date)
          )
        : [],
    modality: course.modality,
    location: course.location || "",
    platform_link: course.platform_link || "",
    unlimited_capacity: course.unlimited_capacity,
    max_capacity: course.max_capacity ?? 30,
    attendance_mandatory: course.attendance_mandatory,
    min_attendance_percentage: course.min_attendance_percentage,
    requires_evaluation: course.requires_evaluation,
    min_passing_grade: course.min_passing_grade ?? 14,
    requires_final_project: course.requires_final_project,
    closing_event: {
      enabled: Boolean(course.closing_event?.enabled),
      title: course.closing_event?.title || "",
      date: course.closing_event?.date || "",
      time: course.closing_event?.time || "",
      modality: course.closing_event?.modality || "virtual",
      location: course.closing_event?.location || "",
      platform_link: course.closing_event?.platform_link || "",
      mandatory_attendance: Boolean(course.closing_event?.mandatory_attendance),
    },
    certification: {
      enabled: Boolean(course.certification?.enabled),
      template_id: course.certification?.template_id || "",
      min_attendance_percentage: course.certification?.min_attendance_percentage ?? 80,
      require_pass_evaluation: course.certification?.require_pass_evaluation ?? true,
      min_passing_grade: course.certification?.min_passing_grade ?? 14,
      require_final_project: course.certification?.require_final_project ?? true,
      require_closing_event: course.certification?.require_closing_event ?? false,
    },
    status: course.status,
  };
}

/**
 * Interruptor booleano reutilizable con estilo corporativo Horizen
 */
function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  accentColor = "crimson",
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  accentColor?: "crimson" | "azul" | "esmeralda" | "gold";
}) {
  const bgActive =
    accentColor === "esmeralda"
      ? "bg-esmeralda"
      : accentColor === "azul"
      ? "bg-azul"
      : accentColor === "gold"
      ? "bg-gold"
      : "bg-crimson";

  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-edge bg-carbon/60 hover:bg-steel/30 transition-colors cursor-pointer select-none"
    >
      <div className="space-y-0.5 min-w-0 flex-1">
        <span className="text-xs font-semibold text-snow block">{label}</span>
        {description && <p className="text-[11px] text-fog leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          checked ? bgActive : "bg-steel"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-snow shadow-md transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Formateador de fechas para los chips interactivos de días de clase
 */
function getChipDateInfo(dateStr: string) {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) {
    return { dayName: "", dayNum: "", month: "", isWeekend: false };
  }
  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
  return {
    dayName: dayNames[d.getDay()],
    dayNum: String(d.getDate()),
    month: months[d.getMonth()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}

/**
 * Formateador legible para encabezados de sesión
 */
function getSessionFullLabel(dateStr: string) {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const daysFull = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const monthsFull = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  return `${daysFull[d.getDay()]}, ${d.getDate()} de ${monthsFull[d.getMonth()]}`;
}

/**
 * Formateador compacto para tabla de sesiones (ej. "Lun., 1 jun.")
 */
function getSessionShortLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const daysShort = ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."];
  const monthsShort = [
    "ene.", "feb.", "mar.", "abr.", "may.", "jun.",
    "jul.", "ago.", "set.", "oct.", "nov.", "dic."
  ];
  return `${daysShort[d.getDay()]}, ${d.getDate()} ${monthsShort[d.getMonth()]}`;
}

/**
 * Contenido interno del Asistente (inicializa su estado directamente al montarse)
 */
function CourseWizardModalContent({
  initialCourse,
  onClose,
  onSave,
}: {
  initialCourse: Course | null;
  onClose: () => void;
  onSave: (saved: Course, isNew: boolean) => void;
}) {
  const toast = useToast();
  const [formData, setFormData] = useState<FormDataShape>(() => getInitialFormData(initialCourse));
  const [availableTemplates] = useState<CertificateTemplate[]>(() => loadTemplatesFromStorage());
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bloquear scroll de la página de fondo mientras el modal está activo
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Plantillas activas
  const activeTemplates = useMemo(
    () => availableTemplates.filter((t) => t.status === "active"),
    [availableTemplates]
  );

  const selectedTemplate = useMemo(() => {
    return availableTemplates.find((t) => t.id === formData.certification.template_id) || null;
  }, [availableTemplates, formData.certification.template_id]);

  // Cache de configuraciones de sesión por fecha (para restaurar si se desactiva y vuelve a activar)
  const [sessionConfigs, setSessionConfigs] = useState<Record<string, CourseSession>>(() => {
    const map: Record<string, CourseSession> = {};
    if (initialCourse?.sessions) {
      initialCourse.sessions.forEach((s) => {
        map[s.date] = s;
      });
    }
    return map;
  });

  // Estado del horario habitual / global para Paso 2
  const [globalStartTime, setGlobalStartTime] = useState<string>(() => {
    return initialCourse?.sessions?.[0]?.start_time || "19:00";
  });
  const [globalEndTime, setGlobalEndTime] = useState<string>(() => {
    return initialCourse?.sessions?.[0]?.end_time || "21:00";
  });

  // Estado de edición puntual (inline) de una sesión
  const [editingSessionDate, setEditingSessionDate] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState<string>("");
  const [tempEndTime, setTempEndTime] = useState<string>("");

  // Validación en vivo del horario habitual
  const globalScheduleValidation = useMemo(() => {
    return validateScheduleTimes(globalStartTime, globalEndTime);
  }, [globalStartTime, globalEndTime]);

  const hasCustomExceptions = useMemo(() => {
    return (formData.sessions || []).some((s) => s.is_custom);
  }, [formData.sessions]);

  const customExceptionsCount = useMemo(() => {
    return (formData.sessions || []).filter((s) => s.is_custom).length;
  }, [formData.sessions]);

  // Fechas dentro del rango configurado (ambos extremos inclusive)
  const availableDates = useMemo(() => {
    return generateDateRange(formData.start_date, formData.end_date);
  }, [formData.start_date, formData.end_date]);

  // Conjunto de fechas activas
  const activeDateSet = useMemo(() => {
    return new Set((formData.sessions || []).map((s) => s.date));
  }, [formData.sessions]);

  // Cálculos de unidades y horas de sesiones activas (1 unidad = 0.25 h = 15 min)
  const assignedUnits = useMemo(() => {
    return (formData.sessions || []).reduce(
      (acc, s) => acc + hoursToQuarterUnits(s.duration || 0),
      0
    );
  }, [formData.sessions]);

  const assignedHours = useMemo(() => {
    return quarterUnitsToHours(assignedUnits);
  }, [assignedUnits]);

  const totalRequiredUnits = useMemo(() => {
    return hoursToQuarterUnits(Number(formData.academic_hours) || 0);
  }, [formData.academic_hours]);

  const totalRequiredHours = useMemo(() => {
    return Number(formData.academic_hours) || 0;
  }, [formData.academic_hours]);

  // Validación en tiempo real del cronograma para Paso 2
  const scheduleValidation = useMemo(() => {
    return validateCourseSchedule(
      totalRequiredHours,
      formData.start_date,
      formData.end_date,
      formData.sessions || []
    );
  }, [totalRequiredHours, formData.start_date, formData.end_date, formData.sessions]);

  // Cálculo dinámico de duración para Paso 2
  const durationSummary = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return null;
    const start = parseLocalDate(formData.start_date);
    const end = parseLocalDate(formData.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;

    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.max(1, Math.round(diffDays / 7));
    const activeCount = formData.sessions?.length || formData.sessions_count;
    const hoursPerSession =
      activeCount > 0 ? (totalRequiredHours / activeCount).toFixed(2) : null;

    return {
      days: diffDays,
      weeks,
      hoursPerSession,
    };
  }, [formData.start_date, formData.end_date, totalRequiredHours, formData.sessions, formData.sessions_count]);

  // Conmutar día de clase (activar o desactivar)
  function handleToggleDate(dateStr: string) {
    setFormData((prev) => {
      const currentSessions = prev.sessions || [];
      const exists = currentSessions.find((s) => s.date === dateStr);

      let newSessions: CourseSession[];
      if (exists) {
        // Desactivar: guardar en sessionConfigs y remover de formData.sessions
        setSessionConfigs((cfg) => ({ ...cfg, [dateStr]: exists }));
        newSessions = currentSessions.filter((s) => s.date !== dateStr);
      } else {
        // Activar: recuperar de sessionConfigs o generar una sesión con el horario habitual
        const cached = sessionConfigs[dateStr];
        const defaultDur = globalScheduleValidation.valid ? globalScheduleValidation.durationHours : 2;
        const newSession: CourseSession = cached || {
          id: `session-${dateStr}`,
          date: dateStr,
          duration: defaultDur,
          start_time: globalStartTime,
          end_time: globalEndTime,
          is_custom: false,
        };
        newSessions = [...currentSessions, newSession].sort((a, b) => a.date.localeCompare(b.date));
      }

      return {
        ...prev,
        sessions: newSessions,
        sessions_count: newSessions.length,
      };
    });
  }

  // Seleccionar todos los días del rango
  function handleSelectAllDates() {
    if (availableDates.length === 0) return;
    const defaultDur = globalScheduleValidation.valid ? globalScheduleValidation.durationHours : 2;
    setFormData((prev) => {
      const currentSessions = prev.sessions || [];
      const activeMap = new Map(currentSessions.map((s) => [s.date, s]));

      const newSessions = availableDates.map((dateStr) => {
        if (activeMap.has(dateStr)) return activeMap.get(dateStr)!;
        if (sessionConfigs[dateStr]) return sessionConfigs[dateStr];
        return {
          id: `session-${dateStr}`,
          date: dateStr,
          duration: defaultDur,
          start_time: globalStartTime,
          end_time: globalEndTime,
          is_custom: false,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...prev,
        sessions: newSessions,
        sessions_count: newSessions.length,
      };
    });
  }

  // Seleccionar solo días hábiles (Lunes a Viernes)
  function handleSelectWeekdays() {
    if (availableDates.length === 0) return;
    const weekdays = availableDates.filter((dateStr) => {
      const d = parseLocalDate(dateStr);
      const day = d.getDay();
      return day !== 0 && day !== 6;
    });

    const defaultDur = globalScheduleValidation.valid ? globalScheduleValidation.durationHours : 2;
    setFormData((prev) => {
      const currentSessions = prev.sessions || [];
      const activeMap = new Map(currentSessions.map((s) => [s.date, s]));

      const newSessions = weekdays.map((dateStr) => {
        if (activeMap.has(dateStr)) return activeMap.get(dateStr)!;
        if (sessionConfigs[dateStr]) return sessionConfigs[dateStr];
        return {
          id: `session-${dateStr}`,
          date: dateStr,
          duration: defaultDur,
          start_time: globalStartTime,
          end_time: globalEndTime,
          is_custom: false,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...prev,
        sessions: newSessions,
        sessions_count: newSessions.length,
      };
    });
  }

  // Desactivar todos los días
  function handleClearAllDates() {
    setFormData((prev) => ({
      ...prev,
      sessions: [],
      sessions_count: 0,
    }));
  }

  // Aplicar horario global (preservando o sobrescribiendo excepciones)
  function handleApplyGlobalSchedule(overwriteExceptions: boolean = false) {
    if (!globalScheduleValidation.valid) {
      toast.error(
        "Horario habitual inválido",
        globalScheduleValidation.error || "Verifique las horas ingresadas."
      );
      return;
    }

    const currentSessions = formData.sessions || [];
    if (currentSessions.length === 0) {
      toast.warning(
        "Sin sesiones activas",
        "Active fechas en el calendario antes de aplicar el horario habitual."
      );
      return;
    }

    const durationHours = globalScheduleValidation.durationHours;
    let updatedCount = 0;

    const updatedSessions = currentSessions.map((s) => {
      if (s.is_custom && !overwriteExceptions) {
        return s;
      }
      updatedCount++;
      return {
        ...s,
        start_time: globalStartTime,
        end_time: globalEndTime,
        duration: durationHours,
        is_custom: false,
      };
    });

    // Actualizar cache de configuraciones
    setSessionConfigs((prev) => {
      const next = { ...prev };
      updatedSessions.forEach((s) => {
        next[s.date] = s;
      });
      return next;
    });

    setFormData((prev) => ({
      ...prev,
      sessions: updatedSessions,
    }));

    if (overwriteExceptions) {
      toast.success(
        "Horario aplicado a todas las sesiones",
        `Se actualizaron las ${updatedSessions.length} clases con ${globalStartTime} – ${globalEndTime} (${formatHoursHuman(durationHours)}).`
      );
    } else {
      toast.success(
        "Horario habitual aplicado",
        `Se actualizaron ${updatedCount} sesiones por defecto.${
          customExceptionsCount > 0 ? ` Se conservaron ${customExceptionsCount} excepciones.` : ""
        }`
      );
    }
  }

  // Iniciar edición puntual de una sesión
  function handleStartEditingSession(s: CourseSession) {
    setEditingSessionDate(s.date);
    setTempStartTime(s.start_time);
    setTempEndTime(s.end_time);
  }

  // Cancelar edición puntual
  function handleCancelEditingSession() {
    setEditingSessionDate(null);
    setTempStartTime("");
    setTempEndTime("");
  }

  // Guardar excepción de una sesión
  function handleSaveSessionException(dateStr: string) {
    const val = validateScheduleTimes(tempStartTime, tempEndTime);
    if (!val.valid) {
      toast.error("Horario no válido", val.error || "Verifique las horas de inicio y fin.");
      return;
    }

    setFormData((prev) => {
      const updated = (prev.sessions || []).map((s) => {
        if (s.date !== dateStr) return s;
        return {
          ...s,
          start_time: tempStartTime,
          end_time: tempEndTime,
          duration: val.durationHours,
          is_custom: true,
        };
      });
      return { ...prev, sessions: updated };
    });

    // Actualizar también en sessionConfigs
    setSessionConfigs((prev) => {
      const existing = prev[dateStr];
      return {
        ...prev,
        [dateStr]: {
          ...(existing || { id: `session-${dateStr}`, date: dateStr }),
          start_time: tempStartTime,
          end_time: tempEndTime,
          duration: val.durationHours,
          is_custom: true,
        },
      };
    });

    setEditingSessionDate(null);
    toast.success(
      "Excepción guardada",
      `Sesión del ${getSessionShortLabel(dateStr)} ajustada a ${tempStartTime} – ${tempEndTime} (${formatHoursHuman(val.durationHours)}).`
    );
  }

  // Restaurar sesión individual al horario habitual
  function handleRestoreSessionToDefault(dateStr: string) {
    if (!globalScheduleValidation.valid) {
      toast.warning(
        "Horario habitual inválido",
        "Corrija las horas de inicio y fin en el horario habitual antes de restaurar."
      );
      return;
    }

    const durationHours = globalScheduleValidation.durationHours;

    setFormData((prev) => {
      const updated = (prev.sessions || []).map((s) => {
        if (s.date !== dateStr) return s;
        return {
          ...s,
          start_time: globalStartTime,
          end_time: globalEndTime,
          duration: durationHours,
          is_custom: false,
        };
      });
      return { ...prev, sessions: updated };
    });

    setSessionConfigs((prev) => {
      const existing = prev[dateStr];
      return {
        ...prev,
        [dateStr]: {
          ...(existing || { id: `session-${dateStr}`, date: dateStr }),
          start_time: globalStartTime,
          end_time: globalEndTime,
          duration: durationHours,
          is_custom: false,
        },
      };
    });

    if (editingSessionDate === dateStr) {
      setEditingSessionDate(null);
    }

    toast.info(
      "Horario restaurado",
      `Sesión del ${getSessionShortLabel(dateStr)} restablecida al horario habitual (${globalStartTime} – ${globalEndTime}).`
    );
  }

  // Redistribución equitativa y exacta explícita
  function handleRedistributeHours() {
    const totalHours = Number(formData.academic_hours);
    if (!isValidQuarterHour(totalHours)) {
      toast.warning(
        "Duración total inválida",
        "La duración debe ser un múltiplo positivo de 0.25 h (15 min), ej. 24, 24.25, 24.5."
      );
      return;
    }

    // Si hay sesiones activas, redistribuir sobre ellas. Si no hay activas pero hay availableDates, activar todas y distribuir.
    let targetDates = (formData.sessions || []).map((s) => s.date);
    if (targetDates.length === 0) {
      if (availableDates.length > 0) {
        targetDates = availableDates;
      } else {
        toast.warning(
          "Sin fechas disponibles",
          "Por favor configure una fecha de inicio y una fecha de fin válidas."
        );
        return;
      }
    }

    const defaultStartTime = globalStartTime || formData.sessions?.[0]?.start_time || "19:00";
    const distributed = distributeHoursEquitably(totalHours, targetDates, defaultStartTime);

    // Actualizar cache
    setSessionConfigs((prev) => {
      const next = { ...prev };
      distributed.forEach((s) => {
        next[s.date] = s;
      });
      return next;
    });

    setFormData((prev) => ({
      ...prev,
      sessions: distributed,
      sessions_count: distributed.length,
    }));

    toast.success(
      "Distribución calculada con éxito",
      `Se asignaron exactamente ${formatHoursHuman(totalHours)} en ${distributed.length} sesiones.`
    );
  }

  // Autogeneración de resumen de horario
  function handleAutoGenerateSummary() {
    const sessions = formData.sessions || [];
    if (sessions.length === 0) {
      toast.warning("Sin sesiones", "No hay sesiones activas para resumir.");
      return;
    }

    const first = sessions[0];
    const sameHours = sessions.every(
      (s) => s.start_time === first.start_time && s.end_time === first.end_time
    );

    const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dayIndices = Array.from(
      new Set(sessions.map((s) => parseLocalDate(s.date).getDay()))
    ).sort();

    const daysLabel =
      dayIndices.length === 5 && dayIndices.every((d, i) => d === i + 1)
        ? "Lunes a Viernes"
        : dayIndices.map((i) => dayNamesShort[i]).join(", ");

    const summary = sameHours
      ? `${daysLabel} ${first.start_time} - ${first.end_time} (GMT-5)`
      : `${daysLabel} (${sessions.length} clases planificadas)`;

    setFormData((prev) => ({
      ...prev,
      schedule_summary: summary,
    }));

    toast.info("Resumen generado", summary);
  }

  // Manejo de objetivos de aprendizaje
  function handleAddObjective() {
    setFormData((prev) => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""],
    }));
  }

  function handleObjectiveChange(index: number, val: string) {
    setFormData((prev) => {
      const copy = [...prev.learning_objectives];
      copy[index] = val;
      return { ...prev, learning_objectives: copy };
    });
  }

  function handleRemoveObjective(index: number) {
    setFormData((prev) => {
      const copy = prev.learning_objectives.filter((_, i) => i !== index);
      return {
        ...prev,
        learning_objectives: copy.length > 0 ? copy : [""],
      };
    });
  }

  // Validación por etapa individual antes de avanzar
  function validateStep(step: StepId): boolean {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title || formData.title.trim() === "") {
        errors.title = "El nombre o título del curso es obligatorio.";
      }
      if (!formData.instructor || formData.instructor.trim() === "") {
        errors.instructor = "El instructor o facilitador es obligatorio.";
      }
      if (!formData.description || formData.description.trim() === "") {
        errors.description = "La descripción del curso es obligatoria.";
      }
    }

    if (step === 2) {
      const scheduleVal = validateCourseSchedule(
        Number(formData.academic_hours),
        formData.start_date,
        formData.end_date,
        formData.sessions || []
      );

      if (!scheduleVal.valid) {
        Object.assign(errors, scheduleVal.errors);
      }
    }

    if (step === 3) {
      if (formData.modality === "presencial" || formData.modality === "hibrida") {
        if (!formData.location || formData.location.trim() === "") {
          errors.location = "Para modalidad presencial o híbrida, debe especificar la sede o aula.";
        }
      }
      if (formData.modality === "virtual" || formData.modality === "hibrida") {
        if (!formData.platform_link || formData.platform_link.trim() === "") {
          errors.platform_link = "Para modalidad virtual o híbrida, debe indicar el enlace o plataforma.";
        }
      }
      if (!formData.unlimited_capacity) {
        if (!formData.max_capacity || Number(formData.max_capacity) <= 0) {
          errors.max_capacity = "La capacidad máxima debe ser mayor a cero.";
        }
      }
    }

    if (step === 4) {
      if (
        formData.min_attendance_percentage !== undefined &&
        (formData.min_attendance_percentage < 0 || formData.min_attendance_percentage > 100)
      ) {
        errors.min_attendance_percentage = "El porcentaje debe estar entre 0% y 100%.";
      }
      if (formData.requires_evaluation) {
        if (
          formData.min_passing_grade === undefined ||
          formData.min_passing_grade < 0 ||
          formData.min_passing_grade > 20
        ) {
          errors.min_passing_grade = "La nota mínima debe estar entre 0 y 20.";
        }
      }
    }

    if (step === 5) {
      if (formData.closing_event.enabled) {
        if (!formData.closing_event.title || formData.closing_event.title.trim() === "") {
          errors.closing_event_title = "Debe especificar el título del evento de cierre.";
        }
        if (!formData.closing_event.date) {
          errors.closing_event_date = "Debe indicar la fecha del evento de cierre.";
        }
      }
      if (formData.certification.enabled) {
        if (!formData.certification.template_id) {
          errors.certification_template_id = "Debe seleccionar una plantilla activa.";
        } else {
          const tpl = availableTemplates.find((t) => t.id === formData.certification.template_id);
          if (!tpl || tpl.status !== "active") {
            errors.certification_template_id = "Solo se permite vincular plantillas activas.";
          }
        }
      }
    }

    setStepErrors(errors);

    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      toast.warning("Información requerida", errors[errorKeys[0]]);
      return false;
    }

    return true;
  }

  // Navegación: Avanzar
  function handleNext() {
    if (validateStep(currentStep)) {
      setStepErrors({});
      if (currentStep < 6) {
        setCurrentStep((prev) => (prev + 1) as StepId);
      }
    }
  }

  // Navegación: Retroceder
  function handlePrev() {
    setStepErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepId);
    }
  }

  // Navegación: Saltar a un paso específico (desde stepper o resumen de revisión)
  function handleJumpToStep(step: StepId) {
    setStepErrors({});
    setCurrentStep(step);
  }

  // Envío final del formulario (Paso 6)
  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Limpieza de objetivos vacíos
    const cleanedObjectives = formData.learning_objectives
      .map((o) => o.trim())
      .filter(Boolean);

    const dataToValidate: Partial<Course> = {
      ...formData,
      learning_objectives: cleanedObjectives,
      academic_hours: Number(formData.academic_hours),
      sessions_count:
        formData.sessions && formData.sessions.length > 0
          ? formData.sessions.length
          : Number(formData.sessions_count),
      sessions: formData.sessions || [],
      max_capacity: formData.unlimited_capacity ? undefined : Number(formData.max_capacity),
      min_attendance_percentage: Number(formData.min_attendance_percentage),
      min_passing_grade: formData.requires_evaluation
        ? Number(formData.min_passing_grade)
        : undefined,
    };

    const validation = validateCourseData(dataToValidate);
    if (!validation.valid) {
      toast.error("Formulario incompleto", validation.errors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialCourse) {
        const updated = updateCourse(initialCourse.id, dataToValidate);
        if (updated) {
          toast.success("Curso actualizado", `"${updated.title}" ha sido guardado exitosamente.`);
          onSave(updated, false);
          onClose();
        } else {
          toast.error("Error", "No se pudo actualizar el curso.");
        }
      } else {
        const created = createCourse(dataToValidate as FormDataShape);
        toast.success(
          "Curso registrado",
          `"${created.title}" se registró con código ${created.code}.`
        );
        onSave(created, true);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error al procesar el formulario.";
      toast.error("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentMeta = STEPS[currentStep - 1];
  const progressPercent = Math.round((currentStep / 6) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Fondo oscurecido con efecto blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-void/85 backdrop-blur-md"
      />

      {/* Contenedor del Modal Asistente */}
      <motion.div
        id="course-wizard-modal"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative z-10 w-full max-w-4xl h-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] sm:h-[88vh] md:max-h-[820px] flex flex-col rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden"
      >
        {/* Header del Asistente (Fijo en la parte superior) */}
        <div className="shrink-0 border-b border-edge px-4 sm:px-7 py-3 sm:py-3.5 bg-steel/40">
          <div className="flex items-start justify-between gap-2.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-crimson-bright font-bold truncate">
                  {initialCourse ? initialCourse.code : "NUEVA ACTIVIDAD"}
                </span>
                <span className="text-ash">•</span>
                <span className="text-xs text-fog font-medium hidden sm:inline">Asistente por pasos</span>
                <Badge tone={formData.status === "in_progress" ? "azul" : "neutral"}>
                  {formData.status.toUpperCase()}
                </Badge>
              </div>
              <h2 className="mt-0.5 font-display text-base sm:text-xl font-bold text-snow truncate">
                {initialCourse ? "Editar curso o actividad formativa" : "Crear nuevo curso o actividad"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/60 text-fog hover:text-snow hover:border-crimson/50 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          {/* Barra de Progreso Dinámica */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-fog mb-1.5">
              <span className="font-medium text-snow truncate mr-2">
                Paso {currentStep} de 6 — <strong className="text-crimson-bright">{currentMeta.title}</strong>
              </span>
              <span className="font-mono text-ash shrink-0">{progressPercent}% completado</span>
            </div>
            <div className="h-1.5 w-full bg-steel/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-crimson to-crimson-bright rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Stepper horizontal interactivo (Fijo bajo la cabecera) */}
        <div className="shrink-0 flex overflow-x-auto border-b border-edge bg-carbon/95 px-2.5 sm:px-6 py-2 sm:py-2.5 text-xs scrollbar-none gap-1.5 sm:gap-3">
          {STEPS.map((s) => {
            const isCurrent = s.id === currentStep;
            const isCompleted = s.id < currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleJumpToStep(s.id)}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-xl px-2 sm:px-3 py-1.5 transition-all text-left cursor-pointer ${
                  isCurrent
                    ? "bg-crimson/20 border border-crimson/60 text-snow font-bold shadow-sm"
                    : isCompleted
                    ? "bg-steel/40 border border-edge/80 text-fog hover:text-snow hover:border-fog/50"
                    : "bg-transparent text-ash hover:text-fog opacity-70"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                    isCurrent
                      ? "bg-crimson text-snow"
                      : isCompleted
                      ? "bg-esmeralda/20 text-esmeralda border border-esmeralda/40"
                      : "bg-steel text-ash"
                  }`}
                >
                  {isCompleted ? <Icon name="check" className="h-3 w-3" /> : s.number}
                </span>
                <span className="text-[11px] font-medium hidden sm:inline">{s.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Cuerpo Central del Wizard con Transición Suave y Desplazamiento Independiente */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7">
          {/* Cabecera explicativa del Paso Actual */}
          <div className="mb-6 pb-3 border-b border-edge/60 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-steel/50 text-crimson-bright">
              <Icon name={currentMeta.icon} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-snow">
                {currentMeta.number}. {currentMeta.title}
              </h3>
              <p className="text-xs text-fog mt-0.5 leading-relaxed">{currentMeta.description}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {/* ══════════════════════════════════════════════════════
                  PASO 1: INFORMACIÓN GENERAL
              ══════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Título y Tipo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                      <span>
                        Nombre o título de la actividad <span className="text-crimson-bright">*</span>
                      </span>
                      {stepErrors.title && (
                        <span className="text-[11px] text-crimson-bright font-normal">
                          {stepErrors.title}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (stepErrors.title) setStepErrors({ ...stepErrors, title: "" });
                      }}
                      placeholder="ej. Especialización en Arquitectura Cloud & DevOps"
                      className={`field-dark py-2.5 text-xs w-full ${
                        stepErrors.title ? "border-crimson focus:border-crimson" : ""
                      }`}
                    />
                  </div>

                  {/* Selector de Tipo de Actividad en Tarjetas */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-snow">
                      Tipo de actividad formativa
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {COURSE_TYPES.map((t) => {
                        const isSelected = formData.type === t.value;
                        return (
                          <div
                            key={t.value}
                            onClick={() => setFormData({ ...formData, type: t.value })}
                            className={`flex flex-col justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-crimson bg-crimson/10 text-snow shadow-sm"
                                : "border-edge bg-carbon/50 text-fog hover:border-fog/40 hover:text-snow"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-snow">{t.label}</span>
                              <Icon
                                name={t.icon}
                                className={`h-4 w-4 ${
                                  isSelected ? "text-crimson-bright" : "text-ash"
                                }`}
                              />
                            </div>
                            <p className="text-[11px] text-fog leading-relaxed line-clamp-2">
                              {t.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categoría y Datos del Instructor */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-snow">Categoría temática</label>
                      <select
                        id="course-category-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="field-dark py-2 text-xs w-full"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                        <span>
                          Instructor / Facilitador <span className="text-crimson-bright">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.instructor}
                        onChange={(e) => {
                          setFormData({ ...formData, instructor: e.target.value });
                          if (stepErrors.instructor) setStepErrors({ ...stepErrors, instructor: "" });
                        }}
                        placeholder="ej. Ing. Víctor Herrera"
                        className={`field-dark py-2 text-xs w-full ${
                          stepErrors.instructor ? "border-crimson focus:border-crimson" : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-snow">Cargo o rol del instructor</label>
                      <input
                        type="text"
                        value={formData.instructor_role}
                        onChange={(e) =>
                          setFormData({ ...formData, instructor_role: e.target.value })
                        }
                        placeholder="ej. Director de Tecnología"
                        className="field-dark py-2 text-xs w-full"
                      />
                    </div>
                  </div>

                  {/* Descripción de la Actividad */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                      <span>
                        Descripción del curso <span className="text-crimson-bright">*</span>
                      </span>
                      {stepErrors.description && (
                        <span className="text-[11px] text-crimson-bright font-normal">
                          {stepErrors.description}
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (stepErrors.description) setStepErrors({ ...stepErrors, description: "" });
                      }}
                      placeholder="Detalla los alcances, temas principales y metodología de la actividad formativa..."
                      className={`field-dark py-2 text-xs w-full ${
                        stepErrors.description ? "border-crimson focus:border-crimson" : ""
                      }`}
                    />
                  </div>

                  {/* Objetivos de Aprendizaje Dinámicos */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-semibold text-snow">
                          Objetivos de aprendizaje
                        </label>
                        <p className="text-[11px] text-fog">Competencias que adquirirá el participante.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddObjective}
                        className="text-xs text-crimson-bright hover:text-snow flex items-center gap-1.5 cursor-pointer font-semibold px-2.5 py-1 rounded-lg border border-crimson/30 bg-crimson/10 hover:bg-crimson/20 transition-all"
                      >
                        <Icon name="plus" className="h-3 w-3" />
                        <span>Agregar objetivo</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.learning_objectives.map((obj, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ash w-6 text-right shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                            placeholder="ej. Diseñar arquitecturas resilientes sobre Kubernetes..."
                            className="field-dark py-1.5 text-xs flex-1"
                          />
                          {formData.learning_objectives.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveObjective(idx)}
                              className="text-ash hover:text-crimson-bright p-1.5 rounded-lg hover:bg-steel/50 cursor-pointer transition-colors"
                              title="Eliminar objetivo"
                            >
                              <Icon name="x" className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  PASO 2: DURACIÓN Y CRONOGRAMA
              ══════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* NOTA METODOLÓGICA DE DURACIÓN (HORAS NORMALES, NO ACADÉMICAS) */}
                  <div className="rounded-xl border border-edge bg-carbon/70 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-steel/60 border border-edge flex items-center justify-center text-gold shrink-0 mt-0.5 sm:mt-0">
                        <Icon name="clock" className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-snow">
                          Cronograma en Horas Normales (1 hora = 60 minutos)
                        </h4>
                        <p className="text-[11px] text-fog leading-relaxed">
                          La duración total y las sesiones se calculan en múltiplos de 0.25 h (15 minutos: 1h, 1.25h, 1.5h, 1.75h, etc.) para garantizar una distribución matemática exacta sin redondeos imprecisos.
                        </p>
                      </div>
                    </div>
                    <Badge tone="azul">PASO DE 15 MIN (0.25 h)</Badge>
                  </div>

                  {/* BLOQUE 1: DURACIÓN TOTAL Y RANGO DE FECHAS */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="calendar" className="h-4 w-4 text-crimson-bright" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          1. Parámetros Generales de Tiempo
                        </h4>
                      </div>
                      {isValidQuarterHour(totalRequiredHours) && (
                        <Badge tone="neutral">
                          {formatHoursHuman(totalRequiredHours)} totales
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Duración total */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-snow flex items-center justify-between">
                          <span>
                            Duración total (horas) <span className="text-crimson-bright">*</span>
                          </span>
                          <span className="font-mono text-[11px] text-gold font-bold">
                            {formatHoursHuman(totalRequiredHours)}
                          </span>
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={formData.academic_hours}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              academic_hours: val,
                            });
                            if (stepErrors.academic_hours) {
                              setStepErrors({ ...stepErrors, academic_hours: "" });
                            }
                          }}
                          className={`field-dark py-2 text-xs w-full font-mono ${
                            stepErrors.academic_hours || !isValidQuarterHour(totalRequiredHours)
                              ? "border-crimson focus:border-crimson"
                              : ""
                          }`}
                        />
                        {/* Botones rápidos de duración común */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {[8, 16, 24, 32, 48].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, academic_hours: h });
                                if (stepErrors.academic_hours) {
                                  setStepErrors({ ...stepErrors, academic_hours: "" });
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition-colors cursor-pointer ${
                                totalRequiredHours === h
                                  ? "border-crimson bg-crimson/20 text-snow"
                                  : "border-edge bg-carbon/50 text-fog hover:text-snow hover:border-fog/40"
                              }`}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                        {(!isValidQuarterHour(totalRequiredHours) || stepErrors.academic_hours) && (
                          <p className="text-[11px] text-crimson-bright leading-tight pt-0.5">
                            {stepErrors.academic_hours || "Debe ser múltiplo de 0.25 h (15 min) y mayor a 0."}
                          </p>
                        )}
                      </div>

                      {/* Fecha de inicio */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-snow">
                          Fecha de inicio <span className="text-crimson-bright">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => {
                            setFormData({ ...formData, start_date: e.target.value });
                            if (stepErrors.start_date) {
                              setStepErrors({ ...stepErrors, start_date: "" });
                            }
                          }}
                          className={`field-dark py-2 text-xs w-full ${
                            stepErrors.start_date ? "border-crimson focus:border-crimson" : ""
                          }`}
                        />
                        <p className="text-[11px] text-ash">Primera sesión del programa.</p>
                      </div>

                      {/* Fecha de fin */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-snow">
                          Fecha de fin <span className="text-crimson-bright">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => {
                            setFormData({ ...formData, end_date: e.target.value });
                            if (stepErrors.end_date) {
                              setStepErrors({ ...stepErrors, end_date: "" });
                            }
                          }}
                          className={`field-dark py-2 text-xs w-full ${
                            stepErrors.end_date ? "border-crimson focus:border-crimson" : ""
                          }`}
                        />
                        <p className="text-[11px] text-ash">Última sesión del programa.</p>
                      </div>
                    </div>

                    {stepErrors.end_date && (
                      <div className="rounded-xl border border-crimson/40 bg-crimson/10 p-3 text-xs text-crimson-bright flex items-center gap-2">
                        <Icon name="alert" className="h-4 w-4 shrink-0" />
                        <span>{stepErrors.end_date}</span>
                      </div>
                    )}

                    {availableDates.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-carbon/50 border border-edge/60 text-[11px] text-fog">
                        <span>
                          <strong className="text-snow">{availableDates.length} días</strong> en el rango calendario seleccionado ({availableDates[0]} al {availableDates[availableDates.length - 1]}).
                        </span>
                        <span className="font-mono text-ash">
                          {activeDateSet.size} días seleccionados para clases
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 2: SELECTOR INTERACTIVO DE DÍAS DE CLASE (CHIPS) */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="tag" className="h-4 w-4 text-azul" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          2. Días de Dictado (Sesiones Activas)
                        </h4>
                      </div>

                      {/* Accesos rápidos para selección de días */}
                      {availableDates.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={handleSelectAllDates}
                            className="px-2 py-1 rounded bg-carbon border border-edge text-fog hover:text-snow hover:border-fog/50 transition-colors cursor-pointer"
                          >
                            Todos ({availableDates.length})
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectWeekdays}
                            className="px-2 py-1 rounded bg-carbon border border-edge text-fog hover:text-snow hover:border-fog/50 transition-colors cursor-pointer"
                          >
                            Lunes a Viernes
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAllDates}
                            className="px-2 py-1 rounded bg-carbon border border-edge text-fog hover:text-snow hover:border-fog/50 transition-colors cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </div>
                      )}
                    </div>

                    {availableDates.length === 0 ? (
                      <div className="rounded-xl border border-edge bg-carbon/40 p-4 text-center text-xs text-fog space-y-1">
                        <p className="text-snow font-semibold">Seleccione un rango de fechas válido</p>
                        <p className="text-[11px] text-ash">
                          Ingrese la fecha de inicio y finalización para habilitar el selector de días de clase.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-fog">
                          Haz clic sobre cada día para activarlo o desactivarlo. Cada día activo tendrá asignada una sesión con horario y duración.
                        </p>
                        {/* Grilla responsiva de Chips interactivos */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-56 overflow-y-auto p-1 rounded-lg border border-edge/40 bg-carbon/40">
                          {availableDates.map((dateStr) => {
                            const info = getChipDateInfo(dateStr);
                            const isActive = activeDateSet.has(dateStr);
                            return (
                              <button
                                key={dateStr}
                                type="button"
                                role="button"
                                aria-pressed={isActive}
                                onClick={() => handleToggleDate(dateStr)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer select-none ${
                                  isActive
                                    ? "border-crimson bg-crimson/15 text-snow ring-1 ring-crimson/40 shadow-sm"
                                    : "border-edge/70 bg-carbon/60 text-ash hover:text-snow hover:border-fog/40"
                                }`}
                              >
                                <span
                                  className={`text-[10px] font-mono font-bold tracking-wider ${
                                    isActive
                                      ? "text-crimson-bright"
                                      : info.isWeekend
                                      ? "text-gold"
                                      : "text-ash"
                                  }`}
                                >
                                  {info.dayName}
                                </span>
                                <strong className="text-xs font-semibold text-snow mt-0.5">
                                  {info.dayNum} {info.month}
                                </strong>
                                <span className="mt-1 flex items-center gap-1 text-[9px]">
                                  {isActive ? (
                                    <span className="text-esmeralda font-bold">● ACTIVO</span>
                                  ) : (
                                    <span className="text-ash">○ SIN CLASE</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 3: HORARIO HABITUAL DE CLASES */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="clock" className="h-4 w-4 text-azul" />
                        <div>
                          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                            3. Horario Habitual de Clases
                          </h4>
                          <p className="text-[11px] text-fog">
                            Horario estándar que se repetirá en las sesiones del programa.
                          </p>
                        </div>
                      </div>
                      {globalScheduleValidation.valid && (
                        <Badge tone="azul">
                          {formatHoursHuman(globalScheduleValidation.durationHours)} por sesión
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
                      {/* Hora de inicio */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-fog">
                          Hora de inicio habitual
                        </label>
                        <input
                          type="time"
                          value={globalStartTime}
                          onChange={(e) => setGlobalStartTime(e.target.value)}
                          className="field-dark py-2 px-3 text-xs w-full font-mono"
                        />
                      </div>

                      {/* Hora de fin */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-fog">
                          Hora de fin habitual
                        </label>
                        <input
                          type="time"
                          value={globalEndTime}
                          onChange={(e) => setGlobalEndTime(e.target.value)}
                          className={`field-dark py-2 px-3 text-xs w-full font-mono ${
                            !globalScheduleValidation.valid ? "border-gold focus:border-gold" : ""
                          }`}
                        />
                      </div>

                      {/* Duración derivada */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-fog block">
                          Duración derivada
                        </label>
                        <div className="h-[38px] px-3.5 rounded-lg border border-edge bg-carbon/60 flex items-center justify-center font-mono text-xs font-bold text-gold">
                          {globalScheduleValidation.valid
                            ? formatHoursHuman(globalScheduleValidation.durationHours)
                            : "—"}
                        </div>
                      </div>

                      {/* Botón Aplicar */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-fog hidden md:block">
                          &nbsp;
                        </label>
                        <button
                          type="button"
                          onClick={() => handleApplyGlobalSchedule(false)}
                          disabled={!globalScheduleValidation.valid}
                          className="w-full h-[38px] inline-flex items-center justify-center gap-1.5 px-3 rounded-lg bg-azul/20 hover:bg-azul/30 border border-azul/40 text-azul-bright text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {hasCustomExceptions
                              ? "Aplicar a por defecto"
                              : "Aplicar a todas"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Si existen excepciones, botón secundario para sobrescribir todo */}
                    {hasCustomExceptions && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-carbon/40 border border-edge/60 text-xs">
                        <span className="text-fog text-[11px]">
                          Hay <strong className="text-azul-bright">{customExceptionsCount} {customExceptionsCount === 1 ? "sesión personalizada" : "sesiones personalizadas"}</strong> que no se modificarán al aplicar el horario habitual.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyGlobalSchedule(true)}
                          disabled={!globalScheduleValidation.valid}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-steel/50 hover:bg-steel border border-edge text-fog hover:text-snow text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          title="Sobrescribe todas las sesiones, incluyendo las modificadas"
                        >
                          <Icon name="refresh" className="h-3 w-3 shrink-0" />
                          <span>Aplicar a todas (incluir excepciones)</span>
                        </button>
                      </div>
                    )}

                    {/* Alerta de error si el horario habitual no es válido */}
                    {!globalScheduleValidation.valid && (
                      <div className="rounded-lg border border-gold/40 bg-gold/10 p-2.5 text-xs text-gold flex items-center gap-2">
                        <Icon name="alert" className="h-4 w-4 shrink-0" />
                        <span>{globalScheduleValidation.error || "El horario habitual no es válido."}</span>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 4: RESUMEN DE BALANCE Y REDISTRIBUCIÓN AUTOMÁTICA */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="chart" className="h-4 w-4 text-esmeralda" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          4. Balance de Distribución de Horas
                        </h4>
                      </div>

                      {/* Botón de Redistribución Automática */}
                      <button
                        type="button"
                        onClick={handleRedistributeHours}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/40 bg-gold/15 text-gold hover:bg-gold/25 hover:text-snow text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Icon name="bolt" className="h-3.5 w-3.5 shrink-0" />
                        <span>Redistribuir horas automáticamente</span>
                      </button>
                    </div>

                    {/* Tarjetas de Indicadores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-carbon/60 border border-edge space-y-1">
                        <span className="text-[11px] text-fog block">Total requerido:</span>
                        <strong className="text-snow text-base font-mono block">
                          {formatHoursHuman(totalRequiredHours)}
                        </strong>
                        <span className="text-[10px] text-ash font-mono">
                          {totalRequiredUnits} unidades (15m)
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-carbon/60 border border-edge space-y-1">
                        <span className="text-[11px] text-fog block">Total asignado:</span>
                        <strong
                          className={`text-base font-mono block ${
                            assignedUnits === totalRequiredUnits ? "text-esmeralda" : "text-gold"
                          }`}
                        >
                          {formatHoursHuman(assignedHours)}
                        </strong>
                        <span className="text-[10px] text-ash font-mono">
                          {assignedUnits} unidades (15m)
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-carbon/60 border border-edge space-y-1">
                        <span className="text-[11px] text-fog block">Sesiones activas:</span>
                        <strong className="text-snow text-base font-mono block">
                          {formData.sessions?.length || 0} clases
                        </strong>
                        <span className="text-[10px] text-ash">días programados</span>
                      </div>

                      <div className="p-3 rounded-lg bg-carbon/60 border border-edge flex flex-col justify-between space-y-1">
                        <span className="text-[11px] text-fog block">Estado balance:</span>
                        <div>
                          {assignedUnits === totalRequiredUnits && totalRequiredUnits > 0 ? (
                            <Badge tone="esmeralda">✓ SUMA EXACTA</Badge>
                          ) : assignedUnits < totalRequiredUnits ? (
                            <Badge tone="gold">
                              FALTA {formatHoursHuman(totalRequiredHours - assignedHours)}
                            </Badge>
                          ) : (
                            <Badge tone="crimson">
                              EXCESO {formatHoursHuman(assignedHours - totalRequiredHours)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Descuadre si no coinciden */}
                    {totalRequiredUnits > 0 && assignedUnits !== totalRequiredUnits && (
                      <div className="rounded-xl border border-gold/40 bg-gold/10 p-3.5 text-xs text-gold space-y-2">
                        <div className="flex items-start gap-2.5">
                          <Icon name="alert" className="h-4 w-4 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {assignedUnits < totalRequiredUnits
                                ? `Faltan ${formatHoursHuman(
                                    totalRequiredHours - assignedHours
                                  )} por distribuir entre las sesiones.`
                                : `Hay un exceso de ${formatHoursHuman(
                                    assignedHours - totalRequiredHours
                                  )} respecto a las ${formatHoursHuman(totalRequiredHours)} requeridas.`}
                            </p>
                            <p className="text-[11px] text-fog leading-relaxed">
                              Para nivelar la duración total y poder avanzar, dispones de las siguientes opciones:
                            </p>
                          </div>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 text-[11px] text-fog list-disc">
                          <li>Ajustar las horas en el <strong>Horario Habitual</strong> y volver a aplicar.</li>
                          <li>Configurar <strong>excepciones puntuales</strong> pulsando «Cambiar» en las sesiones abajo.</li>
                          <li>Pulsar <strong>«⚡ Redistribuir horas automáticamente»</strong> para un prorrateo exacto.</li>
                          <li>Modificar la <strong>duración total del curso</strong> en el Bloque 1 si el alcance cambió.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 5: DETALLE Y HORARIO POR SESIÓN */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="clock" className="h-4 w-4 text-gold" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          5. Detalle y Horario por Sesión ({formData.sessions?.length || 0})
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCustomExceptions && (
                          <Badge tone="azul">
                            {customExceptionsCount} {customExceptionsCount === 1 ? "excepción" : "excepciones"}
                          </Badge>
                        )}
                        <span className="text-[11px] text-ash">
                          {formData.sessions?.length || 0} programadas
                        </span>
                      </div>
                    </div>

                    {!formData.sessions || formData.sessions.length === 0 ? (
                      <div className="rounded-xl border border-edge bg-carbon/40 p-5 text-center text-xs text-fog space-y-2">
                        <Icon name="calendar" className="h-6 w-6 text-ash mx-auto" />
                        <p className="text-snow font-semibold">No hay sesiones activas en este momento</p>
                        <p className="text-[11px] text-ash max-w-md mx-auto">
                          Activa fechas de clase en el calendario arriba o pulsa el botón «Redistribuir horas automáticamente» para crearlas.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* TABLA COMPACTA PARA ESCRITORIO (md: y superior, >=768px) */}
                        <div className="hidden md:block overflow-hidden rounded-xl border border-edge bg-carbon/60">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-edge/80 bg-steel/30 text-[11px] text-fog uppercase font-mono tracking-wider">
                                <th className="py-2.5 px-3 w-12 text-center">#</th>
                                <th className="py-2.5 px-3">Fecha</th>
                                <th className="py-2.5 px-3">Duración</th>
                                <th className="py-2.5 px-3">Horario</th>
                                <th className="py-2.5 px-3 text-right">Estado / Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-edge/40">
                              {formData.sessions.map((s, idx) => {
                                const isEditing = editingSessionDate === s.date;
                                const shortDate = getSessionShortLabel(s.date);
                                const tempVal = isEditing ? validateScheduleTimes(tempStartTime, tempEndTime) : null;

                                if (isEditing) {
                                  return (
                                    <tr
                                      key={s.date}
                                      data-session-card="true"
                                      data-session-row="true"
                                      className="bg-steel/30"
                                    >
                                      <td className="py-3 px-3 text-center font-mono font-bold text-snow">
                                        {String(idx + 1).padStart(2, "0")}
                                      </td>
                                      <td className="py-3 px-3 font-semibold text-snow whitespace-nowrap">
                                        {shortDate}
                                        <span className="block text-[10px] text-ash font-mono">{s.date}</span>
                                      </td>
                                      <td className="py-3 px-3 whitespace-nowrap">
                                        <span className="font-mono font-bold text-gold">
                                          {tempVal?.valid ? formatHoursHuman(tempVal.durationHours) : "—"}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="time"
                                            value={tempStartTime}
                                            onChange={(e) => setTempStartTime(e.target.value)}
                                            className="field-dark py-1 px-2 text-xs font-mono w-24"
                                          />
                                          <span className="text-ash">–</span>
                                          <input
                                            type="time"
                                            value={tempEndTime}
                                            onChange={(e) => setTempEndTime(e.target.value)}
                                            className={`field-dark py-1 px-2 text-xs font-mono w-24 ${
                                              !tempVal?.valid ? "border-gold" : ""
                                            }`}
                                          />
                                        </div>
                                        {!tempVal?.valid && (
                                          <span className="text-[10px] text-gold block mt-0.5">
                                            {tempVal?.error || "Horario inválido"}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveSessionException(s.date)}
                                            disabled={!tempVal?.valid}
                                            className="px-2.5 py-1 rounded bg-azul/20 hover:bg-azul/30 border border-azul/40 text-azul-bright text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                          >
                                            Guardar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelEditingSession}
                                            className="px-2 py-1 rounded bg-carbon hover:bg-steel border border-edge text-fog hover:text-snow text-[11px] transition-colors cursor-pointer"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr
                                    key={s.date}
                                    data-session-card="true"
                                    data-session-row="true"
                                    className="hover:bg-steel/20 transition-colors"
                                  >
                                    <td className="py-2.5 px-3 text-center font-mono text-ash text-[11px]">
                                      {String(idx + 1).padStart(2, "0")}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-snow whitespace-nowrap">
                                      {shortDate}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-gold whitespace-nowrap font-medium">
                                      {formatHoursHuman(s.duration)}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-fog whitespace-nowrap">
                                      {s.start_time} – {s.end_time}
                                    </td>
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-2">
                                        {s.is_custom ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-azul/20 text-azul border border-azul/40">
                                            Modificado
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-steel/40 text-fog border border-edge">
                                            Por defecto
                                          </span>
                                        )}

                                        {s.is_custom && (
                                          <button
                                            type="button"
                                            onClick={() => handleRestoreSessionToDefault(s.date)}
                                            className="text-[11px] text-ash hover:text-gold transition-colors cursor-pointer underline underline-offset-2"
                                            title="Restablecer al horario habitual"
                                          >
                                            Restaurar
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleStartEditingSession(s)}
                                          className="px-2 py-1 rounded bg-steel/40 hover:bg-steel/80 border border-edge/60 text-[11px] text-snow font-medium transition-colors cursor-pointer"
                                        >
                                          Cambiar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleToggleDate(s.date)}
                                          className="text-ash hover:text-crimson-bright p-1 rounded transition-colors cursor-pointer"
                                          title="Quitar sesión"
                                        >
                                          <Icon name="x" className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* TARJETAS COMPACTAS PARA MÓVIL (<768px: md:hidden) */}
                        <div className="md:hidden space-y-2.5 max-h-96 overflow-y-auto pr-1">
                          {formData.sessions.map((s, idx) => {
                            const isEditing = editingSessionDate === s.date;
                            const shortDate = getSessionShortLabel(s.date);
                            const tempVal = isEditing ? validateScheduleTimes(tempStartTime, tempEndTime) : null;

                            return (
                              <div
                                key={s.date}
                                data-session-card="true"
                                className={`rounded-xl border p-3 space-y-2 transition-colors ${
                                  isEditing
                                    ? "border-azul/50 bg-steel/30"
                                    : s.is_custom
                                    ? "border-azul/30 bg-carbon/70"
                                    : "border-edge bg-carbon/60"
                                }`}
                              >
                                {/* Cabecera de tarjeta */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-ash">
                                      #{String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <strong className="text-xs font-semibold text-snow">{shortDate}</strong>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {s.is_custom ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-azul/20 text-azul border border-azul/40">
                                        Modificado
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-steel/40 text-fog border border-edge">
                                        Por defecto
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDate(s.date)}
                                      className="text-ash hover:text-crimson-bright p-1 rounded transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Quitar sesión"
                                    >
                                      <Icon name="x" className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Contenido / Modo edición */}
                                {isEditing ? (
                                  <div className="space-y-2 pt-1 border-t border-edge/50">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] text-fog block mb-0.5">Inicio</label>
                                        <input
                                          type="time"
                                          value={tempStartTime}
                                          onChange={(e) => setTempStartTime(e.target.value)}
                                          className="field-dark py-1.5 px-2 text-xs font-mono w-full min-h-[38px]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-fog block mb-0.5">Fin</label>
                                        <input
                                          type="time"
                                          value={tempEndTime}
                                          onChange={(e) => setTempEndTime(e.target.value)}
                                          className={`field-dark py-1.5 px-2 text-xs font-mono w-full min-h-[38px] ${
                                            !tempVal?.valid ? "border-gold" : ""
                                          }`}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-1">
                                      <span className="text-[11px] text-fog">Duración derivada:</span>
                                      <span className="font-mono font-bold text-gold">
                                        {tempVal?.valid ? formatHoursHuman(tempVal.durationHours) : "—"}
                                      </span>
                                    </div>

                                    {!tempVal?.valid && (
                                      <p className="text-[10px] text-gold">{tempVal?.error || "Horario inválido"}</p>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveSessionException(s.date)}
                                        disabled={!tempVal?.valid}
                                        className="flex-1 py-2 rounded-lg bg-azul/20 hover:bg-azul/30 border border-azul/40 text-azul-bright text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[38px]"
                                      >
                                        Guardar excepción
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditingSession}
                                        className="px-3 py-2 rounded-lg bg-carbon hover:bg-steel border border-edge text-fog hover:text-snow text-xs transition-colors cursor-pointer min-h-[38px]"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between pt-1 border-t border-edge/30 text-xs">
                                    <div className="flex items-center gap-2 font-mono">
                                      <span className="text-snow font-bold">{s.start_time} – {s.end_time}</span>
                                      <span className="text-gold">({formatHoursHuman(s.duration)})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {s.is_custom && (
                                        <button
                                          type="button"
                                          onClick={() => handleRestoreSessionToDefault(s.date)}
                                          className="text-[11px] text-ash hover:text-gold transition-colors cursor-pointer underline underline-offset-2 min-h-[36px] flex items-center"
                                        >
                                          Restaurar
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditingSession(s)}
                                        className="px-2.5 py-1.5 rounded bg-steel/40 hover:bg-steel border border-edge text-xs text-snow font-medium transition-colors cursor-pointer min-h-[36px] flex items-center"
                                      >
                                        Cambiar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE 6: RESUMEN DE HORARIO Y FRECUENCIA */}
                  <div className="rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-snow">
                        6. Resumen de Horario y Frecuencia
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSummary}
                        className="text-xs text-azul hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Icon name="refresh" className="h-3.5 w-3.5" />
                        <span>Autogenerar resumen</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.schedule_summary}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule_summary: e.target.value })
                      }
                      placeholder="ej. Lunes a Viernes 19:00 - 22:30 (GMT-5)"
                      className="field-dark py-2.5 text-xs w-full"
                    />
                    <p className="text-[11px] text-fog leading-relaxed">
                      Texto descriptivo que verán los participantes sobre los días de dictado, horario y zona horaria.
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  PASO 3: MODALIDAD Y CAPACIDAD
              ══════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Modalidades en Tarjetas */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-snow">
                      Modalidad de dictado
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {MODALITIES.map((mod) => {
                        const isSelected = formData.modality === mod.value;
                        return (
                          <div
                            key={mod.value}
                            onClick={() => setFormData({ ...formData, modality: mod.value })}
                            className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "border-azul bg-azul/10 text-snow shadow-sm"
                                : "border-edge bg-carbon/50 text-fog hover:border-fog/40 hover:text-snow"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-snow">{mod.label}</span>
                              <Icon
                                name={mod.icon}
                                className={`h-4 w-4 ${
                                  isSelected ? "text-azul" : "text-ash"
                                }`}
                              />
                            </div>
                            <p className="text-[11px] text-fog leading-relaxed">{mod.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campos dependientes de modalidad */}
                  <div className="space-y-4">
                    {(formData.modality === "presencial" || formData.modality === "hibrida") && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                          <span>
                            Dirección física / Sede / Aula <span className="text-crimson-bright">*</span>
                          </span>
                          {stepErrors.location && (
                            <span className="text-[11px] text-crimson-bright font-normal">
                              {stepErrors.location}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => {
                            setFormData({ ...formData, location: e.target.value });
                            if (stepErrors.location) setStepErrors({ ...stepErrors, location: "" });
                          }}
                          placeholder="ej. Sede Central Horizen TI — Auditorio Principal, Av. Javier Prado Este..."
                          className={`field-dark py-2 text-xs w-full ${
                            stepErrors.location ? "border-crimson focus:border-crimson" : ""
                          }`}
                        />
                      </div>
                    )}

                    {(formData.modality === "virtual" || formData.modality === "hibrida") && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                          <span>
                            Plataforma / Enlace de acceso virtual{" "}
                            <span className="text-crimson-bright">*</span>
                          </span>
                          {stepErrors.platform_link && (
                            <span className="text-[11px] text-crimson-bright font-normal">
                              {stepErrors.platform_link}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={formData.platform_link}
                          onChange={(e) => {
                            setFormData({ ...formData, platform_link: e.target.value });
                            if (stepErrors.platform_link)
                              setStepErrors({ ...stepErrors, platform_link: "" });
                          }}
                          placeholder="ej. https://campus.horizenti.com/aulas/cloud-devops"
                          className={`field-dark py-2 text-xs w-full ${
                            stepErrors.platform_link ? "border-crimson focus:border-crimson" : ""
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Capacidad y Aforo */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-semibold text-snow">
                      Control de aforo y cupos
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opción Ilimitada */}
                      <div
                        onClick={() => setFormData({ ...formData, unlimited_capacity: true })}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          formData.unlimited_capacity
                            ? "border-esmeralda bg-esmeralda/10 text-snow"
                            : "border-edge bg-carbon/50 text-fog hover:border-fog/40"
                        }`}
                      >
                        <Icon
                          name="globe"
                          className={`h-4 w-4 ${
                            formData.unlimited_capacity ? "text-esmeralda" : "text-ash"
                          }`}
                        />
                        <div>
                          <span className="text-xs font-bold text-snow block">Capacidad ilimitada</span>
                          <span className="text-[11px] text-fog">Sin restricción de aforo de inscritos.</span>
                        </div>
                      </div>

                      {/* Opción Con Cupos */}
                      <div
                        onClick={() => setFormData({ ...formData, unlimited_capacity: false })}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          !formData.unlimited_capacity
                            ? "border-azul bg-azul/10 text-snow"
                            : "border-edge bg-carbon/50 text-fog hover:border-fog/40"
                        }`}
                      >
                        <Icon
                          name="users"
                          className={`h-4 w-4 ${
                            !formData.unlimited_capacity ? "text-azul" : "text-ash"
                          }`}
                        />
                        <div>
                          <span className="text-xs font-bold text-snow block">Cupos limitados</span>
                          <span className="text-[11px] text-fog">Número máximo de vacantes permitidas.</span>
                        </div>
                      </div>
                    </div>

                    {/* Campo de Cupos Máximos si no es ilimitada */}
                    {!formData.unlimited_capacity && (
                      <div className="p-3.5 rounded-xl border border-edge bg-steel/30 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold text-snow block">
                            Cupos máximos de participación <span className="text-crimson-bright">*</span>
                          </span>
                          <p className="text-[11px] text-fog">
                            Límite de registros para garantizar el control académico.
                          </p>
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={formData.max_capacity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_capacity: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="field-dark py-1.5 px-3 text-xs w-28 text-center font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  PASO 4: ASISTENCIA Y EVALUACIÓN
              ══════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* BLOQUE A: ASISTENCIA */}
                  <div className="space-y-3.5 rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5">
                    <div className="flex items-center gap-2 border-b border-edge/60 pb-2.5">
                      <Icon name="check" className="h-4 w-4 text-esmeralda" />
                      <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                        Bloque 1: Reglas de Asistencia
                      </h4>
                    </div>

                    <ToggleSwitch
                      checked={formData.attendance_mandatory}
                      onChange={(val) => setFormData({ ...formData, attendance_mandatory: val })}
                      label="Asistencia obligatoria"
                      description="Se registrará y auditará la asistencia en cada sesión del cronograma."
                      accentColor="esmeralda"
                    />

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-snow">Porcentaje mínimo de asistencia:</span>
                        <span className="font-mono text-esmeralda font-bold text-sm">
                          {formData.min_attendance_percentage}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.min_attendance_percentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_attendance_percentage: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-esmeralda cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-ash font-mono">
                        <span>0%</span>
                        <span>50%</span>
                        <span>80% (Recomendado)</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE B: EVALUACIÓN */}
                  <div className="space-y-3.5 rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5">
                    <div className="flex items-center gap-2 border-b border-edge/60 pb-2.5">
                      <Icon name="chart" className="h-4 w-4 text-gold" />
                      <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                        Bloque 2: Evaluación y Aprobación
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <ToggleSwitch
                        checked={formData.requires_evaluation}
                        onChange={(val) => setFormData({ ...formData, requires_evaluation: val })}
                        label="Requiere examen o evaluación técnica"
                        description="Se aplicará una prueba de conocimientos teóricos o prácticos."
                        accentColor="gold"
                      />

                      {formData.requires_evaluation && (
                        <div className="p-3.5 rounded-xl border border-edge bg-carbon/50 flex items-center justify-between gap-4 ml-1">
                          <div>
                            <span className="text-xs font-semibold text-snow block">
                              Nota mínima aprobatoria (Escala 0 a 20):
                            </span>
                            <span className="text-[11px] text-fog">
                              Calificación mínima vigesimal exigida para aprobar.
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.min_passing_grade}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                min_passing_grade: Math.min(
                                  20,
                                  Math.max(0, parseInt(e.target.value, 10) || 0)
                                ),
                              })
                            }
                            className="field-dark py-1.5 px-3 text-xs w-24 text-center font-mono font-bold"
                          />
                        </div>
                      )}

                      <ToggleSwitch
                        checked={formData.requires_final_project}
                        onChange={(val) =>
                          setFormData({ ...formData, requires_final_project: val })
                        }
                        label="Requiere proyecto final integrador"
                        description="Los participantes deben entregar y sustentar un caso o prototipo real."
                        accentColor="azul"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  PASO 5: CLAUSURA Y CERTIFICACIÓN
              ══════════════════════════════════════════════════════ */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {/* BLOQUE A: EVENTO DE CLAUSURA */}
                  <div className="space-y-3.5 rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5">
                    <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="calendar" className="h-4 w-4 text-crimson-bright" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          Bloque 1: Evento o Ceremonia de Clausura
                        </h4>
                      </div>
                      <Badge tone={formData.closing_event.enabled ? "esmeralda" : "neutral"}>
                        {formData.closing_event.enabled ? "CON CLAUSURA" : "SIN CLAUSURA"}
                      </Badge>
                    </div>

                    <ToggleSwitch
                      checked={formData.closing_event.enabled}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          closing_event: {
                            ...formData.closing_event,
                            enabled: val,
                          },
                        })
                      }
                      label="¿Incluye ceremonia o evento de clausura?"
                      description="Habilita un hito final como demoday, entrega de reconocimientos o cierre oficial."
                      accentColor="crimson"
                    />

                    {formData.closing_event.enabled && (
                      <div className="space-y-3.5 pt-2 border-t border-edge/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-snow">
                              Título del evento de cierre <span className="text-crimson-bright">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.closing_event.title}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  closing_event: {
                                    ...formData.closing_event,
                                    title: e.target.value,
                                  },
                                })
                              }
                              placeholder="ej. Demoday & Ceremonia Oficial de Clausura"
                              className="field-dark py-2 text-xs w-full"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-snow">Modalidad de cierre</label>
                            <select
                              value={formData.closing_event.modality}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  closing_event: {
                                    ...formData.closing_event,
                                    modality: e.target.value as Modality,
                                  },
                                })
                              }
                              className="field-dark py-2 text-xs w-full"
                            >
                              {MODALITIES.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-snow">
                              Fecha del evento <span className="text-crimson-bright">*</span>
                            </label>
                            <input
                              type="date"
                              value={formData.closing_event.date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  closing_event: {
                                    ...formData.closing_event,
                                    date: e.target.value,
                                  },
                                })
                              }
                              className="field-dark py-2 text-xs w-full"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-snow">Horario de clausura</label>
                            <input
                              type="text"
                              value={formData.closing_event.time}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  closing_event: {
                                    ...formData.closing_event,
                                    time: e.target.value,
                                  },
                                })
                              }
                              placeholder="ej. 10:00 - 13:00 (GMT-5)"
                              className="field-dark py-2 text-xs w-full"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-snow">
                            Sede física o enlace del evento
                          </label>
                          <input
                            type="text"
                            value={
                              formData.closing_event.modality === "presencial"
                                ? formData.closing_event.location
                                : formData.closing_event.platform_link
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                closing_event: {
                                  ...formData.closing_event,
                                  location: e.target.value,
                                  platform_link: e.target.value,
                                },
                              })
                            }
                            placeholder={
                              formData.closing_event.modality === "presencial"
                                ? "ej. Auditorio Principal Horizen TI"
                                : "ej. https://campus.horizenti.com/eventos/clausura"
                            }
                            className="field-dark py-2 text-xs w-full"
                          />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={formData.closing_event.mandatory_attendance}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                closing_event: {
                                  ...formData.closing_event,
                                  mandatory_attendance: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 rounded border-edge bg-steel/60 text-crimson accent-crimson focus:ring-0"
                          />
                          <span className="text-xs font-semibold text-snow">
                            Asistencia obligatoria al evento de cierre para culminar el curso
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* BLOQUE B: CERTIFICACIÓN */}
                  <div id="section-h" className="space-y-3.5 rounded-xl border border-edge/80 bg-steel/20 p-4 sm:p-5">
                    <div className="flex items-center justify-between border-b border-edge/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Icon name="certificate" className="h-4 w-4 text-gold" />
                        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-snow">
                          Bloque 2: Acreditación y Certificados
                        </h4>
                      </div>
                      <Badge tone={formData.certification.enabled ? "esmeralda" : "neutral"}>
                        {formData.certification.enabled ? "EMITE CERTIFICADO" : "SIN CERTIFICADO"}
                      </Badge>
                    </div>

                    {/* Tarjetas de Selección de Certificación */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-snow">
                        ¿Este curso permite obtener un certificado oficial de Horizen TI?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              certification: {
                                ...formData.certification,
                                enabled: true,
                                template_id:
                                  formData.certification.template_id ||
                                  activeTemplates[0]?.id ||
                                  "",
                              },
                            });
                          }}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-xs font-bold transition-all cursor-pointer ${
                            formData.certification.enabled
                              ? "border-esmeralda bg-esmeralda/15 text-esmeralda shadow-sm"
                              : "border-edge bg-carbon/60 text-fog hover:text-snow hover:border-fog/40"
                          }`}
                        >
                          <Icon name="check" className="h-4 w-4 shrink-0" />
                          <span>SÍ, EMITE CERTIFICADO</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              certification: {
                                ...formData.certification,
                                enabled: false,
                              },
                            });
                          }}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-xs font-bold transition-all cursor-pointer ${
                            !formData.certification.enabled
                              ? "border-edge bg-steel/80 text-snow shadow-sm"
                              : "border-edge bg-carbon/60 text-fog hover:text-snow hover:border-fog/40"
                          }`}
                        >
                          <Icon name="x" className="h-4 w-4 shrink-0" />
                          <span>NO EMITE CERTIFICADO</span>
                        </button>
                      </div>
                    </div>

                    {formData.certification.enabled ? (
                      <div className="space-y-4 pt-2">
                        {/* Selector de plantilla activa */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-snow flex flex-wrap items-center justify-between gap-1">
                            <span>Plantilla oficial vinculada</span>
                            <span className="text-[11px] text-ash">
                              Solo plantillas activas son elegibles
                            </span>
                          </label>

                          {activeTemplates.length === 0 ? (
                            <div className="rounded-xl border border-gold/40 bg-gold/10 p-3.5 text-xs text-gold">
                              No existen plantillas con estado &quot;Activa&quot; en el sistema.
                              Ingresa a <strong>Gestión de Certificados</strong> para activar una plantilla antes de vincularla.
                            </div>
                          ) : (
                            <select
                              value={formData.certification.template_id}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  certification: {
                                    ...formData.certification,
                                    template_id: e.target.value,
                                  },
                                })
                              }
                              className="field-dark py-2 text-xs w-full"
                            >
                              <option value="">-- Selecciona una plantilla activa --</option>
                              {availableTemplates.map((tpl) => {
                                const isActive = tpl.status === "active";
                                return (
                                  <option
                                    key={tpl.id}
                                    value={tpl.id}
                                    disabled={!isActive}
                                    className={isActive ? "text-snow" : "text-ash bg-void"}
                                  >
                                    {tpl.name} — {tpl.category} ({isActive ? "Activa" : `No elegible: ${tpl.status}`})
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>

                        {/* Previsualización en vivo de la plantilla seleccionada */}
                        {selectedTemplate && (
                          <div className="rounded-xl border border-edge bg-steel/40 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] text-crimson-bright uppercase font-bold">
                                Plantilla seleccionada
                              </span>
                              <Badge tone="esmeralda">Activa v{selectedTemplate.version}</Badge>
                            </div>
                            <p className="font-display font-semibold text-snow text-sm">
                              {selectedTemplate.name}
                            </p>
                            <p className="text-xs text-fog leading-relaxed italic">
                              &quot;{selectedTemplate.diploma_text}&quot;
                            </p>
                            <div className="flex flex-wrap gap-4 pt-1.5 text-[11px] text-ash border-t border-edge/60">
                              <span>
                                <strong>Emisor:</strong> {selectedTemplate.issuing_entity}
                              </span>
                              <span>
                                <strong>Firmante:</strong> {selectedTemplate.signatory_name} ({selectedTemplate.signatory_role})
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Criterios de acreditación */}
                        <div className="space-y-2.5 pt-1">
                          <p className="text-xs font-semibold text-snow">
                            Criterios exigidos al participante para obtener el diploma:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label className="flex items-center gap-2.5 rounded-lg border border-edge bg-carbon/50 p-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.certification.require_pass_evaluation}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    certification: {
                                      ...formData.certification,
                                      require_pass_evaluation: e.target.checked,
                                    },
                                  })
                                }
                                className="h-4 w-4 rounded border-edge bg-steel/60 text-crimson accent-crimson focus:ring-0"
                              />
                              <span className="text-xs text-snow">Aprobación de la evaluación técnica</span>
                            </label>

                            <label className="flex items-center gap-2.5 rounded-lg border border-edge bg-carbon/50 p-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.certification.require_final_project}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    certification: {
                                      ...formData.certification,
                                      require_final_project: e.target.checked,
                                    },
                                  })
                                }
                                className="h-4 w-4 rounded border-edge bg-steel/60 text-crimson accent-crimson focus:ring-0"
                              />
                              <span className="text-xs text-snow">Entrega y sustentación de proyecto</span>
                            </label>

                            {formData.closing_event.enabled && (
                              <label className="flex items-center gap-2.5 rounded-lg border border-edge bg-carbon/50 p-2.5 cursor-pointer sm:col-span-2">
                                <input
                                  type="checkbox"
                                  checked={formData.certification.require_closing_event}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      certification: {
                                        ...formData.certification,
                                        require_closing_event: e.target.checked,
                                      },
                                    })
                                  }
                                  className="h-4 w-4 rounded border-edge bg-steel/60 text-crimson accent-crimson focus:ring-0"
                                />
                                <span className="text-xs text-snow">Asistencia obligatoria a la ceremonia de cierre</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-edge bg-carbon/40 p-3.5 text-xs text-fog leading-relaxed">
                        Esta actividad se registrará como capacitación interna{" "}
                        <strong>sin emisión de diploma oficial</strong> ni verificación pública mediante código QR.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  PASO 6: REVISIÓN Y CONFIRMACIÓN
              ══════════════════════════════════════════════════════ */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-edge bg-steel/30 p-4 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs uppercase text-crimson-bright font-bold">
                        Ficha Técnica Preliminar
                      </span>
                      <h4 className="font-display font-bold text-snow text-base mt-0.5">
                        {formData.title || "(Sin título definido)"}
                      </h4>
                    </div>
                    <Badge tone={formData.status === "in_progress" ? "azul" : "neutral"}>
                      {formData.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Resumen por Bloques */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Bloque 1: General */}
                    <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon name="info" className="h-4 w-4 text-crimson-bright" />
                          <span className="text-xs font-bold uppercase tracking-wider text-snow">
                            1. Información General
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToStep(1)}
                          className="text-xs text-crimson-bright hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-fog pt-1">
                        <div>
                          <span className="text-ash block text-[11px]">Tipo de actividad:</span>
                          <strong className="text-snow">
                            {COURSE_TYPES.find((t) => t.value === formData.type)?.label || formData.type}
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Categoría:</span>
                          <strong className="text-snow">{formData.category}</strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Instructor:</span>
                          <strong className="text-snow">
                            {formData.instructor}{" "}
                            {formData.instructor_role ? `(${formData.instructor_role})` : ""}
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Objetivos de aprendizaje:</span>
                          <strong className="text-snow">
                            {formData.learning_objectives.filter(Boolean).length} objetivo(s) configurado(s)
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Cronograma */}
                    <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon name="clock" className="h-4 w-4 text-gold" />
                          <span className="text-xs font-bold uppercase tracking-wider text-snow">
                            2. Duración y Cronograma
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToStep(2)}
                          className="text-xs text-gold hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-fog pt-1">
                        <div>
                          <span className="text-ash block text-[11px]">Duración total:</span>
                          <strong className="text-snow">
                            {formatHoursHuman(Number(formData.academic_hours))} ({formData.academic_hours} h)
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Sesiones planificadas:</span>
                          <strong className="text-snow">
                            {formData.sessions?.length || formData.sessions_count} clases
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Periodo de ejecución:</span>
                          <strong className="text-snow">
                            {formData.start_date || "—"} al {formData.end_date || "—"}
                          </strong>
                        </div>
                        <div className="sm:col-span-3">
                          <span className="text-ash block text-[11px]">Frecuencia y horario:</span>
                          <strong className="text-snow">
                            {formData.schedule_summary || "Horario flexible / por coordinar"}
                          </strong>
                        </div>
                      </div>

                      {/* Lista resumida de sesiones */}
                      {formData.sessions && formData.sessions.length > 0 && (
                        <div className="pt-2 border-t border-edge/40 space-y-1.5">
                          <span className="text-[11px] font-semibold text-ash block">
                            Detalle de las {formData.sessions.length} clases programadas:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {formData.sessions.map((s, idx) => (
                              <div
                                key={s.date}
                                className="flex items-center justify-between p-2 rounded bg-steel/30 border border-edge/50 text-[11px]"
                              >
                                <span className="text-snow font-mono">
                                  #{idx + 1} {s.date}
                                </span>
                                <span className="text-fog">
                                  {formatHoursHuman(s.duration)} ({s.start_time} - {s.end_time})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bloque 3: Modalidad */}
                    <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon name="globe" className="h-4 w-4 text-azul" />
                          <span className="text-xs font-bold uppercase tracking-wider text-snow">
                            3. Modalidad y Capacidad
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToStep(3)}
                          className="text-xs text-azul hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-fog pt-1">
                        <div>
                          <span className="text-ash block text-[11px]">Modalidad:</span>
                          <strong className="text-snow capitalize">{formData.modality}</strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Aforo / Capacidad:</span>
                          <strong className="text-snow">
                            {formData.unlimited_capacity
                              ? "Capacidad Ilimitada"
                              : `${formData.max_capacity} cupos máximos`}
                          </strong>
                        </div>
                        {formData.location && (
                          <div className="sm:col-span-2">
                            <span className="text-ash block text-[11px]">Sede física:</span>
                            <strong className="text-snow">{formData.location}</strong>
                          </div>
                        )}
                        {formData.platform_link && (
                          <div className="sm:col-span-2">
                            <span className="text-ash block text-[11px]">Acceso virtual:</span>
                            <strong className="text-snow font-mono text-[11px] truncate block">
                              {formData.platform_link}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bloque 4: Asistencia y Evaluación */}
                    <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon name="chart" className="h-4 w-4 text-esmeralda" />
                          <span className="text-xs font-bold uppercase tracking-wider text-snow">
                            4. Asistencia y Evaluación
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToStep(4)}
                          className="text-xs text-esmeralda hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-fog pt-1">
                        <div>
                          <span className="text-ash block text-[11px]">Asistencia mínima:</span>
                          <strong className="text-snow">
                            {formData.attendance_mandatory
                              ? `${formData.min_attendance_percentage}% (Obligatoria)`
                              : "No obligatoria"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Examen técnico:</span>
                          <strong className="text-snow">
                            {formData.requires_evaluation
                              ? `Sí (Nota mínima: ${formData.min_passing_grade}/20)`
                              : "No requiere"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Proyecto final:</span>
                          <strong className="text-snow">
                            {formData.requires_final_project ? "Requerido" : "No requiere"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 5: Clausura y Certificación */}
                    <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-edge/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Icon name="certificate" className="h-4 w-4 text-gold" />
                          <span className="text-xs font-bold uppercase tracking-wider text-snow">
                            5. Clausura y Certificación
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJumpToStep(5)}
                          className="text-xs text-gold hover:text-snow flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-fog pt-1">
                        <div>
                          <span className="text-ash block text-[11px]">Ceremonia de clausura:</span>
                          <strong className="text-snow">
                            {formData.closing_event.enabled
                              ? `Sí (${formData.closing_event.title || "Evento"} el ${
                                  formData.closing_event.date || "por definir"
                                })`
                              : "Sin evento de clausura"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-ash block text-[11px]">Certificado oficial:</span>
                          <strong className="text-snow">
                            {formData.certification.enabled
                              ? `Sí — ${selectedTemplate?.name || "Plantilla vinculada"}`
                              : "Sin acreditación oficial"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Estado Inicial de la Actividad */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-edge bg-steel/30 p-4">
                    <div>
                      <label className="text-xs font-semibold text-snow block">
                        Estado de la actividad al registrar
                      </label>
                      <p className="text-[11px] text-fog">
                        Fase de publicación y ciclo de vida operativo del curso.
                      </p>
                    </div>
                    <select
                      id="course-status-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as CourseStatus })
                      }
                      className="field-dark py-2 px-3 text-xs w-auto cursor-pointer font-semibold"
                    >
                      <option value="draft">Borrador (draft)</option>
                      <option value="scheduled">Programado (scheduled)</option>
                      <option value="in_progress">En curso (in_progress)</option>
                      <option value="completed">Finalizado (completed)</option>
                      <option value="cancelled">Cancelado (cancelled)</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer del Asistente con Botones de Navegación (Fijo al fondo) */}
        <div
          id="course-wizard-footer"
          className="shrink-0 border-t border-edge bg-carbon/95 px-3.5 sm:px-7 py-2.5 sm:py-3.5 flex items-center justify-between backdrop-blur-md"
        >
          <div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-edge px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-medium text-fog hover:text-snow hover:bg-steel transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-edge bg-steel/60 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-snow hover:bg-steel transition-colors cursor-pointer"
              >
                <Icon name="arrow-left" className="h-3.5 w-3.5 shrink-0" />
                <span>Anterior</span>
              </button>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-crimson px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-normal sm:tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.45)] hover:bg-crimson-bright transition-all cursor-pointer"
              >
                <span>Siguiente</span>
                <Icon name="arrow-right" className="h-3.5 w-3.5 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-crimson px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-normal sm:tracking-wider text-snow shadow-[0_4px_20px_rgba(216,17,43,0.5)] hover:bg-crimson-bright transition-all cursor-pointer disabled:opacity-50"
              >
                <Icon name="check" className="h-4 w-4 shrink-0" />
                <span>
                  {isSubmitting
                    ? "Guardando..."
                    : initialCourse
                    ? "Guardar cambios"
                    : "Crear actividad"}
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const emptySubscribe = () => () => {};

export function CourseFormModal({
  isOpen,
  initialCourse,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initialCourse: Course | null;
  onClose: () => void;
  onSave: (saved: Course, isNew: boolean) => void;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Bloquea el scroll del fondo mientras el modal asistente esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <AnimatePresence>
      <CourseWizardModalContent
        key={initialCourse?.id || "new-course"}
        initialCourse={initialCourse}
        onClose={onClose}
        onSave={onSave}
      />
    </AnimatePresence>,
    document.body
  );
}
