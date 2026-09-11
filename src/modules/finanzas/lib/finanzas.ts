/* Tipos y helpers del módulo Finanzas */

export type ProjectIncome = {
  id: string;
  project_id: string | null;
  quote_id: string | null;
  amount: number;
  currency: string;
  income_date: string;
  reference: string;
  created_at: string;
};

export type IncomeSummaryRow = {
  currency: string;
  total: number;
  count: number;
};

export function money(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString("es", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
