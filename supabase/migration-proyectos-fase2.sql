-- ============================================================
-- Migración: Fase 2+3 — Conformidad del encargado + módulo "Proyectos"
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Requiere: migration-cotizaciones-fase1.sql, migration-areas-modulos.sql,
-- migration-usuarios-hct.sql (hct_require_admin), migration-auth-supabase.sql
-- (hct_current_user_id, hct_user_has_module base) ya ejecutadas.
--
-- Contexto: cuando el cliente aprueba una cotización, el encargado debe
-- confirmar explícitamente antes de que se convierta en un proyecto de
-- ejecución. El proyecto avanza por 3 etapas (requisitos → desarrollo →
-- gerencia) hasta quedar listo para la conformidad final del cliente.
-- ============================================================

-- ── Conformidad del encargado sobre la cotización ───────────

alter table quotes
  add column if not exists manager_confirmed_at timestamptz,
  add column if not exists manager_confirmation_note text not null default '';

-- ── Tabla principal: client_projects ────────────────────────
-- (nombre distinto de "projects", que es el portafolio público del sitio)

create table if not exists client_projects (
  id uuid primary key default gen_random_uuid(),
  project_no serial,
  quote_id uuid references quotes(id) on delete set null,
  title text not null default '',
  project_summary text not null default '',
  client_name text not null default '',
  client_email text not null default '',
  client_company text not null default '',
  client_phone text not null default '',
  manager_id uuid references app_users(id) on delete set null,
  dev_user_id uuid references app_users(id) on delete set null,
  stage text not null default 'requisitos',            -- requisitos | desarrollo | gerencia | cerrado
  dev_progress_stage text,                              -- analisis | diseno | implementacion | pruebas | listo
  dev_progress_note text not null default '',
  manager_conformity_at timestamptz,
  management_conformity_at timestamptz,
  client_conformity_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_project_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references client_projects(id) on delete cascade,
  label text not null default '',
  value text not null default '',
  sort_order int not null default 0,
  kind text not null default 'text',                    -- text | file_ref | boolean
  created_at timestamptz not null default now()
);

create table if not exists client_project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references client_projects(id) on delete cascade,
  label text not null default '',
  url text not null default '',
  uploaded_by uuid references app_users(id) on delete set null,
  stage_at_upload text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists client_project_conformities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references client_projects(id) on delete cascade,
  role text not null,                                   -- manager | management
  user_id uuid references app_users(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists client_project_client_conformity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references client_projects(id) on delete cascade,
  checklist json not null default '[]'::json,
  satisfaction_manager int,
  satisfaction_company int,
  comment_manager text not null default '',
  comment_company text not null default '',
  signed_at timestamptz,
  signed_by_name text not null default '',
  signed_by_email text not null default '',
  created_at timestamptz not null default now()
);

alter table client_projects enable row level security;
alter table client_project_requirements enable row level security;
alter table client_project_resources enable row level security;
alter table client_project_conformities enable row level security;
alter table client_project_client_conformity enable row level security;

-- Sin políticas directas a propósito: todo acceso pasa por funciones
-- hct_* SECURITY DEFINER (patrón seguro, distinto del "temp all" de
-- quotes/ventas).
revoke all on client_projects, client_project_requirements,
  client_project_resources, client_project_conformities,
  client_project_client_conformity
  from anon, authenticated;

-- ── Bucket de Storage para recursos de proyecto ─────────────

insert into storage.buckets (id, name, public)
values ('client-projects', 'client-projects', true)
on conflict (id) do nothing;

drop policy if exists "public read client-projects bucket" on storage.objects;
create policy "public read client-projects bucket" on storage.objects
  for select using (bucket_id = 'client-projects');
drop policy if exists "temp upload client-projects bucket" on storage.objects;
create policy "temp upload client-projects bucket" on storage.objects
  for insert with check (bucket_id = 'client-projects');

-- ── Helpers de proyecto ──────────────────────────────────────

create or replace function project_code(p_no int)
returns text language sql immutable as $$
  select 'PRY-' || lpad(p_no::text, 4, '0')
$$;

-- Miembros activos de un área (para que el encargado elija a quién
-- asignar desarrollo). Exposición mínima: solo id + nombre.
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
    select coalesce(json_agg(json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name)
      order by u.first_name), '[]'::json)
    from app_users u
    join areas a on a.id = u.area_id
    where a.name = p_area_name and u.active
  );
end $$;

-- ── Confirmación del encargado: dispara la creación del proyecto ───

