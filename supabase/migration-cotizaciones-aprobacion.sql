-- ============================================================
-- Migración: autor + aprobación INTERNA de cotizaciones
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Contexto: antes de mandar la cotización al cliente, el trabajador
-- que la arma puede enviarla a un administrador de la plataforma para
-- que la revise. Esto es independiente del flujo ya existente de
-- decisión del CLIENTE (status: borrador/enviada/aprobada/rechazada/
-- vencida) — approval_status vive en paralelo, sin tocar ese flujo.
-- ============================================================

alter table quotes
  add column if not exists created_by uuid references app_users(id) on delete set null,
  add column if not exists approver_id uuid references app_users(id) on delete set null,
  add column if not exists approval_status text, -- null | pendiente | aprobada | rechazada
  add column if not exists approval_note text not null default '',
  add column if not exists approved_at timestamptz;

-- ── Lectura de nombres de app_users para el módulo de cotizaciones ──
-- app_users no tiene SELECT directo desde anon/authenticated (revocado
-- en migration-mobile-rls.sql) — estas RPCs exponen solo lo mínimo
-- (id + nombre) que necesita la UI, sin abrir la tabla completa.

-- Administradores activos, para elegir a quién enviar una cotización a
-- revisión. Si devuelve vacío, el editor oculta esa opción.
create or replace function hct_list_admins()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'id', id, 'first_name', first_name, 'last_name', last_name
  ) order by first_name), '[]'::json)
  from app_users where is_admin and active
$$;

-- Nombre de un usuario puntual (autor de la cotización), por id.
create or replace function hct_user_name(p_user_id uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object('id', id, 'first_name', first_name, 'last_name', last_name)
  from app_users where id = p_user_id
$$;
