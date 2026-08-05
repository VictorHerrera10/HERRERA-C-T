-- ============================================================
-- Migración: sesión server-side + funciones seguras para la app
-- móvil (y el sitio web, ver migration-mobile-rls.sql)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Contexto: hasta ahora tickets/ticket_comments/leads se leían y
-- escribían directo desde el navegador con políticas RLS "temp"
-- (abiertas). Esta migración agrega una capa de sesión server-side
-- amarrada al login por DNI ya existente (auth_login), y expone
-- funciones SECURITY DEFINER (prefijo hct_) como única vía de
-- acceso a esos datos. El cierre real del acceso directo (revoke)
-- vive en migration-mobile-rls.sql — ejecutar ESTA migración primero
-- y validar que la app/el sitio funcionan con las nuevas funciones
-- antes de correr la de RLS.
-- ============================================================

-- ── Sesión server-side ──────────────────────────────────────

create table if not exists app_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
alter table app_sessions enable row level security;
revoke all on app_sessions from anon, authenticated;
-- sin políticas: solo accesible desde funciones SECURITY DEFINER

create or replace function hct_session_user_id(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from app_sessions
  where token = p_token and expires_at > now();

  if v_user_id is null then
    return null;
  end if;

  update app_sessions set last_seen_at = now() where token = p_token;
  return v_user_id;
end $$;

-- Devuelve true si el usuario tiene el módulo dado o es admin.
create or replace function hct_user_has_module(p_user_id uuid, p_module text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select is_admin or p_module = any(modules) from app_users where id = p_user_id and active),
    false
  )
$$;

-- ── auth_login: se reemplaza para además abrir una sesión ──
-- Mismo nombre y firma que ya usa el sitio web (no rompe nada);
-- el campo nuevo session_token se ignora si el llamador no lo lee.

create or replace function auth_login(p_dni text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_hash text;
  v_token uuid;
begin
  select u.id into v_id from app_users u where u.dni = p_dni and u.active;
  if v_id is null then return null; end if;

  select s.password_hash into v_hash
  from app_user_secrets s where s.user_id = v_id;
  if v_hash is null or not hct_check_password(p_password, v_hash) then
    return null;
  end if;

  update app_users set last_login_at = now() where id = v_id;

  insert into app_sessions (user_id) values (v_id) returning token into v_token;

  return (app_user_json(v_id)::jsonb || jsonb_build_object('session_token', v_token))::json;
end $$;

-- ── Tickets ──────────────────────────────────────────────────

create or replace function hct_list_tickets(p_token uuid, p_status text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(t order by t.created_at desc), '[]'::json)
    from tickets t
    where p_status is null or t.status = p_status
  );
end $$;

