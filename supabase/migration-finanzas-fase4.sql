-- ============================================================
-- Migración: Fase 4 — módulo "Finanzas"
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Requiere: migration-proyectos-fase2.sql (client_projects,
-- hct_client_sign_project) ya ejecutada.
--
-- Contexto: al firmar el cliente su conformidad final (Fase 3), el
-- proyecto se cierra y debe registrarse automáticamente el ingreso
-- económico correspondiente, visible en el nuevo módulo Finanzas
-- (acceso: área Finanzas + administradores, vía hct_user_has_module).
-- ============================================================

create table if not exists project_income (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references client_projects(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  income_date date not null default current_date,
  reference text not null default '',
  created_at timestamptz not null default now()
);

alter table project_income enable row level security;
revoke all on project_income from anon, authenticated;

-- ── Listado y resumen (requieren módulo 'finanzas' o admin) ──

create or replace function hct_list_project_income(p_from date default null, p_to date default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'finanzas') then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(i order by i.income_date desc), '[]'::json)
    from project_income i
    where (p_from is null or i.income_date >= p_from)
      and (p_to is null or i.income_date <= p_to)
  );
end $$;

create or replace function hct_project_income_summary()
returns json language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := hct_current_user_id();
begin
  if v_user_id is null or not hct_user_has_module(v_user_id, 'finanzas') then
    raise exception 'No autorizado';
  end if;

  return (
    select coalesce(json_agg(t), '[]'::json) from (
      select currency, sum(amount) as total, count(*) as count
      from project_income
      group by currency
    ) t
  );
end $$;

-- ── Disparo automático desde el cierre del proyecto ─────────
-- Reemplaza hct_client_sign_project para insertar el ingreso en la
-- misma transacción, usando el total de la cotización original.
-- Misma firma exacta que la versión de migration-proyectos-fase2.sql
-- (8 parámetros, incluye p_signed_by_name) — create or replace SÍ la
-- reemplaza correctamente porque coincide.

create or replace function hct_client_sign_project(
  p_project_no int, p_email text, p_checklist json,
  p_satisfaction_manager int, p_satisfaction_company int,
  p_comment_manager text default '', p_comment_company text default '',
  p_signed_by_name text default ''
) returns json language plpgsql security definer set search_path = public as $$
declare
  v_project client_projects;
  v_quote quotes;
  v_subtotal numeric;
  v_total numeric;
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

  -- Calcula el total de la cotización original (subtotal + impuesto)
  if v_project.quote_id is not null then
    select * into v_quote from quotes where id = v_project.quote_id;
    -- OJO: "v_quote is not null" sobre un record es false si CUALQUIER
    -- columna es NULL (ej. valid_until, decided_at), no solo cuando no
    -- se encontró fila. Se usa v_quote.id para chequear existencia real.
    if v_quote.id is not null then
      select coalesce(sum(qty * unit_price), 0) into v_subtotal
        from quote_items where quote_id = v_quote.id;
      v_total := v_subtotal + v_subtotal * (v_quote.tax_rate / 100);

      insert into project_income (project_id, quote_id, amount, currency, reference)
      values (
        v_project.id, v_quote.id, v_total, v_quote.currency,
        'Cierre de ' || 'PRY-' || lpad(v_project.project_no::text, 4, '0')
      );
    end if;
  end if;

  return json_build_object('ok', true, 'project_id', v_project.id);
end $$;
