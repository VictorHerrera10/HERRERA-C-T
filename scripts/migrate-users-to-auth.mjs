// Migra los app_users existentes (sin auth_user_id) a Supabase Auth.
// Uso único: node --env-file=.env.local scripts/migrate-users-to-auth.mjs
// Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local.
//
// A cada usuario sin auth_user_id se le crea un auth.users con email
// "<dni>@herrera-ct.local" y contraseña = su DNI actual (mismo
// comportamiento que "contraseña inicial = DNI"). Si el usuario ya
// había cambiado su contraseña personalizada, ese hash bcrypt casero
// no se puede migrar (Supabase Auth no acepta un hash ajeno) — queda
// reseteado a su DNI y must_change_password = true, igual que hace
// admin_reset_password() hoy. El script imprime quiénes quedan así.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function authEmailForDni(dni) {
  return `${dni}@herrera-ct.local`;
}

async function main() {
  const { data: users, error } = await admin
    .from("app_users")
    .select("id, dni, first_name, last_name, auth_user_id")
    .is("auth_user_id", null);

  if (error) {
    console.error("No se pudo leer app_users:", error.message);
    process.exit(1);
  }

  if (!users.length) {
    console.log("Nada que migrar: todos los usuarios ya tienen auth_user_id.");
    return;
  }

  console.log(`Migrando ${users.length} usuario(s) a Supabase Auth…\n`);
  const resetToDni = [];

  for (const u of users) {
    const email = authEmailForDni(u.dni);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: u.dni,
      email_confirm: true,
    });

    if (createError) {
      console.error(`✗ DNI ${u.dni} (${u.first_name} ${u.last_name}): ${createError.message}`);
      continue;
    }

    const { error: linkError } = await admin
      .from("app_users")
      .update({
        auth_user_id: created.user.id,
        must_change_password: true, // su contraseña personalizada, si tenía una, no se pudo migrar
        updated_at: new Date().toISOString(),
      })
      .eq("id", u.id);

    if (linkError) {
      console.error(`✗ DNI ${u.dni}: creado en Auth pero no se pudo enlazar: ${linkError.message}`);
      continue;
    }

    resetToDni.push(`${u.dni} — ${u.first_name} ${u.last_name}`);
    console.log(`✓ DNI ${u.dni} (${u.first_name} ${u.last_name}) migrado.`);
  }

  console.log(
    `\nListo. Todas las cuentas migradas quedaron con contraseña = su DNI y deberán` +
    ` cambiarla en su próximo ingreso:\n  - ${resetToDni.join("\n  - ")}`
  );
}

main();
