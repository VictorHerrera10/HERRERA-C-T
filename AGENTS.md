<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto del proyecto — Herrera C&T

Plataforma de gestión de la consultora Herrera Consulting & Technology. Propuesta completa de módulos en `../PROPUESTA-DESARROLLO.md`; instrucciones en `SETUP.md`.

## Arquitectura modular (REGLA: los módulos se conectan pero NO se mezclan)

```
src/modules/
├── shared/          → supabase client, Icon, Badge, StatCard, EmptyState, Spinner, Reveal, FloatingIcons, Toast, PageTransition (uso transversal)
├── website/         → sitio público + su gestor (admin/): components/, admin/, lib/content.ts
├── helpdesk/        → mesa de ayuda: lib/tickets.ts, lib/wizard.ts, components/ClientPortal.tsx
├── quotes/          → cotizaciones: lib/quotes.ts, components/ClientQuoteView.tsx
├── ventas/          → catálogo + órdenes: lib/ventas.ts, components/GestorVentas.tsx, CatalogoView.tsx
├── projects/        → ejecución de proyectos (post-venta): lib/projects.ts, components/
├── finanzas/        → ingresos por proyecto cerrado: lib/finanzas.ts
├── portal-cliente/  → cuenta de cliente (Supabase Auth, correo real): lib/auth.ts, components/
└── auth/            → login de TRABAJADORES: lib/auth.ts (sesión, catálogo MODULES, canAccess), AuthGuard, PlatformShell (sidebar único de TODA la plataforma interna), SessionCurtain, UsersManager, AreasManager
src/app/             → solo rutas (delgadas), importan desde modules/
├── /                → landing (módulo website)
├── /admin           → gestor del sitio web (módulo website; sub-nav propia tipo píldora dentro del shell, NO sidebar propio)
├── /soporte         → portal de soporte del CLIENTE (asistente por pasos, tema oscuro)
├── /soporte/gestion → mesa de ayuda de la CONSULTORA
├── /cotizaciones    → vista del CLIENTE: accede con código + email (`?c=COT-0001&e=correo`) — legado, ver nota portal-cliente
├── /cotizaciones/gestion → gestión de cotizaciones de la CONSULTORA (lista + detalle `[id]`)
├── /ventas/gestion  → gestión de catálogo y órdenes
├── /proyectos/gestion → ejecución de proyectos (requisitos → desarrollo → gerencia → cerrado)
├── /finanzas/gestion → ingresos registrados al cerrar un proyecto
├── /portal          → gateway público: "Portal de Cliente" vs "Portal de Colaborador"
├── /portal/cliente  → login/registro/panel del cliente (cuenta propia, Supabase Auth)
├── /login           → ingreso del TRABAJADOR (DNI; tema oscuro)
├── (plataforma)/    → grupo con layout compartido (AuthGuard + PlatformShell persistente):
│   ├── /inicio      → hub del trabajador: tarjetas de SUS módulos
│   ├── /perfil      → perfil editable + foto (bucket `users`) + cambio de contraseña
│   └── /usuarios    → SOLO admin (guard `inline`): usuarios, módulos por usuario, /usuarios/areas
```

- **TODA la plataforma interna (gestores + `(plataforma)/`) vive bajo un único shell de navegación: `PlatformShell`** (`modules/auth/components/PlatformShell.tsx`). Un gestor nuevo NO crea su propio header/sidebar — su `layout.tsx` envuelve `children` con `<AuthGuard module="...">` + `<PlatformShell maxWidth="4xl|5xl|7xl">`. `PlatformShell` arma "Mis módulos" dinámicamente desde el catálogo `MODULES`/`canAccess()` en `modules/auth/lib/auth.ts` — agregar el módulo nuevo ahí es lo único necesario para que aparezca en el sidebar.
- Si un módulo necesita sub-navegación propia (como Admin con sus 5 subpáginas), se resuelve con una fila de píldoras horizontales dentro del contenido (ver `modules/website/admin/AdminTabs.tsx`), no con un segundo sidebar.
- Componentes compartidos de listas/paneles: `StatCard` (tarjeta de estadística), `Badge` (píldora de estado con punto opcional), `EmptyState` (lista vacía), `Spinner` (carga) — en `modules/shared/components/`. Usarlos en vez de reimplementar el patrón inline.
- Módulo quotes: estados `borrador→enviada→aprobada/rechazada/vencida` (lógica y numeración `COT-0001` en `modules/quotes/lib/quotes.ts`; `effectiveStatus()` marca vencida una enviada con `valid_until` pasada). Aprobación interna (antes de enviar al cliente) es distinta de la confirmación del encargado (después de que el cliente aprueba, dispara la creación de un proyecto en `modules/projects`).
- Cada módulo nuevo sigue el mismo patrón: carpeta en `modules/`, rutas propias en `app/<nombre>/gestion/`, entrada en `MODULES`, nunca entradas en el menú de otro módulo.
- El asistente del cliente de soporte pide campos DISTINTOS por categoría (soporte→duda/servicio/urgencia, caída→sistema/desde/alcance/síntoma, funcionalidad→resumen/objetivo/usuarios/plazo) y deriva la prioridad automáticamente (lógica en `modules/helpdesk/lib/wizard.ts`). El cliente nunca elige prioridad.

