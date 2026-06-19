-- ============================================================
-- Migración: módulo de Proyectos (tabla + almacenamiento de imágenes)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- (Si nunca ejecutaste schema.sql, ejecuta ese archivo completo
--  en su lugar — ya incluye esta migración.)
-- ============================================================

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default '',
  image_url text not null default '',
  link text not null default '',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

drop policy if exists "public read projects" on projects;
create policy "public read projects" on projects for select using (true);
-- ⚠ Política temporal hasta implementar login (fase final)
drop policy if exists "temp write projects" on projects;
create policy "temp write projects" on projects for all using (true) with check (true);

-- Bucket público para imágenes de proyectos
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

drop policy if exists "public read projects bucket" on storage.objects;
create policy "public read projects bucket" on storage.objects
  for select using (bucket_id = 'projects');
-- ⚠ Políticas temporales hasta implementar login (fase final)
drop policy if exists "temp upload projects bucket" on storage.objects;
create policy "temp upload projects bucket" on storage.objects
  for insert with check (bucket_id = 'projects');
drop policy if exists "temp delete projects bucket" on storage.objects;
create policy "temp delete projects bucket" on storage.objects
  for delete using (bucket_id = 'projects');
