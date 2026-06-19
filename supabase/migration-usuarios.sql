-- ============================================================
-- Migración: módulo de Usuarios (login de trabajadores)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Lógica:
--  · Nadie se registra solo: el ADMINISTRADOR crea los usuarios.
--  · Usuario = DNI; contraseña inicial = el mismo DNI.
--  · En el primer login se obliga a cambiar la contraseña.
--  · El admin define a qué módulos accede cada trabajador
--    (website | helpdesk | quotes) y crea áreas con roles.
--  · Los hashes de contraseña viven en app_user_secrets, tabla
--    SIN políticas de lectura: solo las funciones SECURITY DEFINER
--    pueden tocarla. El navegador nunca ve un hash.
--
-- Usuario semilla: DNI 00000000 / contraseña 00000000 (admin).
-- Cámbiale el DNI desde /usuarios después del primer ingreso.
-- ============================================================

-- pgcrypto (provee crypt/gen_salt)
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ── Áreas y roles (los crea el administrador) ───────────────

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists area_roles (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (area_id, name)
);

-- ── Usuarios de la plataforma (trabajadores de la consultora) ─

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  dni text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  avatar_url text not null default '',
  is_admin boolean not null default false,
  area_id uuid references areas(id) on delete set null,
  role_id uuid references area_roles(id) on delete set null,
  modules text[] not null default '{}',          -- website | helpdesk | quotes
  must_change_password boolean not null default true,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hashes separados: tabla con RLS y SIN políticas (inaccesible vía API)
create table if not exists app_user_secrets (
  user_id uuid primary key references app_users(id) on delete cascade,
  password_hash text not null
);

alter table areas enable row level security;
alter table area_roles enable row level security;
alter table app_users enable row level security;
alter table app_user_secrets enable row level security;

-- ⚠ Políticas temporales hasta endurecer RLS con sesiones reales
drop policy if exists "temp all areas" on areas;
create policy "temp all areas" on areas for all using (true) with check (true);
drop policy if exists "temp all area_roles" on area_roles;
create policy "temp all area_roles" on area_roles for all using (true) with check (true);
drop policy if exists "temp all app_users" on app_users;
create policy "temp all app_users" on app_users for all using (true) with check (true);
-- app_user_secrets: SIN políticas a propósito → ningún acceso directo.
revoke all on app_user_secrets from anon, authenticated;

-- ── Funciones (SECURITY DEFINER: las únicas que ven los hashes) ─

-- Auxiliares: localizan pgcrypto en el esquema donde esté instalada,
-- sin depender del search_path (varía entre proyectos de Supabase).
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

-- Devuelve el usuario con nombres de área/rol resueltos
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

-- Login con DNI + contraseña. Devuelve el usuario o null.
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

-- Cambio de contraseña (verifica la actual). True si tuvo éxito.
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

-- Alta de usuario (solo la usa el admin). Contraseña inicial = DNI.
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

-- Restablece la contraseña al DNI y vuelve a exigir el cambio.
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

-- ── Usuario semilla: administrador inicial ──────────────────

do $$
declare v_id uuid;
begin
  if not exists (select 1 from app_users where dni = '00000000') then
    insert into app_users (dni, first_name, last_name, is_admin, modules,
                           must_change_password)
    values ('00000000', 'Administrador', 'Herrera C&T', true,
            array['website','helpdesk','quotes'], true)
    returning id into v_id;
    insert into app_user_secrets (user_id, password_hash)
    values (v_id, hct_hash_password('00000000'));
  end if;
end $$;

-- ── Bucket "users" (fotos de perfil) — ya creado en el panel;
--    aquí solo se asegura y se le dan políticas ───────────────

insert into storage.buckets (id, name, public)
values ('users', 'users', true)
on conflict (id) do nothing;

drop policy if exists "public read users bucket" on storage.objects;
create policy "public read users bucket" on storage.objects
  for select using (bucket_id = 'users');
-- ⚠ Políticas temporales hasta endurecer RLS
drop policy if exists "temp upload users bucket" on storage.objects;
create policy "temp upload users bucket" on storage.objects
  for insert with check (bucket_id = 'users');
drop policy if exists "temp update users bucket" on storage.objects;
create policy "temp update users bucket" on storage.objects
  for update using (bucket_id = 'users');
drop policy if exists "temp delete users bucket" on storage.objects;
create policy "temp delete users bucket" on storage.objects
  for delete using (bucket_id = 'users');