create or replace function hct_get_ticket(p_token uuid, p_ticket_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  return (
    select json_build_object(
      'ticket', (select row_to_json(t) from tickets t where t.id = p_ticket_id),
      'comments', (
        select coalesce(json_agg(c order by c.created_at asc), '[]'::json)
        from ticket_comments c where c.ticket_id = p_ticket_id
      )
    )
  );
end $$;

create or replace function hct_create_ticket(
  p_token uuid, p_title text, p_description text, p_client_name text,
  p_client_email text, p_category text, p_priority text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_ticket tickets;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  insert into tickets (title, description, client_name, client_email, category, priority)
  values (p_title, p_description, p_client_name, p_client_email, p_category, p_priority)
  returning * into v_ticket;

  return row_to_json(v_ticket);
end $$;

create or replace function hct_add_comment(p_token uuid, p_ticket_id uuid, p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_author text;
  v_comment ticket_comments;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  select coalesce(nullif(trim(first_name || ' ' || last_name), ''), 'Herrera C&T')
    into v_author from app_users where id = v_user_id;

  insert into ticket_comments (ticket_id, author, body)
  values (p_ticket_id, v_author, p_body)
  returning * into v_comment;

  update tickets set updated_at = now() where id = p_ticket_id;

  return row_to_json(v_comment);
end $$;

create or replace function hct_update_ticket_status(p_token uuid, p_ticket_id uuid, p_status text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_ticket tickets;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  update tickets set status = p_status, updated_at = now()
  where id = p_ticket_id
  returning * into v_ticket;

  return row_to_json(v_ticket);
end $$;

-- Actualización libre de campos del ticket (prioridad, categoría, etc.)
-- usada por el detalle de gestión. p_fields es un JSON con las columnas a
-- actualizar; se valida contra una lista blanca para evitar sobre-escritura
-- de columnas no previstas (ej. id, ticket_no).
create or replace function hct_update_ticket(p_token uuid, p_ticket_id uuid, p_fields json)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_ticket tickets;
  v_priority text := p_fields->>'priority';
  v_status text := p_fields->>'status';
  v_category text := p_fields->>'category';
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  update tickets set
    priority = coalesce(v_priority, priority),
    status = coalesce(v_status, status),
    category = coalesce(v_category, category),
    updated_at = now()
  where id = p_ticket_id
  returning * into v_ticket;

  return row_to_json(v_ticket);
end $$;

create or replace function hct_delete_ticket(p_token uuid, p_ticket_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  delete from tickets where id = p_ticket_id;
end $$;

-- ── Leads / mensajes de contacto ────────────────────────────

create or replace function hct_list_leads(p_token uuid, p_unread_only boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'website') then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(l order by l.created_at desc), '[]'::json)
    from leads l
    where not p_unread_only or l.read = false
  );
end $$;

create or replace function hct_mark_lead_read(p_token uuid, p_lead_id uuid, p_read boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_lead leads;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'website') then
    raise exception 'No autorizado';
  end if;

  update leads set read = p_read where id = p_lead_id returning * into v_lead;
  return row_to_json(v_lead);
end $$;

create or replace function hct_delete_lead(p_token uuid, p_lead_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'website') then
    raise exception 'No autorizado';
  end if;

  delete from leads where id = p_lead_id;
end $$;

-- ── Dashboard resumen ────────────────────────────────────────

create or replace function hct_dashboard_summary(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
  v_has_helpdesk boolean;
  v_has_website boolean;
  v_has_quotes boolean;
begin
  if v_user_id is null then
    raise exception 'No autorizado';
  end if;

  v_has_helpdesk := hct_user_has_module(v_user_id, 'helpdesk');
  v_has_website := hct_user_has_module(v_user_id, 'website');
  v_has_quotes := hct_user_has_module(v_user_id, 'quotes');

  return json_build_object(
    'open_tickets', case when v_has_helpdesk then
      (select count(*) from tickets where status in ('nuevo','analisis','desarrollo','espera')) else null end,
    'critical_tickets', case when v_has_helpdesk then
      (select count(*) from tickets where priority = 'critica' and status not in ('resuelto','cerrado')) else null end,
    'unread_leads', case when v_has_website then
      (select count(*) from leads where read = false) else null end,
    'pending_quotes', case when v_has_quotes then
      (select count(*) from quotes where status = 'enviada') else null end
  );
end $$;

-- ── Funciones PÚBLICAS (sin sesión) para el portal del cliente ──
-- El asistente de /soporte y el formulario de contacto del landing NO
-- tienen login (son de cara al cliente externo) y seguían usando
-- .from("tickets")/.from("leads") directo, que dejó de funcionar al
-- revocar el acceso anon/authenticated. Estas funciones reabren
-- exactamente esas operaciones puntuales — ni más ni menos que lo que
-- ya era público antes de esta migración — sin exponer el resto de
-- las tablas.

create or replace function hct_public_create_ticket(
  p_title text, p_description text, p_client_name text,
  p_client_email text, p_category text, p_priority text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_ticket tickets;
begin
  insert into tickets (title, description, client_name, client_email, category, priority)
  values (p_title, p_description, p_client_name, p_client_email, p_category, p_priority)
  returning * into v_ticket;
  return row_to_json(v_ticket);
end $$;

create or replace function hct_public_list_tickets_by_email(p_email text)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(t order by t.created_at desc), '[]'::json)
  from tickets t where t.client_email = lower(trim(p_email))
$$;

create or replace function hct_public_get_ticket_by_code(p_ticket_no int, p_email text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_ticket tickets;
begin
  select * into v_ticket from tickets
  where ticket_no = p_ticket_no and client_email = lower(trim(p_email));
  if v_ticket.id is null then return null; end if;

  return json_build_object(
    'ticket', row_to_json(v_ticket),
    'comments', (
      select coalesce(json_agg(c order by c.created_at asc), '[]'::json)
      from ticket_comments c where c.ticket_id = v_ticket.id
    )
  );
end $$;

create or replace function hct_public_get_ticket_comments(p_ticket_id uuid)
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(c order by c.created_at asc), '[]'::json)
  from ticket_comments c where c.ticket_id = p_ticket_id
$$;

-- El cliente solo puede comentar si conoce ticket_id + client_email exactos
-- (equivalente a lo que ya exigía la UI: código de ticket + correo).
create or replace function hct_public_add_ticket_comment(
  p_ticket_id uuid, p_client_email text, p_author text, p_body text
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_comment ticket_comments;
begin
  if not exists (
    select 1 from tickets where id = p_ticket_id and client_email = lower(trim(p_client_email))
  ) then
    raise exception 'No autorizado';
  end if;

  insert into ticket_comments (ticket_id, author, body)
  values (p_ticket_id, p_author, p_body)
  returning * into v_comment;

  update tickets set updated_at = now() where id = p_ticket_id;

  return row_to_json(v_comment);
end $$;

create or replace function hct_public_create_lead(
  p_name text, p_email text, p_company text, p_message text
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into leads (name, email, company, message)
  values (p_name, p_email, p_company, p_message);
end $$;

-- Conteo de leads sin leer para el resumen de /admin (que no tiene login).
create or replace function hct_public_unread_leads_count()
returns int language sql security definer set search_path = public as $$
  select count(*)::int from leads where read = false
$$;

-- ── Registro de tokens push (usado en la Fase 6) ────────────

create table if not exists device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
alter table device_push_tokens enable row level security;
revoke all on device_push_tokens from anon, authenticated;

create or replace function hct_register_push_token(
  p_token uuid, p_expo_push_token text, p_platform text default 'android'
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_session_user_id(p_token);
begin
  if v_user_id is null then
    raise exception 'No autorizado';
  end if;

  insert into device_push_tokens (user_id, expo_push_token, platform)
  values (v_user_id, p_expo_push_token, p_platform)
  on conflict (expo_push_token) do update
    set user_id = excluded.user_id, last_used_at = now();
end $$;
