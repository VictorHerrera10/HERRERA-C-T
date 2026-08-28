-- ============================================================
-- Migración: login del SITIO WEB pasa a usar Supabase Auth
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Contexto: el trabajador sigue ingresando con su DNI (se mapea a un
-- email interno "<dni>@herrera-ct.local" por debajo), pero la
-- contraseña/sesión ya no las maneja nuestro código a mano
-- (app_user_secrets + auth_login + app_sessions/session_token) sino
-- Supabase Auth nativo (auth.users, supabase.auth.signInWithPassword).
--
-- app_users SIGUE siendo la tabla maestra de negocio (nombre, área,
-- rol, módulos, is_admin). Solo se le agrega auth_user_id como puente
-- hacia auth.users.
--
-- La app móvil (herrera-ct-mobile/) NO se toca: sigue usando
-- auth_login/app_sessions/session_token tal cual. Por eso las
-- funciones hct_* de tickets/leads/dashboard pasan a aceptar AMBAS
-- vías de identificar al usuario (p_token de la app móvil, o la
-- sesión de Supabase Auth del sitio vía auth.uid()) con
-- coalesce(...) — un solo cuerpo sirve a los dos clientes.
-- ============================================================

-- ── Puente hacia Supabase Auth ──────────────────────────────

alter table app_users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- Resuelve app_users.id a partir de la sesión de Supabase Auth activa
-- (auth.uid()) — usada por el sitio web tras signInWithPassword().
create or replace function hct_current_user_id()
returns uuid language sql security definer set search_path = public as $$
  select id from app_users where auth_user_id = auth.uid() and active
$$;

-- Perfil de negocio del usuario logueado vía Supabase Auth (equivalente
-- a app_user_json(), pero resuelto por sesión en vez de por id explícito).
create or replace function hct_my_profile()
returns json language sql security definer set search_path = public as $$
  select app_user_json(hct_current_user_id())
$$;

-- Cierra el primer-ingreso (must_change_password) tras que el trabajador
-- cambia su contraseña vía supabase.auth.updateUser() en el sitio.
create or replace function hct_complete_password_change()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null then
    raise exception 'No autorizado';
  end if;

  update app_users
    set must_change_password = false, updated_at = now()
    where id = v_user_id;

  return app_user_json(v_user_id);
end $$;

-- ── Resolución de usuario compartida (app móvil por token, sitio por
--    sesión de Supabase Auth) para las RPCs hct_* de tickets/leads ──

create or replace function hct_resolve_user_id(p_token uuid)
returns uuid language sql security definer set search_path = public as $$
  select coalesce(hct_session_user_id(p_token), hct_current_user_id())
$$;

-- ── Tickets: p_token pasa a ser opcional (default null) ─────

create or replace function hct_list_tickets(p_token uuid default null, p_status text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_get_ticket(p_token uuid default null, p_ticket_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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
  p_token uuid default null, p_title text default null, p_description text default null,
  p_client_name text default null, p_client_email text default null,
  p_category text default null, p_priority text default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_add_comment(p_token uuid default null, p_ticket_id uuid default null, p_body text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_update_ticket_status(p_token uuid default null, p_ticket_id uuid default null, p_status text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_update_ticket(p_token uuid default null, p_ticket_id uuid default null, p_fields json default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_delete_ticket(p_token uuid default null, p_ticket_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'helpdesk') then
    raise exception 'No autorizado';
  end if;

  delete from tickets where id = p_ticket_id;
end $$;

-- ── Leads / mensajes de contacto ─────────────────────────────

create or replace function hct_list_leads(p_token uuid default null, p_unread_only boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

create or replace function hct_mark_lead_read(p_token uuid default null, p_lead_id uuid default null, p_read boolean default true)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
  v_lead leads;
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'website') then
    raise exception 'No autorizado';
  end if;

  update leads set read = p_read where id = p_lead_id returning * into v_lead;
  return row_to_json(v_lead);
end $$;

create or replace function hct_delete_lead(p_token uuid default null, p_lead_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'website') then
    raise exception 'No autorizado';
  end if;

  delete from leads where id = p_lead_id;
end $$;

-- ── Dashboard resumen ─────────────────────────────────────────

create or replace function hct_dashboard_summary(p_token uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := hct_resolve_user_id(p_token);
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

-- hct_register_push_token NO se toca: la usa solo la app móvil con su
-- propio session_token (ver supabase/migration-mobile.sql).