create or replace function hct_confirm_quote_manager(p_quote_id uuid, p_note text default '')
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_quote quotes;
  v_project client_projects;
begin
  if v_user_id is null then
    raise exception 'No autorizado';
  end if;

  select * into v_quote from quotes where id = p_quote_id;
  if v_quote is null then
    raise exception 'Cotización no encontrada';
  end if;
  if not (v_quote.created_by = v_user_id or v_quote.assigned_to = v_user_id
    or exists (select 1 from app_users where id = v_user_id and is_admin)) then
    raise exception 'No autorizado';
  end if;
  if v_quote.status <> 'aprobada' then
    raise exception 'La cotización aún no fue aprobada por el cliente';
  end if;

  update quotes set
    manager_confirmed_at = now(),
    manager_confirmation_note = p_note,
    updated_at = now()
  where id = p_quote_id;

  insert into client_projects (
    quote_id, title, project_summary, client_name, client_email,
    client_company, client_phone, manager_id
  ) values (
    v_quote.id, v_quote.title, v_quote.project_summary, v_quote.client_name,
    v_quote.client_email, v_quote.client_company, v_quote.client_phone,
    coalesce(v_quote.assigned_to, v_quote.created_by, v_user_id)
  ) returning * into v_project;

  return row_to_json(v_project);
end $$;

-- ── Listado y detalle de proyectos (visibilidad por rol) ────

