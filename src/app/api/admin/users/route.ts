import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, authEmailForDni } from "@/modules/auth/lib/supabase-admin";

/* Crea un trabajador: usuario de Supabase Auth (email sintético
   "<dni>@herrera-ct.local", contraseña inicial = DNI) + fila en
   app_users con auth_user_id ya enlazado. Requiere la Service Role Key
   (SUPABASE_SERVICE_ROLE_KEY en .env.local) — por eso vive en un Route
   Handler y no se llama directo desde el navegador. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const {
    dni, first_name, last_name, email, phone,
    is_admin, area_id, role_id, modules,
  } = body as Record<string, unknown>;

  if (typeof dni !== "string" || !/^\d{8,}$/.test(dni)) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 });
  }
  if (typeof first_name !== "string" || !first_name.trim()) {
    return NextResponse.json({ error: "Faltan los nombres del trabajador" }, { status: 400 });
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: authEmailForDni(dni),
    password: dni,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "No se pudo crear el acceso del usuario" },
      { status: 500 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc("admin_create_user", {
    p_dni: dni,
    p_first_name: (first_name as string).trim(),
    p_last_name: typeof last_name === "string" ? last_name.trim() : "",
    p_email: typeof email === "string" ? email.trim() : "",
    p_phone: typeof phone === "string" ? phone.trim() : "",
    p_is_admin: is_admin === true,
    p_area_id: area_id ?? null,
    p_role_id: role_id ?? null,
    p_modules: modules ?? [],
  });

  if (error) {
    // La fila de app_users no se pudo crear: no dejar un auth.users huérfano.
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const created = data as { id: string };
  const { error: linkError } = await supabaseAdmin
    .from("app_users")
    .update({ auth_user_id: authUser.user.id })
    .eq("id", created.id);
  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ ...created, auth_user_id: authUser.user.id });
}

/* Restablece la contraseña al DNI (Supabase Auth) y vuelve a exigir
   el cambio en app_users, igual que admin_reset_password() antes. */
export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { user_id } = body as Record<string, unknown>;
  if (typeof user_id !== "string") {
    return NextResponse.json({ error: "user_id requerido" }, { status: 400 });
  }

  const { data: user, error: fetchError } = await supabaseAdmin
    .from("app_users")
    .select("dni, auth_user_id")
    .eq("id", user_id)
    .maybeSingle();
  if (fetchError || !user) {
    return NextResponse.json({ error: fetchError?.message ?? "Usuario no encontrado" }, { status: 404 });
  }

  if (user.auth_user_id) {
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(user.auth_user_id, {
      password: user.dni,
    });
    if (pwError) {
      return NextResponse.json({ error: pwError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("app_users")
    .update({ must_change_password: true, updated_at: new Date().toISOString() })
    .eq("id", user_id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
