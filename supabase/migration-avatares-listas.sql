-- ============================================================
-- Migración: incluir avatar_url en las RPCs que listan trabajadores
-- para elegir (consultor, aprobador, desarrollador) — así la UI puede
-- mostrar la foto/avatar junto al nombre, no solo texto.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create or replace function hct_list_area_members(p_area_name text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null or not (hct_user_has_module(v_user_id, 'projects')
    or exists (select 1 from app_users where id = v_user_id and is_admin)) then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(json_build_object(
      'id', u.id, 'first_name', u.first_name, 'last_name', u.last_name,
      'avatar_url', nullif(u.avatar_url, '')
    ) order by u.first_name), '[]'::json)
    from app_users u
    join areas a on a.id = u.area_id
    where a.name = p_area_name and u.active
  );
end $$;

create or replace function hct_list_admins()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', id, 'first_name', first_name, 'last_name', last_name,
    'avatar_url', nullif(avatar_url, '')
  ) order by first_name), '[]'::json)
  from app_users where is_admin and active
$$;

create or replace function hct_list_module_members(p_module text)
returns json language plpgsql security definer set search_path = public as $$
declare v_client_id uuid := hct_current_client_id();
begin
  if v_client_id is null then
    raise exception 'No autorizado';
  end if;
  return (
    select coalesce(json_agg(json_build_object(
      'id', u.id, 'first_name', u.first_name, 'last_name', u.last_name,
      'avatar_url', nullif(u.avatar_url, '')
    ) order by u.first_name), '[]'::json)
    from app_users u
    where u.active and hct_user_has_module(u.id, p_module)
  );
end $$;