create or replace function hct_list_projects(p_stage text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_is_admin boolean;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  select is_admin into v_is_admin from app_users where id = v_user_id;

  return (
    select coalesce(json_agg(p order by p.created_at desc), '[]'::json)
    from client_projects p
    where (p_stage is null or p.stage = p_stage)
      and (
        v_is_admin
        or p.manager_id = v_user_id
        or p.dev_user_id = v_user_id
        or (p.stage = 'desarrollo' and p.dev_user_id is null)
      )
  );
end $$;

create or replace function hct_get_project(p_project_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;

  return (
    select json_build_object(
      'project', (select row_to_json(p) from client_projects p where p.id = p_project_id),
      'requirements', (
        select coalesce(json_agg(r order by r.sort_order), '[]'::json)
        from client_project_requirements r where r.project_id = p_project_id
      ),
      'resources', (
        select coalesce(json_agg(res order by res.created_at), '[]'::json)
        from client_project_resources res where res.project_id = p_project_id
      ),
      'conformities', (
        select coalesce(json_agg(c order by c.created_at), '[]'::json)
        from client_project_conformities c where c.project_id = p_project_id
      )
    )
  );
end $$;

-- ── Requisitos (etapa 1, arma el encargado) ─────────────────

create or replace function hct_add_project_requirement(
  p_project_id uuid, p_label text, p_value text default '', p_kind text default 'text'
) returns client_project_requirements language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_project_requirements;
  v_next_order int;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  select coalesce(max(sort_order), 0) + 1 into v_next_order
    from client_project_requirements where project_id = p_project_id;
  insert into client_project_requirements (project_id, label, value, kind, sort_order)
  values (p_project_id, p_label, p_value, p_kind, v_next_order)
  returning * into v_row;
  return v_row;
end $$;

create or replace function hct_update_project_requirement(
  p_requirement_id uuid, p_label text, p_value text
) returns client_project_requirements language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_project_requirements;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  update client_project_requirements set label = p_label, value = p_value
  where id = p_requirement_id
  returning * into v_row;
  return v_row;
end $$;

create or replace function hct_delete_project_requirement(p_requirement_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  delete from client_project_requirements where id = p_requirement_id;
end $$;

create or replace function hct_add_project_resource(
  p_project_id uuid, p_label text, p_url text
) returns client_project_resources language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_project_resources;
  v_stage text;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  select stage into v_stage from client_projects where id = p_project_id;
  insert into client_project_resources (project_id, label, url, uploaded_by, stage_at_upload)
  values (p_project_id, p_label, p_url, v_user_id, coalesce(v_stage, ''))
  returning * into v_row;
  return v_row;
end $$;

-- ── Transición requisitos → desarrollo ──────────────────────

create or replace function hct_send_to_development(p_project_id uuid, p_dev_user_id uuid)
returns client_projects language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_projects;
  v_count int;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  select count(*) into v_count from client_project_requirements where project_id = p_project_id;
  if v_count = 0 then
    raise exception 'Agrega al menos un requisito antes de enviar a desarrollo';
  end if;
  update client_projects set
    stage = 'desarrollo', dev_user_id = p_dev_user_id, updated_at = now()
  where id = p_project_id and stage = 'requisitos'
  returning * into v_row;
  if v_row is null then
    raise exception 'El proyecto no está en la etapa de requisitos';
  end if;
  return v_row;
end $$;

-- ── Avance de desarrollo (5 sub-etapas del ciclo de software) ─

create or replace function hct_update_dev_progress(
  p_project_id uuid, p_stage text, p_note text default ''
) returns client_projects language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_projects;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  update client_projects set
    dev_progress_stage = p_stage, dev_progress_note = p_note, updated_at = now()
  where id = p_project_id
    and (dev_user_id = v_user_id or exists (
      select 1 from app_users where id = v_user_id and is_admin
    ))
  returning * into v_row;
  if v_row is null then
    raise exception 'No autorizado a actualizar este proyecto';
  end if;
  return v_row;
end $$;

-- ── Transición desarrollo → gerencia ─────────────────────────

create or replace function hct_send_to_management(p_project_id uuid)
returns client_projects language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_projects;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'projects') then
    raise exception 'No autorizado';
  end if;
  update client_projects set stage = 'gerencia', updated_at = now()
  where id = p_project_id and stage = 'desarrollo' and dev_progress_stage = 'listo'
  returning * into v_row;
  if v_row is null then
    raise exception 'El proyecto no está listo para pasar a gerencia';
  end if;
  return v_row;
end $$;

-- ── Conformidades internas (encargado + gerencia = is_admin) ─

create or replace function hct_confirm_project(
  p_project_id uuid, p_role text, p_note text default ''
) returns client_projects language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
  v_row client_projects;
begin
  if v_user_id is null then
    raise exception 'No autorizado';
  end if;
  if p_role = 'management' then
    perform hct_require_admin();
  elsif p_role <> 'manager' then
    raise exception 'Rol de conformidad inválido';
  end if;

  insert into client_project_conformities (project_id, role, user_id, note)
  values (p_project_id, p_role, v_user_id, p_note);

  if p_role = 'manager' then
    update client_projects set manager_conformity_at = now(), updated_at = now()
    where id = p_project_id returning * into v_row;
  else
    update client_projects set management_conformity_at = now(), updated_at = now()
    where id = p_project_id returning * into v_row;
  end if;
  return v_row;
end $$;

-- ── Vista pública del cliente (solo lectura, código+correo) ──

create or replace function hct_public_get_project_for_client(p_project_no int, p_email text)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'id', p.id, 'project_no', p.project_no, 'title', p.title,
    'project_summary', p.project_summary, 'stage', p.stage,
    'manager_conformity_at', p.manager_conformity_at,
    'management_conformity_at', p.management_conformity_at,
    'client_conformity_at', p.client_conformity_at,
    'closed_at', p.closed_at
  )
  from client_projects p
  where p.project_no = p_project_no and p.client_email = lower(p_email)
$$;

-- ── Firma final del cliente: cierra el proyecto y dispara Finanzas ─

create or replace function hct_client_sign_project(
  p_project_no int, p_email text, p_checklist json,
  p_satisfaction_manager int, p_satisfaction_company int,
  p_comment_manager text default '', p_comment_company text default '',
  p_signed_by_name text default ''
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_project client_projects;
begin
  select * into v_project from client_projects
    where project_no = p_project_no and client_email = lower(p_email);
  if v_project is null then
    raise exception 'Proyecto no encontrado';
  end if;
  if v_project.manager_conformity_at is null or v_project.management_conformity_at is null then
    raise exception 'El proyecto aún no tiene todas las conformidades internas';
  end if;

  insert into client_project_client_conformity (
    project_id, checklist, satisfaction_manager, satisfaction_company,
    comment_manager, comment_company, signed_at, signed_by_name, signed_by_email
  ) values (
    v_project.id, p_checklist, p_satisfaction_manager, p_satisfaction_company,
    p_comment_manager, p_comment_company, now(), p_signed_by_name, lower(p_email)
  );

  update client_projects set
    client_conformity_at = now(), stage = 'cerrado', closed_at = now(), updated_at = now()
  where id = v_project.id;

  -- El ingreso económico se registra en Finanzas (migration-finanzas.sql)
  -- vía trigger o llamada posterior; en esta migración solo se cierra el
  -- proyecto para no acoplar el orden de despliegue de ambas fases.

  return json_build_object('ok', true, 'project_id', v_project.id);
end $$;
