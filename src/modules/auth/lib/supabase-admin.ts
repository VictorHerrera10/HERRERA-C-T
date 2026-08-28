import { createClient } from "@supabase/supabase-js";

/* Cliente con la Service Role Key: SOLO para código server-side
   (Route Handlers). NUNCA importar desde un componente "use client" —
   la key completa quedaría expuesta en el bundle del navegador. */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export function authEmailForDni(dni: string): string {
  return `${dni}@herrera-ct.local`;
}
