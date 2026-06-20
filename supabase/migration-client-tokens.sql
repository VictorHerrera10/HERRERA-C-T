-- ============================================================
-- Migración: client_tokens
-- Tokens para identificar clientes externos (otras plataformas)
-- que acceden a /ventas y /soporte de herrera-ct.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists client_tokens (
  id          uuid        primary key default gen_random_uuid(),
  token       text        not null unique,       -- nanoid 20 chars
  -- datos del usuario
  user_name   text        not null,
  user_dni    text        not null default '',
  user_email  text        not null default '',
  user_phone  text        not null default '',
  user_role   text        not null default '',   -- "Gerente", "Admin", etc.
  -- datos de la empresa cliente
  client_name    text     not null,
  client_ruc     text     not null default '',
  client_address text     not null default '',
  client_phone   text     not null default '',
  client_sector  text     not null default '',   -- "Ferretería", "Educación", etc.
  -- control
  modules     text[]      not null default '{}', -- ['ventas','helpdesk']
  source      text        not null default '',   -- nombre del proyecto de origen
  expires_at  timestamptz,                       -- null = no vence
  created_at  timestamptz not null default now()
);

alter table client_tokens enable row level security;
-- Sin políticas: solo accesible via RPC SECURITY DEFINER
revoke all on client_tokens from anon, authenticated;

-- ── RPC: crea un token nuevo ────────────────────────────────
create or replace function create_client_token(
  p_user_name    text,
  p_user_dni     text    default '',
  p_user_email   text    default '',
  p_user_phone   text    default '',
  p_user_role    text    default '',
  p_client_name  text    default '',
  p_client_ruc   text    default '',
  p_client_address text  default '',
  p_client_phone text    default '',
  p_client_sector text   default '',
  p_modules      text[]  default '{}',
  p_source       text    default '',
  p_expires_at   timestamptz default null
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_token text;
  v_id    uuid;
begin
  -- Genera token aleatorio de 20 chars (hex seguro)
  v_token := encode(gen_random_bytes(15), 'hex');

  insert into client_tokens (
    token, user_name, user_dni, user_email, user_phone, user_role,
    client_name, client_ruc, client_address, client_phone, client_sector,
    modules, source, expires_at
  ) values (
    v_token, p_user_name, p_user_dni, p_user_email, p_user_phone, p_user_role,
    p_client_name, p_client_ruc, p_client_address, p_client_phone, p_client_sector,
    p_modules, p_source, p_expires_at
  ) returning id into v_id;

  return json_build_object(
    'id',    v_id,
    'token', v_token
  );
end $$;

-- ── RPC: resuelve un token → devuelve datos del cliente ─────
create or replace function resolve_client_token(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_row client_tokens;
begin
  select * into v_row from client_tokens where token = p_token;

  if not found then return null; end if;

  -- Verifica vencimiento
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return null;
  end if;

  return to_json(v_row);
end $$;
