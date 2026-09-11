/* Tipos y configuración del módulo de cotizaciones */

export type QuoteStatus =
  | "borrador"
  | "enviada"
  | "aprobada"
  | "rechazada"
  | "vencida";

export type ApprovalStatus = "pendiente" | "aprobada" | "rechazada";

export type Quote = {
  id: string;
  quote_no: number;
  title: string;
  client_name: string;
  client_email: string;
  currency: string;
  tax_rate: number;
  valid_until: string | null;
  notes: string;
  status: QuoteStatus;
  client_note: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  /* Aprobación interna (distinta de la decisión del cliente arriba) */
  created_by: string | null;
  approver_id: string | null;
  approval_status: ApprovalStatus | null;
  approval_note: string;
  approved_at: string | null;
  /* Datos ampliados de proyecto/cliente/plazo (Fase 1) */
  project_summary: string;
  client_company: string;
  client_phone: string;
  terms: string;
  estimated_duration_text: string;
  estimated_delivery_date: string | null;
  client_accepted_duration: boolean;
  /* Origen y responsable — preparación del Portal de Cliente (Fase 5) */
  origin: "consultor" | "cliente";
  assigned_to: string | null;
  /* Conformidad del encargado tras aprobación del cliente (Fase 2) */
  manager_confirmed_at?: string | null;
  manager_confirmation_note?: string;
};

export type QuoteTermTemplate = {
  id: string;
  name: string;
  body: string;
  created_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  qty: number;
  unit_price: number;
  sort_order: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  unit_price: number;
};

export const QUOTE_STATUS: Record<
  QuoteStatus,
  { label: string; badge: string; dot: string }
> = {
  borrador: {
    label: "Borrador",
    badge: "bg-steel text-fog",
    dot: "bg-ash",
  },
  enviada: {
    label: "Enviada",
    badge: "bg-azul/10 text-azul",
    dot: "bg-azul",
  },
  aprobada: {
    label: "Aprobada",
    badge: "bg-esmeralda/10 text-esmeralda",
    dot: "bg-esmeralda",
  },
  rechazada: {
    label: "Rechazada",
    badge: "bg-crimson/10 text-[#ff8195]",
    dot: "bg-crimson",
  },
  vencida: {
    label: "Vencida",
    badge: "bg-gold/15 text-gold-soft",
    dot: "bg-gold",
  },
};

export const APPROVAL_STATUS: Record<
  ApprovalStatus,
  { label: string; badge: string; dot: string }
> = {
  pendiente: {
    label: "En aprobación",
    badge: "bg-gold/15 text-gold-soft",
    dot: "bg-gold",
  },
  aprobada: {
    label: "Aprobada internamente",
    badge: "bg-esmeralda/10 text-esmeralda",
    dot: "bg-esmeralda",
  },
  rechazada: {
    label: "Rechazada internamente",
    badge: "bg-crimson/10 text-[#ff8195]",
    dot: "bg-crimson",
  },
};

export const QUOTE_STATUS_ORDER: QuoteStatus[] = [
  "borrador",
  "enviada",
  "aprobada",
  "rechazada",
  "vencida",
];

export function quoteCode(n: number): string {
  return `COT-${String(n).padStart(4, "0")}`;
}

export function money(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString("es", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function quoteTotals(items: QuoteItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const tax = subtotal * (taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}

/** Una cotización enviada cuya fecha de validez ya pasó se considera vencida. */
export function effectiveStatus(q: Quote): QuoteStatus {
  if (
    q.status === "enviada" &&
    q.valid_until &&
    new Date(q.valid_until) < new Date(new Date().toDateString())
  )
    return "vencida";
  return q.status;
}
