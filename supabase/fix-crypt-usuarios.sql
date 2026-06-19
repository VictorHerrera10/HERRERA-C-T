-- ============================================================
-- PARCHE v2: "function crypt(text, text) does not exist"
--
-- Ejecutar COMPLETO en: Supabase Dashboard → SQL Editor →
-- New query (pega TODO el archivo SIN seleccionar texto:
-- si hay texto seleccionado, el editor ejecuta solo esa parte).
--
-- Estrategia: ya no se depende del search_path. Dos funciones
-- auxiliares localizan pgcrypto en el esquema donde esté y las
-- funciones de login las usan. Al final imprime un diagnóstico.
-- ============================================================

-- 1. Instalar pgcrypto si falta
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- 2. Auxiliares: encuentran pgcrypto estén donde estén crypt/gen_salt

create or replace function hct_pgcrypto_schema()
returns text language sql security definer set search_path = public as $$
  select n.nspname
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto'
$$;

create or replace function hct_hash_password(p_plain text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_sch text := hct_pgcrypto_schema();
  v_hash text;
begin
  if v_sch is null then
    raise exception 'pgcrypto no está instalada: actívala en Database → Extensions';
  end if;
  execute format('select %I.crypt($1, %I.gen_salt(''bf''))', v_sch, v_sch)
    into v_hash using p_plain;
  return v_hash;
end $$;

create or replace function hct_check_password(p_plain text, p_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_sch text := hct_pgcrypto_schema();
  v_ok boolean;
begin
  if v_sch is null then
    raise exception 'pgcrypto no está instalada: actívala en Database → Extensions';
  end if;
  execute format('select %I.crypt($1, $2) = $2', v_sch)
    into v_ok using p_plain, p_hash;
  return coalesce(v_ok, false);
end $$;

-- 3. Recrear las funciones de login usando los auxiliares

create or replace function app_user_json(p_id uuid)
returns json language sql security definer set search_path = public as $$
  select to_json(t) from (
    select u.id, u.dni, u.first_name, u.last_name, u.email, u.phone,
           u.avatar_url, u.is_admin, u.area_id, u.role_id, u.modules,
           u.must_change_password, u.active,
           a.name as area_name, r.name as role_name
    from app_users u
    left join areas a on a.id = u.area_id
    left join area_roles r on r.id = u.role_id
    where u.id = p_id
  ) t
$$;

create or replace function auth_login(p_dni text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_hash text;
begin
  select u.id into v_id from app_users u where u.dni = p_dni and u.active;
  if v_id is null then return null; end if;

  select s.password_hash into v_hash
  from app_user_secrets s where s.user_id = v_id;
  if v_hash is null or not hct_check_password(p_password, v_hash) then
    return null;
  end if;

  update app_users set last_login_at = now() where id = v_id;
  return app_user_json(v_id);
end $$;

create or replace function auth_change_password(p_user_id uuid, p_current text, p_new text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hash text;
begin
  select s.password_hash into v_hash
  from app_user_secrets s where s.user_id = p_user_id;
  if v_hash is null or not hct_check_password(p_current, v_hash) then
    return false;
  end if;

  update app_user_secrets
    set password_hash = hct_hash_password(p_new)
    where user_id = p_user_id;
  update app_users
    set must_change_password = false, updated_at = now()
    where id = p_user_id;
  return true;
end $$;

create or replace function admin_create_user(
  p_dni text, p_first_name text, p_last_name text,
  p_email text default '', p_phone text default '',
  p_is_admin boolean default false,
  p_area_id uuid default null, p_role_id uuid default null,
  p_modules text[] default '{}'
) returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into app_users (dni, first_name, last_name, email, phone,
                         is_admin, area_id, role_id, modules)
  values (p_dni, p_first_name, p_last_name, p_email, p_phone,
          p_is_admin, p_area_id, p_role_id, p_modules)
  returning id into v_id;

  insert into app_user_secrets (user_id, password_hash)
  values (v_id, hct_hash_password(p_dni));

  return app_user_json(v_id);
end $$;

create or replace function admin_reset_password(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_dni text;
begin
  select dni into v_dni from app_users where id = p_user_id;
  if v_dni is null then return; end if;
  update app_user_secrets
    set password_hash = hct_hash_password(v_dni)
    where user_id = p_user_id;
  update app_users
    set must_change_password = true, updated_at = now()
    where id = p_user_id;
end $$;

-- 4. Reparar la contraseña del admin semilla (vuelve a ser 00000000)
update app_user_secrets s
set password_hash = hct_hash_password(u.dni)
from app_users u
where u.id = s.user_id and u.dni = '00000000';

-- 5. DIAGNÓSTICO — la última tabla debe mostrar:
--    esquema_pgcrypto = extensions (o public) y login_ok = true
select
  hct_pgcrypto_schema() as esquema_pgcrypto,
  (auth_login('00000000', '00000000') is not null) as login_ok;
