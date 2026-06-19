-- ============================================================
-- Módulo: Ventas — Tecnología & Librería
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Categorías de productos
create table if not exists product_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  icon       text not null default 'rocket',
  sort_order int  not null default 0
);

insert into product_categories (slug, name, icon, sort_order) values
  ('tecnologia',    'Tecnología',            'chip',   1),
  ('libreria',      'Librería',              'wrench', 2),
  ('personalizados','Objetos Personalizados','star',   3)
on conflict (slug) do nothing;

-- Productos
create table if not exists products_ventas (
  id           uuid    primary key default gen_random_uuid(),
  category_id  uuid    not null references product_categories(id) on delete restrict,
  name         text    not null,
  description  text    not null default '',
  price        numeric(12,2) not null default 0,
  currency     text    not null default 'PEN',
  stock        int     not null default 0,
  stock_min    int     not null default 5,
  image_url    text    not null default '',
  sku          text    not null default '',
  published    boolean not null default true,
  sort_order   int     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Órdenes de interés
create table if not exists sale_orders (
  id           uuid    primary key default gen_random_uuid(),
  order_no     serial  not null,
  client_name  text    not null,
  client_email text    not null,
  client_phone text    not null default '',
  notes        text    not null default '',
  status       text    not null default 'nueva',
  total        numeric(12,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Ítems de la orden
create table if not exists sale_order_items (
  id           uuid    primary key default gen_random_uuid(),
  order_id     uuid    not null references sale_orders(id) on delete cascade,
  product_id   uuid    references products_ventas(id) on delete set null,
  product_name text    not null,
  unit_price   numeric(12,2) not null,
  qty          int     not null default 1
);

-- RLS
alter table product_categories enable row level security;
alter table products_ventas    enable row level security;
alter table sale_orders        enable row level security;
alter table sale_order_items   enable row level security;

-- Categorías: lectura pública
drop policy if exists "public read categories" on product_categories;
create policy "public read categories" on product_categories for select using (true);

-- Productos: lectura pública (solo publicados la filtran en el cliente), escritura temp
drop policy if exists "public read products_ventas"  on products_ventas;
create policy "public read products_ventas"  on products_ventas for select using (true);
-- ⚠ Política temporal hasta implementar login (fase final)
drop policy if exists "temp write products_ventas" on products_ventas;
create policy "temp write products_ventas" on products_ventas for all using (true) with check (true);

-- Órdenes: temp (cliente inserta, equipo lee/edita)
drop policy if exists "temp all sale_orders" on sale_orders;
create policy "temp all sale_orders" on sale_orders for all using (true) with check (true);
drop policy if exists "temp all sale_order_items" on sale_order_items;
create policy "temp all sale_order_items" on sale_order_items for all using (true) with check (true);
-- ⚠ Políticas temporales hasta fase final

-- Bucket para imágenes de productos
insert into storage.buckets (id, name, public)
values ('ventas-products', 'ventas-products', true)
on conflict (id) do nothing;

drop policy if exists "public read ventas bucket" on storage.objects;
create policy "public read ventas bucket" on storage.objects
  for select using (bucket_id = 'ventas-products');
-- ⚠ Temporales
drop policy if exists "temp upload ventas bucket" on storage.objects;
create policy "temp upload ventas bucket" on storage.objects
  for insert with check (bucket_id = 'ventas-products');
drop policy if exists "temp delete ventas bucket" on storage.objects;
create policy "temp delete ventas bucket" on storage.objects
  for delete using (bucket_id = 'ventas-products');
drop policy if exists "temp update ventas bucket" on storage.objects;
create policy "temp update ventas bucket" on storage.objects
  for update using (bucket_id = 'ventas-products');
