-- ============================================================
-- Migración: Cotizaciones — Fase 1 (datos ampliados)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Contexto: ampliación del módulo de cotizaciones para capturar
-- datos de proyecto, cliente completo, plazo y términos — primer
-- paso del ciclo cotización → proyecto → finanzas.
-- ============================================================

alter table quotes
  add column if not exists project_summary text not null default '',
  add column if not exists client_company text not null default '',
  add column if not exists client_phone text not null default '',
  add column if not exists terms text not null default '',
  add column if not exists estimated_duration_text text not null default '',
  add column if not exists estimated_delivery_date date,
  add column if not exists client_accepted_duration boolean not null default false,
  add column if not exists origin text not null default 'consultor',
  add column if not exists assigned_to uuid references app_users(id) on delete set null;

-- Backfill: toda cotización existente queda asignada a quien la creó
update quotes set assigned_to = created_by where assigned_to is null;

-- Catálogo reutilizable de bloques de términos/políticas (mismo patrón
-- que catalog_items para líneas de precio)
create table if not exists quote_term_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table quote_term_templates enable row level security;
drop policy if exists "temp all quote_term_templates" on quote_term_templates;
create policy "temp all quote_term_templates" on quote_term_templates
  for all using (true) with check (true);
