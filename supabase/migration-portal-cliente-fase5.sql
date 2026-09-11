-- ============================================================
-- Migración: Fase 5 — Portal de Cliente (/portal)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Requiere: migration-proyectos-fase2.sql, migration-finanzas-fase4.sql
-- ya ejecutadas.
--
-- Contexto: los clientes obtienen una cuenta real (Supabase Auth con su
-- correo real, no el patrón <dni>@herrera-ct.local de trabajadores) para
-- ver sus cotizaciones/proyectos y crear una cotización preliminar que
-- se asigna a un consultor (aleatorio o elegido).
-- ============================================================

create table if not exists client_users (
  id uuid primary key default gen_random_uuid(),
  client_auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  company text not null default '',
  phone text not null default '',
  email text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table client_users enable row level security;
revoke all on client_users from anon, authenticated;

-- Columna para enlazar cotizaciones a la cuenta del cliente que las creó
-- o a la que pertenecen (más confiable que matchear solo por email).
alter table quotes
  add column if not exists client_user_id uuid references client_users(id) on delete set null;

-- ── Resolución de sesión de cliente ──────────────────────────

create or replace function hct_current_client_id()
returns uuid language sql security definer set search_path = public as $$
  select id from client_users where client_auth_user_id = auth.uid() and active
$$;

-- Completa el registro de negocio tras supabase.auth.signUp() en el portal.
create or replace function hct_complete_client_registration(
  p_first_name text, p_last_name text, p_email text,
  p_company text default '', p_phone text default ''
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_auth_id uuid := auth.uid();
  v_row client_users;
begin
  if v_auth_id is null then
    raise exception 'No autorizado';
  end if;

  insert into client_users (client_auth_user_id, first_name, last_name, email, company, phone)
  values (v_auth_id, p_first_name, p_last_name, lower(p_email), p_company, p_phone)
  on conflict (client_auth_user_id) do update set
    first_name = excluded.first_name, last_name = excluded.last_name,
    email = excluded.email, company = excluded.company, phone = excluded.phone
  returning * into v_row;

  return row_to_json(v_row);
end $$;

create or replace function hct_client_my_profile()
returns json language sql security definer set search_path = public as $$
  select row_to_json(c) from client_users c where c.id = hct_current_client_id()
$$;

-- ── Mis cotizaciones / proyectos (del cliente logueado) ──────

create or replace function hct_client_list_my_quotes()
returns json language plpgsql security definer set search_path = public as $$
declare v_client_id uuid := hct_current_client_id();
begin
  if v_client_id is null then
    raise exception 'No autorizado';
  end if;
  return (
    select coalesce(json_agg(q order by q.created_at desc), '[]'::json)
    from quotes q where q.client_user_id = v_client_id
  );
end $$;

create or replace function hct_client_list_my_projects()
returns json language plpgsql security definer set search_path = public as $$
declare v_client_id uuid := hct_current_client_id();
begin
  if v_client_id is null then
    raise exception 'No autorizado';
  end if;
  return (
    select coalesce(json_agg(json_build_object(
        'id', p.id, 'project_no', p.project_no, 'title', p.title,
        'stage', p.stage, 'manager_conformity_at', p.manager_conformity_at,
        'management_conformity_at', p.management_conformity_at,
        'client_conformity_at', p.client_conformity_at, 'closed_at', p.closed_at
      ) order by p.created_at desc), '[]'::json)
    from client_projects p
    join quotes q on q.id = p.quote_id
    where q.client_user_id = v_client_id
  );
end $$;

-- ── Miembros de un módulo (para elegir consultor específico) ─
-- Requiere sesión de CLIENTE válida (no de trabajador).

create or replace function hct_list_module_members(p_module text)
returns json language plpgsql security definer set search_path = public as $$
declare v_client_id uuid := hct_current_client_id();
begin
  if v_client_id is null then
    raise exception 'No autorizado';
  end if;
  return (
    select coalesce(json_agg(json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name)
      order by u.first_name), '[]'::json)
    from app_users u
    where u.active and hct_user_has_module(u.id, p_module)
  );
end $$;

-- ── Cotización preliminar creada por el cliente ──────────────

create or replace function hct_client_create_preliminary_quote(
  p_title text, p_project_summary text default '', p_budget_range text default '',
  p_assignment text default 'cualquiera', p_assigned_to uuid default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid := hct_current_client_id();
  v_client client_users;
  v_assigned uuid;
  v_row quotes;
begin
  if v_client_id is null then
    raise exception 'No autorizado';
  end if;
  select * into v_client from client_users where id = v_client_id;

  if p_assignment = 'especifico' and p_assigned_to is not null then
    if not hct_user_has_module(p_assigned_to, 'quotes') then
      raise exception 'El consultor elegido no tiene acceso al módulo de cotizaciones';
    end if;
    v_assigned := p_assigned_to;
  else
    select u.id into v_assigned
      from app_users u
      where u.active and hct_user_has_module(u.id, 'quotes')
      order by random() limit 1;
  end if;

  insert into quotes (
    title, project_summary, client_name, client_email, client_company,
    client_phone, notes, origin, client_user_id, assigned_to, created_by
  ) values (
    p_title, p_project_summary,
    trim(v_client.first_name || ' ' || v_client.last_name), v_client.email,
    v_client.company, v_client.phone,
    case when p_budget_range <> '' then 'Rango de presupuesto indicado por el cliente: ' || p_budget_range else '' end,
    'cliente', v_client_id, v_assigned, null
  ) returning * into v_row;

  return row_to_json(v_row);
end $$;
