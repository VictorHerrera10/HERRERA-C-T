/* Tipos y configuración visual del módulo de tickets */

export type TicketStatus =
  | "nuevo"
  | "analisis"
  | "desarrollo"
  | "espera"
  | "resuelto"
  | "cerrado";

export type TicketCategory = "soporte" | "caida" | "funcionalidad";
export type TicketPriority = "baja" | "media" | "alta" | "critica";

export type Ticket = {
  id: string;
  ticket_no: number;
  title: string;
  description: string;
  client_name: string;
  client_email: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  author: string;
  body: string;
  created_at: string;
};

/* ── Configuración visual (tema oscuro del panel) ─────────── */

export const STATUS_ORDER: TicketStatus[] = [
  "nuevo",
  "analisis",
  "desarrollo",
  "espera",
  "resuelto",
  "cerrado",
];

export const STATUS: Record<
  TicketStatus,
  { label: string; badge: string; dot: string }
> = {
  nuevo: {
    label: "Nuevo",
    badge: "bg-azul/10 text-azul",
    dot: "bg-azul",
  },
  analisis: {
    label: "En análisis",
    badge: "bg-gold/15 text-gold-soft",
    dot: "bg-gold",
  },
  desarrollo: {
    label: "En desarrollo",
    badge: "bg-azul/10 text-azul",
    dot: "bg-azul",
  },
  espera: {
    label: "Espera de cliente",
    badge: "bg-gold/15 text-gold-soft",
    dot: "bg-gold",
  },
  resuelto: {
    label: "Resuelto",
    badge: "bg-esmeralda/10 text-esmeralda",
    dot: "bg-esmeralda",
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-steel text-fog",
    dot: "bg-ash",
  },
};

export const CATEGORY: Record<
  TicketCategory,
  { label: string; chip: string }
> = {
  soporte: { label: "Soporte", chip: "bg-azul/10 text-azul" },
  caida: { label: "Caída / Incidente", chip: "bg-crimson/10 text-[#ff8195]" },
  funcionalidad: {
    label: "Nueva funcionalidad",
    chip: "bg-steel text-fog",
  },
};

export const PRIORITY: Record<
  TicketPriority,
  { label: string; chip: string; bar: string; weight: number }
> = {
  critica: {
    label: "Crítica",
    chip: "bg-crimson text-snow",
    bar: "bg-crimson",
    weight: 4,
  },
  alta: {
    label: "Alta",
    chip: "bg-crimson/12 text-[#ff8195]",
    bar: "bg-crimson/60",
    weight: 3,
  },
  media: {
    label: "Media",
    chip: "bg-gold/15 text-gold-soft",
    bar: "bg-gold",
    weight: 2,
  },
  baja: {
    label: "Baja",
    chip: "bg-steel text-fog",
    bar: "bg-edge",
    weight: 1,
  },
};

export const ACTIVE_STATUSES: TicketStatus[] = [
  "nuevo",
  "analisis",
  "desarrollo",
  "espera",
];

export function ticketCode(n: number): string {
  return `HCT-${String(n).padStart(4, "0")}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} día${d > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
