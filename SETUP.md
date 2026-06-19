# Herrera C&T — Sitio web + Gestor de contenidos

Fase 4 (adelantada) de la plataforma: sitio público + CMS sin código.
Stack: Next.js 16 · React 19 · Tailwind CSS 4 · Motion · Supabase.

## Puesta en marcha

1. **Inicializar la base de datos (una sola vez):**
   - Entra a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
   - Copia y pega todo el contenido de `supabase/schema.sql` y presiona **Run**.
   - Esto crea las tablas (`site_settings`, `services`, `testimonials`, `leads`) y carga el contenido inicial.

2. **Levantar el sitio en desarrollo:**
   ```bash
   npm run dev
   ```
   - Sitio público: http://localhost:3000
   - Gestor de contenidos: http://localhost:3000/admin

3. El sitio funciona incluso sin la base de datos (muestra contenido por
   defecto), pero los cambios del gestor solo se guardan después del paso 1.

## Qué puedes editar desde /admin

| Sección del panel | Qué controla |
|---|---|
| Resumen | Estadísticas y accesos rápidos |
| Mesa de ayuda | Tickets de soporte: dashboard, prioridades, estados y conversación por ticket |
| Contenido del sitio | Portada, cinta de especialidades, Nosotros, Método, Contacto, pie de página |
| Servicios | Tarjetas de servicios (crear, editar, ocultar, eliminar, ícono y color) |
| Proyectos | Portafolio del sitio con subida de imágenes (Supabase Storage) |
| Testimonios | Citas de clientes |
| Mensajes recibidos | Bandeja de consultas del formulario de contacto |

> **SQL pendiente:** si ya ejecutaste el `schema.sql` original, ejecuta ahora
> `supabase/PENDIENTE-ejecutar-en-supabase.sql` (agrega Proyectos + Tickets).

## ⚠ Seguridad (temporal)

El panel `/admin` **aún no tiene login** — el módulo de autenticación se
implementará en la fase final del proyecto, y en ese momento se reemplazarán
las políticas RLS abiertas de `supabase/schema.sql` por políticas restringidas
al rol administrador. Hasta entonces: **no publiques este proyecto en
internet ni compartas la URL /admin**.

## Estructura

```
src/
├── app/
│   ├── page.tsx            ← Página pública (se renderiza fresca en cada visita)
│   ├── layout.tsx          ← Fuentes (Fraunces + Archivo) y metadatos
│   ├── globals.css         ← Sistema de diseño (paleta de marca, animaciones)
│   └── admin/              ← Gestor de contenidos (CMS)
├── components/
│   ├── site/               ← Secciones del sitio público
│   └── admin/              ← UI del panel
└── lib/
    ├── supabase.ts         ← Cliente de Supabase
    └── content.ts          ← Tipos + contenido por defecto + carga desde BD
supabase/schema.sql         ← Esquema + semilla (ejecutar en Supabase)
```
