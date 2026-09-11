/* Tipos y configuración del módulo de Proyectos */

export type ProjectStage = "requisitos" | "desarrollo" | "gerencia" | "cerrado";
export type DevProgressStage =
  | "analisis"
  | "diseno"
  | "implementacion"
  | "pruebas"
  | "listo";

export type ClientProject = {
  id: string;
  project_no: number;
  quote_id: string | null;
  title: string;
  project_summary: string;
  client_name: string;
  client_email: string;
  client_company: string;
  client_phone: string;
  manager_id: string | null;
  dev_user_id: string | null;
  stage: ProjectStage;
  dev_progress_stage: DevProgressStage | null;
  dev_progress_note: string;
  manager_conformity_at: string | null;
  management_conformity_at: string | null;
  client_conformity_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRequirement = {
  id: string;
  project_id: string;
  label: string;
  value: string;
  sort_order: number;
  kind: "text" | "file_ref" | "boolean";
  created_at: string;
};

export type ProjectResource = {
  id: string;
  project_id: string;
  label: string;
  url: string;
  uploaded_by: string | null;
  stage_at_upload: string;
  created_at: string;
};

export type ProjectConformity = {
  id: string;
  project_id: string;
  role: "manager" | "management";
  user_id: string | null;
  note: string;
  created_at: string;
};

export const PROJECT_STAGE: Record<
  ProjectStage,
  { label: string; badge: string; dot: string }
> = {
  requisitos: {
    label: "Requisitos",
    badge: "bg-gold/15 text-gold-soft",
    dot: "bg-gold",
  },
  desarrollo: {
    label: "Desarrollo",
    badge: "bg-azul/10 text-azul",
    dot: "bg-azul",
  },
  gerencia: {
    label: "Gerencia",
    badge: "bg-[#6366f1]/10 text-[#6366f1]",
    dot: "bg-[#6366f1]",
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-esmeralda/10 text-esmeralda",
    dot: "bg-esmeralda",
  },
};

export const DEV_PROGRESS_STAGE: Record<DevProgressStage, { label: string; order: number }> = {
  analisis: { label: "Análisis", order: 1 },
  diseno: { label: "Diseño", order: 2 },
  implementacion: { label: "Implementación", order: 3 },
  pruebas: { label: "Pruebas", order: 4 },
  listo: { label: "Listo", order: 5 },
};

export const DEV_PROGRESS_ORDER: DevProgressStage[] = [
  "analisis",
  "diseno",
  "implementacion",
  "pruebas",
  "listo",
];

export const PROJECT_STAGE_ORDER: ProjectStage[] = [
  "requisitos",
  "desarrollo",
  "gerencia",
  "cerrado",
];

export function projectCode(n: number): string {
  return `PRY-${String(n).padStart(4, "0")}`;
}
