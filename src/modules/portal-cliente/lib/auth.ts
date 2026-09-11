/* Sesión del cliente (Supabase Auth con correo real). Separado de
   modules/auth, que es exclusivo del login de trabajadores por DNI. */

import { supabase } from "@/modules/shared/lib/supabase";

export type ClientUser = {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  email: string;
  active: boolean;
};

let cachedClient: ClientUser | null = null;

export function getClientSession(): ClientUser | null {
  return cachedClient;
}

export function saveClientSession(client: ClientUser) {
  cachedClient = client;
}

export async function clearClientSession() {
  cachedClient = null;
  await supabase.auth.signOut();
}

export async function loadClientSession(): Promise<ClientUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    cachedClient = null;
    return null;
  }
  const { data: profile, error } = await supabase.rpc("hct_client_my_profile");
  if (error || !profile) {
    cachedClient = null;
    return null;
  }
  cachedClient = profile as ClientUser;
  return cachedClient;
}

export async function registerClient(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  company: string,
  phone: string
): Promise<{ ok: boolean; error?: string }> {
  const { error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) return { ok: false, error: signUpError.message };

  const { error: rpcError } = await supabase.rpc("hct_complete_client_registration", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_company: company,
    p_phone: phone,
  });
  if (rpcError) return { ok: false, error: rpcError.message };

  await loadClientSession();
  return { ok: true };
}

export async function loginClient(
  email: string,
  password: string
): Promise<ClientUser | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return null;
  return loadClientSession();
}

/* Envía el correo de "restablecer contraseña" de Supabase Auth. El
   enlace lleva a /portal/cliente/restablecer, donde con la sesión
   temporal que crea ese enlace se define la contraseña nueva. */
export async function requestClientPasswordReset(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/portal/cliente/restablecer`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* Define la contraseña nueva usando la sesión temporal que Supabase
   crea al abrir el enlace del correo de restablecimiento. */
export async function completeClientPasswordReset(
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
