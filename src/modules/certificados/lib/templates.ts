export type CertificateStatus = "draft" | "active" | "inactive";

export type CertificateTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  issuing_entity: string;
  diploma_title: string;
  diploma_text: string;
  signatory_name: string;
  signatory_role: string;
  status: CertificateStatus;
  version: string;
  created_at: string;
  updated_at: string;
};

export const INITIAL_DEMO_TEMPLATES: CertificateTemplate[] = [
  {
    id: "tpl-fundamentos-dev",
    name: "Fundamentos de Desarrollo de Software",
    description:
      "Acreditación para participantes que completan el programa introductorio a la ingeniería de software y buenas prácticas.",
    category: "Tecnología",
    issuing_entity: "Horizen Tecnología e Información",
    diploma_title: "Certificado de Aprobación",
    diploma_text:
      "Por haber completado satisfactoriamente los módulos teóricos y prácticos de Fundamentos de Desarrollo de Software, demostrando dominio en algoritmia, control de versiones y metodologías ágiles.",
    signatory_name: "Ing. Víctor Herrera",
    signatory_role: "Director de Tecnología — Horizen TI",
    status: "draft",
    version: "1.0",
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-03-15T16:30:00Z",
  },
  {
    id: "tpl-gestion-empresarial",
    name: "Gestión Empresarial",
    description:
      "Certificación orientada a líderes de proyectos en formulación estratégica, optimización de procesos y gobierno corporativo.",
    category: "Gestión",
    issuing_entity: "Horizen Tecnología e Información",
    diploma_title: "Diploma de Reconocimiento y Competencia",
    diploma_text:
      "En mérito a su destacada participación y cumplimiento de los estándares ejecutivos del programa de Gestión Empresarial y Transformación Digital.",
    signatory_name: "Lic. Carlos Mendoza",
    signatory_role: "Gerente de Operaciones y Estrategia",
    status: "draft",
    version: "1.0",
    created_at: "2026-03-12T09:00:00Z",
    updated_at: "2026-03-18T14:15:00Z",
  },
  {
    id: "tpl-herramientas-digitales",
    name: "Taller de Herramientas Digitales",
    description:
      "Plantilla archivada correspondiente al taller modular de alfabetización digital y suites colaborativas en la nube.",
    category: "Tecnología",
    issuing_entity: "Horizen Tecnología e Información",
    diploma_title: "Constancia de Participación",
    diploma_text:
      "Por haber asistido y superado las evaluaciones prácticas del Taller Intensivo de Herramientas Digitales para la Productividad.",
    signatory_name: "Ing. Víctor Herrera",
    signatory_role: "Director de Tecnología — Horizen TI",
    status: "inactive",
    version: "1.0",
    created_at: "2026-01-20T08:00:00Z",
    updated_at: "2026-02-05T11:00:00Z",
  },
  {
    id: "tpl-cloud-devops",
    name: "Arquitectura Cloud & DevOps",
    description:
      "Especialización avanzada en infraestructura como código, despliegues continuos y arquitecturas resilientes en nube.",
    category: "Tecnología",
    issuing_entity: "Horizen Tecnología e Información",
    diploma_title: "Certificado de Excelencia Profesional",
    diploma_text:
      "Por haber acreditado competencias avanzadas en el diseño e implementación de infraestructuras cloud nativas, pipelines CI/CD y observabilidad empresarial.",
    signatory_name: "Ing. Víctor Herrera",
    signatory_role: "Director de Tecnología — Horizen TI",
    status: "active",
    version: "1.2",
    created_at: "2026-02-01T12:00:00Z",
    updated_at: "2026-03-22T18:40:00Z",
  },
];

const STORAGE_KEY = "horizen_cert_templates_demo_v1";

export function loadTemplatesFromStorage(): CertificateTemplate[] {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_TEMPLATES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_TEMPLATES));
      return INITIAL_DEMO_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading certificate templates from localStorage:", err);
  }
  return INITIAL_DEMO_TEMPLATES;
}

export function saveTemplatesToStorage(templates: CertificateTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error("Error writing certificate templates to localStorage:", err);
  }
}

export function resetDemoTemplates(): CertificateTemplate[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_TEMPLATES));
    } catch {
      // Ignorar error de storage
    }
  }
  return [...INITIAL_DEMO_TEMPLATES];
}

export function saveTemplate(
  draft: Omit<CertificateTemplate, "id" | "created_at" | "updated_at"> & {
    id?: string;
    created_at?: string;
  }
): { template: CertificateTemplate; isNew: boolean } {
  const currentList = loadTemplatesFromStorage();
  const nowIso = new Date().toISOString();
  const isNew = !draft.id;

  const id = draft.id || `tpl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const finalTemplate: CertificateTemplate = {
    ...draft,
    id,
    created_at: draft.created_at || nowIso,
    updated_at: nowIso,
  };

  const updatedList = isNew
    ? [finalTemplate, ...currentList]
    : currentList.map((item) => (item.id === id ? finalTemplate : item));

  saveTemplatesToStorage(updatedList);
  return { template: finalTemplate, isNew };
}

export function updateTemplateStatus(
  id: string,
  newStatus: CertificateStatus
): CertificateTemplate | null {
  const currentList = loadTemplatesFromStorage();
  const index = currentList.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updated: CertificateTemplate = {
    ...currentList[index],
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  currentList[index] = updated;
  saveTemplatesToStorage(currentList);
  return updated;
}

export function calculateTemplateStats(templates: CertificateTemplate[]) {
  const total = templates.length;
  const active = templates.filter((t) => t.status === "active").length;
  const draft = templates.filter((t) => t.status === "draft").length;
  const inactive = templates.filter((t) => t.status === "inactive").length;
  return { total, active, draft, inactive };
}