## Autenticación

- **Login de trabajadores: Supabase Auth nativo**, no un sistema propio. El DNI se mapea a un correo interno `<dni>@herrera-ct.local` (`authEmailForDni()` en `modules/auth/lib/auth.ts`); `login()` llama `supabase.auth.signInWithPassword()`. `app_users` es la tabla de negocio (nombre, área, rol, `is_admin`, `modules`), enlazada a `auth.users` vía `auth_user_id`. Nadie se registra solo: el admin crea trabajadores desde `/usuarios` (usuario = DNI, contraseña inicial = DNI) → primer login exige cambiarla → bienvenida animada (`WelcomeSequence`, solo esa vez).
- `app_users` tiene RLS revocada para `anon`/`authenticated` — **todo acceso pasa por RPCs `SECURITY DEFINER` prefijo `hct_`**, que resuelven el usuario vía `hct_current_user_id()` (sesión de Supabase Auth) o `hct_resolve_user_id(p_token)` (soporta también la app móvil por token) y validan `hct_user_has_module(v_user_id, 'modulo')`. Este es el patrón obligatorio para cualquier tabla nueva — nunca el patrón viejo de RLS abierta `"temp all using(true)"` (usado históricamente por `quotes`/`ventas`, no replicar en código nuevo).
- Acceso por módulos: `app_users.modules` + `areas.default_modules` (heredado del área del usuario) + `is_admin` (acceso total). Ver `canAccess()`/`hct_user_has_module()`.
- **Login de clientes: cuenta separada** (`modules/portal-cliente`), también Supabase Auth pero con el correo REAL del cliente (no `@herrera-ct.local`). Tabla `client_users` enlazada vía `client_auth_user_id`. Nunca mezclar con `app_users`.
- El trabajador solo ve los GESTORES (bajo `PlatformShell`); las vistas de cliente (`/`, `/soporte`, `/cotizaciones`, `/portal/*`) siguen públicas o con sesión de cliente propia.

## Reglas clave

- **Feedback al usuario = toasts, nunca mensajes inline bajo los formularios.** `useToast()` de `modules/shared/components/Toast` (`toast.success/error/info/warning(título, detalle?)`); el `ToastProvider` ya está en el layout raíz y cubre toda la plataforma. Los estados vacíos/de carga sí van inline (usar `EmptyState`/`Spinner`).
- Decidido quedarse en **Next.js** (no migrar a Vite) por SEO del sitio público.
- **Toda la plataforma interna usa el tema oscuro** (`void/carbon/steel/crimson/snow/fog/edge/ash`, igual que el landing) — tokens en `src/app/globals.css` (`@theme inline`). Los acentos (`azul/esmeralda/gold`) son transversales. Los tokens claros (`ivory/ink/burgundy`) siguen definidos pero sin uso activo — no reintroducirlos en gestores nuevos. Único lugar donde persisten intencionalmente: estilos `print:` de `ClientQuoteView.tsx` (el PDF impreso usa fondo claro).
- Efectos disponibles y ya en uso: `.tech-grid`, `.grain`, `.scanline-layer`, `.hud-corners`, `.spotlight-card`, `.text-shimmer`, `.logo-badge`, `.section-number`, `.field-dark` (inputs). No usar `.field` (clase del tema claro, obsoleta en gestores).
- Contenido editable del sitio vive en Supabase (`site_settings`, `services`, `projects`, `testimonials`, `leads`) con fallback en `modules/website/lib/content.ts` (`DEFAULT_CONTENT`). Ojo: la tabla `projects` es el portafolio público del sitio — el módulo interno de ejecución de proyectos usa la tabla `client_projects` para evitar colisión.
- Si los estilos o imágenes no reflejan cambios: matar el dev server y borrar `.next` (caché agresiva de Turbopack).
- Tras cambios de UI, verificar visualmente con playwright (devDependency) antes de dar por terminado.
- Índice codegraph inicializado: en llamadas MCP pasar `projectPath: "C:\HERRERA CT\PLATAFORMA\herrera-ct"`. Reindexar con `codegraph index`.
