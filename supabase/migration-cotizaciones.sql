-- ============================================================
-- Migración: módulo de Cotizaciones
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no serial,
  title text not null default '',
  client_name text not null default '',
  client_email text not null default '',
  currency text not null default 'USD',
  tax_rate numeric not null default 0,          -- % de impuesto (ej. 19)
  valid_until date,
  notes text not null default '',
  status text not null default 'borrador',      -- borrador | enviada | aprobada | rechazada | vencida
  client_note text not null default '',         -- comentario del cliente al decidir
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null default '',
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  sort_order int not null default 0
);

-- Catálogo de servicios reutilizable
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table catalog_items enable row level security;

-- ⚠ Políticas temporales hasta implementar login (fase final)
drop policy if exists "temp all quotes" on quotes;
create policy "temp all quotes" on quotes for all using (true) with check (true);
drop policy if exists "temp all quote_items" on quote_items;
create policy "temp all quote_items" on quote_items for all using (true) with check (true);
drop policy if exists "temp all catalog_items" on catalog_items;
create policy "temp all catalog_items" on catalog_items for all using (true) with check (true);
