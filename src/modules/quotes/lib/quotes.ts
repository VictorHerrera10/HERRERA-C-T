/* Tipos y configuración del módulo de cotizaciones */

export type QuoteStatus =
  | "borrador"
  | "enviada"
  | "aprobada"
  | "rechazada"
  | "vencida";

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
    badge: "bg-ink/8 text-ink-soft",
    dot: "bg-ink-faint",
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
    badge: "bg-burgundy/10 text-burgundy",
    dot: "bg-burgundy",
  },
  vencida: {
    label: "Vencida",
    badge: "bg-gold/15 text-[#8a6a14]",
    dot: "bg-gold",
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
