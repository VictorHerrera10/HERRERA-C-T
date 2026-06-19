-- ============================================================
-- Migración: módulo de Tickets / Mesa de Ayuda
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- (Si nunca ejecutaste schema.sql, ejecuta ese archivo completo
--  en su lugar — ya incluye esta migración.)
-- ============================================================

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no serial,
  title text not null,
  description text not null default '',
  client_name text not null default '',
  client_email text not null default '',
  category text not null default 'soporte',     -- soporte | caida | funcionalidad
  priority text not null default 'media',       -- baja | media | alta | critica
  status text not null default 'nuevo',         -- nuevo | analisis | desarrollo | espera | resuelto | cerrado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author text not null default 'Herrera C&T',
  body text not null,
  created_at timestamptz not null default now()
);

alter table tickets enable row level security;
alter table ticket_comments enable row level security;

-- ⚠ Políticas temporales hasta implementar login (fase final)
drop policy if exists "temp all tickets" on tickets;
create policy "temp all tickets" on tickets for all using (true) with check (true);
drop policy if exists "temp all ticket_comments" on ticket_comments;
create policy "temp all ticket_comments" on ticket_comments for all using (true) with check (true);
