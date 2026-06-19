/* Tipos, estados y utilidades del módulo de ventas */

export type CategorySlug = "tecnologia" | "libreria" | "personalizados";

export type ProductCategory = {
  id: string;
  slug: CategorySlug;
  name: string;
  icon: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  stock_min: number;
  image_url: string;
  sku: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "nueva"
  | "revisando"
  | "confirmada"
  | "entregada"
  | "cancelada";

export type SaleOrder = {
  id: string;
  order_no: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
};

export type SaleOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  qty: number;
};

/* ── Helpers ── */

export function orderCode(n: number): string {
  return `ORD-${String(n).padStart(4, "0")}`;
}

export function money(amount: number, currency = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function stockLabel(p: Product): "disponible" | "pocas" | "agotado" {
  if (p.stock === 0) return "agotado";
  if (p.stock <= p.stock_min) return "pocas";
  return "disponible";
}

/* ── Catálogo de estados con estilos ── */
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; badge: string; dot: string; next: OrderStatus | null }
> = {
  nueva: {
    label: "Nueva",
    badge: "bg-azul/10 text-azul",
    dot: "bg-azul animate-pulse",
    next: "revisando",
  },
  revisando: {
    label: "En revisión",
    badge: "bg-gold/15 text-gold",
    dot: "bg-gold",
    next: "confirmada",
  },
  confirmada: {
    label: "Confirmada",
    badge: "bg-esmeralda/10 text-esmeralda",
    dot: "bg-esmeralda",
    next: "entregada",
  },
  entregada: {
    label: "Entregada",
    badge: "bg-ink/8 text-ink-soft",
    dot: "bg-ink-faint",
    next: null,
  },
  cancelada: {
    label: "Cancelada",
    badge: "bg-burgundy/10 text-burgundy",
    dot: "bg-burgundy",
    next: null,
  },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "nueva",
  "revisando",
  "confirmada",
  "entregada",
  "cancelada",
];

export const CURRENCIES = ["PEN", "USD"] as const;

export const CATEGORY_LABELS: Record<CategorySlug, { label: string; emoji: string; special?: boolean }> = {
  tecnologia:    { label: "Tecnología",           emoji: "🖥️" },
  libreria:      { label: "Librería",             emoji: "📦" },
  personalizados: { label: "Objetos Personalizados", emoji: "✨", special: true },
};
