/* Tipos, catálogo de módulos y sesión del login de trabajadores */

import { supabase } from "@/modules/shared/lib/supabase";

export type ModuleKey = "website" | "helpdesk" | "quotes" | "ventas";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  description: string;
  href: string;
  icon: string;
  accent: string; // clase de color del acento
};

/* Catálogo de módulos internos. Al crear un módulo nuevo, agregarlo aquí
   y el gestor de usuarios lo ofrecerá automáticamente. */
export const MODULES: ModuleDef[] = [
  {
    key: "website",
    label: "Página web",
    description: "Contenido del sitio público: servicios, proyectos, mensajes.",
    href: "/admin",
    icon: "globe",
    accent: "text-crimson-bright",
  },
  {
    key: "helpdesk",
    label: "Mesa de ayuda",
    description: "Tickets de soporte de los clientes de la consultora.",
    href: "/soporte/gestion",
    icon: "support",
    accent: "text-azul",
  },
  {
    key: "quotes",
    label: "Cotizaciones",
    description: "Propuestas comerciales, aprobación y seguimiento.",
    href: "/cotizaciones/gestion",
    icon: "chart",
    accent: "text-esmeralda",
  },
  {
    key: "ventas",
    label: "Ventas",
    description: "Catálogo de productos, órdenes de clientes y gestión de stock.",
    href: "/ventas/gestion",
    icon: "rocket",
    accent: "text-gold",
  },
];

export type SessionUser = {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  is_admin: boolean;
  area_id: string | null;
  role_id: string | null;
  area_name: string | null;
  role_name: string | null;
  modules: ModuleKey[];
  must_change_password: boolean;
  active: boolean;
};

export type Area = { id: string; name: string };
export type AreaRole = { id: string; area_id: string; name: string };

export type AppUser = SessionUser & {
  last_login_at: string | null;
  created_at: string;
};

/* ── Sesión (localStorage; auth definitivo en fase final) ──── */

const SESSION_KEY = "hct.session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function canAccess(user: SessionUser, module: ModuleKey): boolean {
  return user.is_admin || user.modules.includes(module);
}

export function displayName(user: SessionUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.dni;
}

export function roleLabel(user: SessionUser): string {
  if (user.role_name) return user.role_name;
  return user.is_admin ? "Administrador de la plataforma" : "Integrante del equipo";
}

/* ── Llamadas a Supabase (RPCs de migration-usuarios.sql) ──── */

export async function login(
  dni: string,
  password: string
): Promise<SessionUser | null> {
  const { data, error } = await supabase.rpc("auth_login", {
    p_dni: dni,
    p_password: password,
  });
  if (error) throw new Error(error.message);
  return (data as SessionUser) ?? null;
}

export async function changePassword(
  userId: string,
  current: string,
  next: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("auth_change_password", {
    p_user_id: userId,
    p_current: current,
    p_new: next,
  });
  if (error) throw new Error(error.message);
  return data === true;
}
