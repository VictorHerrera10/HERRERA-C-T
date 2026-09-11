/* Tipos, catálogo de módulos y sesión del login de trabajadores */

import { supabase } from "@/modules/shared/lib/supabase";

export type ModuleKey = "website" | "helpdesk" | "quotes" | "ventas" | "projects" | "finanzas";

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
  {
    key: "projects",
    label: "Proyectos",
    description: "Ejecución de proyectos: requisitos, desarrollo y conformidades.",
    href: "/proyectos/gestion",
    icon: "wrench",
    accent: "text-indigo-500",
  },
  {
    key: "finanzas",
    label: "Finanzas",
    description: "Ingresos registrados por cada proyecto cerrado.",
    href: "/finanzas/gestion",
    icon: "banknote",
    accent: "text-teal-600",
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
  /* Agregado por supabase/migration-areas-modulos.sql: unión de modules
     propios + default_modules del área. Es lo que debe usar canAccess(). */
  effective_modules?: ModuleKey[];
  must_change_password: boolean;
  active: boolean;
  /* Agregado por supabase/migration-mobile.sql: token de sesión server-side
     que exigen las funciones hct_* (tickets/leads). Puede faltar si la sesión
     se guardó antes de ejecutar esa migración — en ese caso hay que
     re-loguearse. */
  session_token?: string;
};

export type Area = { id: string; name: string; default_modules: ModuleKey[] };
export type AreaRole = { id: string; area_id: string; name: string };

export type AppUser = SessionUser & {
  last_login_at: string | null;
  created_at: string;
};

/* ── Sesión ────────────────────────────────────────────────
   La sesión (token, expiración, refresh) la maneja el SDK de Supabase
   Auth internamente en su propio localStorage. Aquí solo cacheamos en
   MEMORIA el perfil de negocio (área, rol, módulos) para que
   getSession() siga siendo síncrona — así AuthGuard, PlatformShell,
   etc. no cambian de firma. El caché se llena en login() y se puede
   refrescar con loadSessionUser(). */

const SESSION_KEY = "hct.session"; // legado: se limpia si quedó de una sesión vieja
let cachedUser: SessionUser | null = null;

export function getSession(): SessionUser | null {
  return cachedUser;
}

export function saveSession(user: SessionUser) {
  cachedUser = user;
}

export async function clearSession() {
  cachedUser = null;
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
  await supabase.auth.signOut();
}

/* Reconstruye el perfil de negocio desde la sesión de Supabase Auth
   activa (si hay una). Se llama al cargar la app (AuthGuard) para
   restaurar cachedUser tras un refresh de página. */
export async function loadSessionUser(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    cachedUser = null;
    return null;
  }
  const { data: profile, error } = await supabase.rpc("hct_my_profile");
  if (error || !profile) {
    cachedUser = null;
    return null;
  }
  cachedUser = profile as SessionUser;
  return cachedUser;
}

export function canAccess(user: SessionUser, module: ModuleKey): boolean {
  return (
    user.is_admin ||
    (user.effective_modules ?? user.modules).includes(module)
  );
}

export function displayName(user: SessionUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.dni;
}

export function roleLabel(user: SessionUser): string {
  if (user.role_name) return user.role_name;
  return user.is_admin ? "Administrador de la plataforma" : "Integrante del equipo";
}

/* ── Login del sitio web vía Supabase Auth ───────────────────
   El trabajador sigue ingresando con su DNI; por debajo se mapea a un
   email interno "<dni>@herrera-ct.local" (creado en /api/admin/users
   al dar de alta al trabajador — ver supabase/migration-auth-supabase.sql). */

export async function login(
  dni: string,
  password: string
): Promise<SessionUser | null> {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: authEmailForDni(dni),
    password,
  });
  if (authError) {
    // Credenciales inválidas o usuario inexistente: mismo comportamiento
    // que antes (auth_login devolvía null en vez de lanzar).
    return null;
  }
  return loadSessionUser();
}

export async function changePassword(
  _userId: string,
  current: string,
  next: string
): Promise<boolean> {
  // Re-verifica la contraseña actual (Supabase Auth no la vuelve a pedir
  // para updateUser() con sesión activa, pero la UI la exige como
  // confirmación de identidad, igual que hacía auth_change_password antes).
  const email = cachedUser ? authEmailForDni(cachedUser.dni) : null;
  if (email) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (verifyError) return false;
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: next });
  if (updateError) throw new Error(updateError.message);

  const { data, error } = await supabase.rpc("hct_complete_password_change");
  if (error) throw new Error(error.message);
  if (data) cachedUser = data as SessionUser;
  return true;
}

function authEmailForDni(dni: string): string {
  return `${dni}@herrera-ct.local`;
}
