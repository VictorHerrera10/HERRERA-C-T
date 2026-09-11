-- ============================================================
-- Migración: gestor /usuarios pasa a usar funciones hct_* para
-- leer/editar app_users, en vez de supabase.from("app_users").
--
-- Contexto: migration-mobile-rls.sql revocó SELECT sobre app_users
-- para anon/authenticated (endurecimiento de tickets/leads), pero
-- UsersManager.tsx seguía leyendo esa tabla directo → "permission
-- denied for table app_users" al abrir /usuarios. Estas funciones
-- restauran esa pantalla sin reabrir la tabla al navegador.
--
-- Solo el administrador logueado (is_admin = true, resuelto vía
-- Supabase Auth con hct_current_user_id()) puede llamarlas.
-- ============================================================

create or replace function hct_require_admin()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid := hct_current_user_id();
begin
  if v_id is null or not exists (
    select 1 from app_users where id = v_id and is_admin and active
  ) then
    raise exception 'No autorizado';
  end if;
  return v_id;
end $$;

-- Lista completa de app_users (equivalente a select * order by created_at)
create or replace function hct_list_users()
returns setof app_users language plpgsql security definer set search_path = public as $$
begin
  perform hct_require_admin();
  return query select * from app_users order by created_at;
end $$;

-- Edita los campos de negocio de un trabajador (lo que hacía el
-- .update() directo desde "Editar" en /usuarios).
create or replace function hct_update_user(
  p_user_id uuid,
  p_dni text, p_first_name text, p_last_name text,
  p_email text, p_phone text, p_is_admin boolean,
  p_area_id uuid, p_role_id uuid, p_modules text[]
) returns app_users language plpgsql security definer set search_path = public as $$
declare v_row app_users;
begin
  perform hct_require_admin();
  update app_users set
    dni = p_dni, first_name = p_first_name, last_name = p_last_name,
    email = p_email, phone = p_phone, is_admin = p_is_admin,
    area_id = p_area_id, role_id = p_role_id, modules = p_modules,
    updated_at = now()
  where id = p_user_id
  returning * into v_row;
  return v_row;
end $$;

-- Activa/desactiva a un trabajador (botón "Activar"/"Desactivar").
create or replace function hct_set_user_active(p_user_id uuid, p_active boolean)
returns app_users language plpgsql security definer set search_path = public as $$
declare v_row app_users;
begin
  perform hct_require_admin();
  update app_users set active = p_active, updated_at = now()
  where id = p_user_id
  returning * into v_row;
  return v_row;
end $$;
