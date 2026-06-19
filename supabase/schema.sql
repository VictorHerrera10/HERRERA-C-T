-- ============================================================
-- Herrera C&T — Esquema del sitio público + CMS
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Contenido editable por sección (clave → JSON)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Servicios mostrados en el sitio
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'code',
  accent text not null default 'burgundy', -- burgundy | azul | gold | esmeralda
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Testimonios de clientes
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  role text not null default '',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Proyectos / portafolio
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

-- Mensajes del formulario de contacto (leads)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null default '',
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tickets / mesa de ayuda
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

-- ── Seguridad (RLS) ─────────────────────────────────────────
-- NOTA: mientras el módulo de login no exista, las políticas de
-- escritura están abiertas para que el panel /admin funcione.
-- ⚠ Al implementar autenticación (fase final) se reemplazarán
-- por políticas restringidas al rol administrador.

alter table site_settings enable row level security;
alter table services enable row level security;
alter table testimonials enable row level security;
alter table projects enable row level security;
alter table leads enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;

drop policy if exists "temp all tickets" on tickets;
create policy "temp all tickets" on tickets for all using (true) with check (true);
drop policy if exists "temp all ticket_comments" on ticket_comments;
create policy "temp all ticket_comments" on ticket_comments for all using (true) with check (true);

drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);
drop policy if exists "temp write settings" on site_settings;
create policy "temp write settings" on site_settings for all using (true) with check (true);

drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (true);
drop policy if exists "temp write services" on services;
create policy "temp write services" on services for all using (true) with check (true);

drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (true);
drop policy if exists "temp write testimonials" on testimonials;
create policy "temp write testimonials" on testimonials for all using (true) with check (true);

drop policy if exists "public read projects" on projects;
create policy "public read projects" on projects for select using (true);
drop policy if exists "temp write projects" on projects;
create policy "temp write projects" on projects for all using (true) with check (true);

drop policy if exists "public insert leads" on leads;
create policy "public insert leads" on leads for insert with check (true);
drop policy if exists "temp manage leads" on leads;
create policy "temp manage leads" on leads for all using (true) with check (true);

-- Bucket público para imágenes de proyectos
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

drop policy if exists "public read projects bucket" on storage.objects;
create policy "public read projects bucket" on storage.objects
  for select using (bucket_id = 'projects');
drop policy if exists "temp upload projects bucket" on storage.objects;
create policy "temp upload projects bucket" on storage.objects
  for insert with check (bucket_id = 'projects');
drop policy if exists "temp delete projects bucket" on storage.objects;
create policy "temp delete projects bucket" on storage.objects
  for delete using (bucket_id = 'projects');

-- ── Contenido inicial (semilla) ─────────────────────────────

insert into site_settings (key, value) values
('hero', '{
  "eyebrow": "Consultoría & Tecnología",
  "title": "Ingeniería que sostiene",
  "titleAccent": "tu negocio",
  "subtitle": "Diseñamos, construimos y operamos la infraestructura digital de empresas que no pueden permitirse fallar. Software a medida, soporte continuo y dominio técnico real.",
  "ctaPrimary": "Conversemos tu proyecto",
  "ctaSecondary": "Ver servicios",
  "stats": [
    {"value": "+10", "label": "años de experiencia"},
    {"value": "99.9%", "label": "uptime garantizado"},
    {"value": "24/7", "label": "soporte dedicado"}
  ]
}'::jsonb),
('marquee', '{
  "items": ["Desarrollo a medida", "Infraestructura TI", "Soporte continuo", "Dominios & Hosting", "Ciberseguridad", "Consultoría estratégica", "Automatización"]
}'::jsonb),
('about', '{
  "eyebrow": "La consultora",
  "title": "Tecnología seria, trato directo",
  "paragraphs": [
    "Herrera Consulting & Technology nace de una convicción simple: las empresas merecen un socio tecnológico que hable claro, responda rápido y construya para durar.",
    "No vendemos horas: asumimos resultados. Cada proyecto se diseña con la infraestructura, la seguridad y el mantenimiento pensados desde el primer día."
  ],
  "bullets": [
    "Arquitectura y desarrollo de software a medida",
    "Operación y monitoreo de infraestructura crítica",
    "Acompañamiento estratégico de largo plazo"
  ]
}'::jsonb),
('process', '{
  "eyebrow": "Método",
  "title": "Cómo trabajamos",
  "steps": [
    {"title": "Diagnóstico", "description": "Entendemos tu operación, sus riesgos y sus oportunidades antes de proponer una sola línea de código."},
    {"title": "Propuesta clara", "description": "Alcance, plazos y costos por escrito. Sin letra chica ni sorpresas a mitad de camino."},
    {"title": "Construcción", "description": "Desarrollo iterativo con entregas visibles. Revisas avances reales, no promesas."},
    {"title": "Operación continua", "description": "Lanzar es el comienzo: monitoreamos, mantenemos y evolucionamos contigo."}
  ]
}'::jsonb),
('contact', '{
  "eyebrow": "Contacto",
  "title": "Hablemos de tu próximo paso",
  "subtitle": "Cuéntanos qué necesitas y te respondemos dentro del mismo día hábil.",
  "email": "vr.herrera.c@gmail.com",
  "phone": "",
  "whatsapp": "",
  "location": "Atención remota y presencial"
}'::jsonb),
('footer', '{
  "tagline": "Consultoría y tecnología para empresas que no se detienen.",
  "copyright": "Herrera Consulting & Technology. Todos los derechos reservados."
}'::jsonb)
on conflict (key) do nothing;

insert into services (title, description, icon, accent, sort_order) values
('Desarrollo de software a medida', 'Aplicaciones web y sistemas internos construidos exactamente para tu operación: ni más, ni menos.', 'code', 'burgundy', 1),
('Infraestructura & Cloud', 'Servidores, redes y nube dimensionados, seguros y monitoreados. Tu plataforma siempre disponible.', 'server', 'azul', 2),
('Soporte TI continuo', 'Mesa de ayuda con tiempos de respuesta comprometidos. Un equipo técnico que conoce tu empresa.', 'support', 'esmeralda', 3),
('Dominios & Hosting', 'Gestión integral de dominios, correos corporativos y alojamiento. Renovaciones sin sustos.', 'globe', 'gold', 4),
('Ciberseguridad', 'Auditoría, hardening y respaldo. Protegemos los datos que sostienen tu negocio.', 'shield', 'burgundy', 5),
('Consultoría estratégica', 'Decisiones tecnológicas con criterio de negocio: qué construir, qué comprar y cuándo.', 'chart', 'azul', 6)
on conflict do nothing;

insert into testimonials (quote, author, role, sort_order) values
('Pasamos de apagar incendios cada semana a olvidarnos de que la tecnología era un problema. Eso no tiene precio.', 'Cliente corporativo', 'Gerencia General', 1),
('Entendieron el negocio antes de hablar de software. La plataforma que construyeron la usamos todos los días.', 'Cliente PyME', 'Operaciones', 2)
on conflict do nothing;
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
