export type MyQuote = {
  id: string;
  quote_no: number;
  title: string;
  status: "borrador" | "enviada" | "aprobada" | "rechazada" | "vencida";
  created_at: string;
};

export type MyProject = {
  id: string;
  project_no: number;
  title: string;
  stage: "requisitos" | "desarrollo" | "gerencia" | "cerrado";
  manager_conformity_at: string | null;
  management_conformity_at: string | null;
  client_conformity_at: string | null;
  closed_at: string | null;
};

export type ModuleMember = { id: string; first_name: string; last_name: string; avatar_url?: string | null };
