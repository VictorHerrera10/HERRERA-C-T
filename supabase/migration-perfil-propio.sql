-- ============================================================
-- Migración: ProfileView.tsx (perfil propio del trabajador) también
-- escribía app_users directo (nombres, correo, teléfono, avatar_url)
-- y quedó bloqueado por el revoke de migration-mobile-rls.sql.
--
-- A diferencia de hct_update_user (solo admin, edita a cualquiera),
-- esta función edita SOLO al usuario de la sesión activa —
-- cualquier trabajador puede llamarla para su propio perfil.
-- ============================================================

create or replace function hct_update_my_profile(
  p_first_name text, p_last_name text, p_email text, p_phone text
) returns app_users language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := hct_current_user_id();
  v_row app_users;
begin
  if v_id is null then
    raise exception 'No autorizado';
  end if;
  update app_users set
    first_name = p_first_name, last_name = p_last_name,
    email = p_email, phone = p_phone, updated_at = now()
  where id = v_id
  returning * into v_row;
  return v_row;
end $$;

create or replace function hct_update_my_avatar(p_avatar_url text)
returns app_users language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := hct_current_user_id();
  v_row app_users;
begin
  if v_id is null then
    raise exception 'No autorizado';
  end if;
  update app_users set avatar_url = p_avatar_url, updated_at = now()
  where id = v_id
  returning * into v_row;
  return v_row;
end $$;
