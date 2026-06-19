/* Lógica del asistente de creación de tickets del portal de cliente.
   Cada categoría pide campos distintos y deriva la prioridad sola:
   el cliente nunca elige "prioridad" — se calcula de sus respuestas. */

import type { TicketCategory, TicketPriority } from "./tickets";

export type ClientData = {
  nombre: string;
  empresa: string;
  correo: string;
};

/* ── Soporte: dudas y consultas ── */
export type SoporteDetalle = {
  servicio: string;
  pregunta: string;
  urgencia: "espera" | "semana" | "hoy";
};

export const SOPORTE_SERVICIOS = [
  "Sitio web",
  "Correo corporativo",
  "Hosting / Dominio",
  "Sistema a medida",
  "Otro",
];

export const SOPORTE_URGENCIA: { value: SoporteDetalle["urgencia"]; label: string }[] = [
  { value: "espera", label: "Puedo esperar" },
  { value: "semana", label: "Esta semana" },
  { value: "hoy", label: "Hoy mismo" },
];

/* ── Caída: incidentes ── */
export type CaidaDetalle = {
  sistema: string;
  desde: string;
  alcance: "solo" | "varios" | "todos";
  sintoma: string;
};

export const CAIDA_DESDE = [
  "Hace minutos",
  "Hace horas",
  "Desde ayer",
  "Varios días",
];

export const CAIDA_ALCANCE: { value: CaidaDetalle["alcance"]; label: string }[] = [
  { value: "solo", label: "Solo a mí" },
  { value: "varios", label: "A varias personas" },
  { value: "todos", label: "A todos / operación detenida" },
];

/* ── Funcionalidad: nuevos requerimientos ── */
export type FuncionalidadDetalle = {
  resumen: string;
  objetivo: string;
  usuarios: string;
  plazo: "sin-fecha" | "semanas" | "urgente";
};

export const FUNCIONALIDAD_PLAZO: { value: FuncionalidadDetalle["plazo"]; label: string }[] = [
  { value: "sin-fecha", label: "Sin fecha definida" },
  { value: "semanas", label: "Próximas semanas" },
  { value: "urgente", label: "Lo antes posible" },
];

export type WizardDetalle = {
  soporte: SoporteDetalle;
  caida: CaidaDetalle;
  funcionalidad: FuncionalidadDetalle;
};

export const DETALLE_VACIO: WizardDetalle = {
  soporte: { servicio: "", pregunta: "", urgencia: "semana" },
  caida: { sistema: "", desde: "", alcance: "solo", sintoma: "" },
  funcionalidad: { resumen: "", objetivo: "", usuarios: "", plazo: "sin-fecha" },
};

/* ── Validación por categoría ── */
export function detalleValido(cat: TicketCategory, d: WizardDetalle): boolean {
  if (cat === "soporte")
    return !!d.soporte.servicio && d.soporte.pregunta.trim().length > 4;
  if (cat === "caida") return !!d.caida.sistema.trim() && !!d.caida.desde;
  return d.funcionalidad.resumen.trim().length > 3 && d.funcionalidad.objetivo.trim().length > 4;
}

/* ── Construcción del ticket ── */
export function buildTicket(
  cat: TicketCategory,
  datos: ClientData,
  d: WizardDetalle
): { title: string; description: string; priority: TicketPriority } {
  if (cat === "caida") {
    const priority: TicketPriority =
      d.caida.alcance === "todos" ? "critica" : "alta";
    return {
      title: `Caída: ${d.caida.sistema.trim()}`,
      priority,
      description: [
        "■ REPORTE DE CAÍDA / INCIDENTE",
        `Sistema afectado: ${d.caida.sistema.trim()}`,
        `Desde: ${d.caida.desde}`,
        `Alcance: ${CAIDA_ALCANCE.find((a) => a.value === d.caida.alcance)?.label}`,
        d.caida.sintoma.trim() && `Qué se observa:\n${d.caida.sintoma.trim()}`,
        "",
        "— Enviado desde el portal de soporte",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (cat === "soporte") {
    const priority: TicketPriority =
      d.soporte.urgencia === "hoy"
        ? "alta"
        : d.soporte.urgencia === "semana"
          ? "media"
          : "baja";
    return {
      title: `Duda sobre ${d.soporte.servicio}`,
      priority,
      description: [
        "■ CONSULTA / SOPORTE",
        `Servicio relacionado: ${d.soporte.servicio}`,
        `Urgencia: ${SOPORTE_URGENCIA.find((u) => u.value === d.soporte.urgencia)?.label}`,
        `Consulta:\n${d.soporte.pregunta.trim()}`,
        "",
        "— Enviado desde el portal de soporte",
      ].join("\n"),
    };
  }

  const priority: TicketPriority =
    d.funcionalidad.plazo === "urgente" ? "media" : "baja";
  return {
    title: `Solicitud: ${d.funcionalidad.resumen.trim()}`,
    priority,
    description: [
      "■ NUEVA FUNCIONALIDAD / REQUERIMIENTO",
      `Resumen: ${d.funcionalidad.resumen.trim()}`,
      `Qué debe hacer:\n${d.funcionalidad.objetivo.trim()}`,
      d.funcionalidad.usuarios.trim() &&
        `Quiénes la usarán: ${d.funcionalidad.usuarios.trim()}`,
      `Plazo deseado: ${FUNCIONALIDAD_PLAZO.find((p) => p.value === d.funcionalidad.plazo)?.label}`,
      "",
      "— Enviado desde el portal de soporte",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function clientDisplayName(datos: ClientData): string {
  return datos.empresa.trim()
    ? `${datos.nombre.trim()} — ${datos.empresa.trim()}`
    : datos.nombre.trim();
}
