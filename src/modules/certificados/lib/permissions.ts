import type { SessionUser } from "@/modules/auth/lib/auth";

export type CertificatePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  manage_status: boolean;
  simulate_issue: boolean;
};

export type RoleSimulationPreset = "auto" | "admin" | "editor" | "viewer";

export const ROLE_PRESET_PERMISSIONS: Record<
  Exclude<RoleSimulationPreset, "auto">,
  CertificatePermissions
> = {
  admin: {
    view: true,
    create: true,
    edit: true,
    manage_status: true,
    simulate_issue: true,
  },
  editor: {
    view: true,
    create: true,
    edit: true,
    manage_status: true,
    simulate_issue: true,
  },
  viewer: {
    view: true,
    create: false,
    edit: false,
    manage_status: false,
    simulate_issue: false,
  },
};

export function resolveCertificatePermissions(
  user: SessionUser | null,
  preset: RoleSimulationPreset = "auto"
): CertificatePermissions {
  if (preset !== "auto") {
    return ROLE_PRESET_PERMISSIONS[preset];
  }

  if (!user) {
    return {
      view: false,
      create: false,
      edit: false,
      manage_status: false,
      simulate_issue: false,
    };
  }

  // Administrador de plataforma tiene todos los permisos
  if (user.is_admin) {
    return ROLE_PRESET_PERMISSIONS.admin;
  }

  const roleNormalized = (user.role_name || "").toLowerCase();

  // Roles restringidos de solo lectura (ej. auditor, practicante, visualizador)
  if (
    roleNormalized.includes("lector") ||
    roleNormalized.includes("consulta") ||
    roleNormalized.includes("auditor") ||
    roleNormalized.includes("observador")
  ) {
    return ROLE_PRESET_PERMISSIONS.viewer;
  }

  // Roles operativos con acceso al módulo: edición y emisión simulada permitida
  return ROLE_PRESET_PERMISSIONS.editor;
}
