<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto del proyecto — Herrera C&T

Plataforma de gestión de la consultora Herrera Consulting & Technology. Propuesta completa de módulos en `../PROPUESTA-DESARROLLO.md`; instrucciones en `SETUP.md`.

## Arquitectura modular (REGLA: los módulos se conectan pero NO se mezclan)

```
src/modules/
├── shared/        → supabase client, Icon, Reveal, FloatingIcons, Toast, PageTransition (uso transversal)
├── website/       → sitio público + su gestor: components/, admin/, lib/content.ts
├── helpdesk/      → mesa de ayuda: lib/tickets.ts, lib/wizard.ts, components/ClientPortal.tsx
├── quotes/        → cotizaciones: lib/quotes.ts, components/ClientQuoteView.tsx
└── auth/          → login de trabajadores: lib/auth.ts (sesión, catálogo MODULES), AuthGuard, PlatformShell (menú lateral animado según la sesión), SessionCurtain (transición al entrar/salir)
src/app/           → solo rutas (delgadas), importan desde modules/
├── /              → landing (módulo website)
├── /admin         → gestor del sitio web (módulo website; NO incluir aquí otros módulos en su menú)
├── /soporte       → portal de soporte del CLIENTE (asistente por pasos, tema oscuro)
├── /soporte/gestion → mesa de ayuda de la CONSULTORA (tema claro, layout propio)
├── /cotizaciones  → vista del CLIENTE: accede con código + email (`?c=COT-0001&e=correo`)
├── /cotizaciones/gestion → gestión de cotizaciones de la CONSULTORA (lista + detalle `[id]`, layout propio)
├── /login         → ingreso del trabajador (DNI; tema oscuro a la par del landing)
├── (plataforma)/  → grupo con layout compartido (AuthGuard + PlatformShell persistente):
│   ├── /inicio    → hub del trabajador: tarjetas de SUS módulos
│   ├── /perfil    → perfil editable + foto (bucket `users`) + cambio de contraseña
│   └── /usuarios  → SOLO admin (guard `inline`): usuarios, módulos por usuario, /usuarios/areas
```

- Módulo quotes: estados `borrador→enviada→aprobada/rechazada/vencida` (lógica y numeración `COT-0001` en `modules/quotes/lib/quotes.ts`; `effectiveStatus()` marca vencida una enviada con `valid_until` pasada). Migración en `supabase/migration-cotizaciones.sql`.
- Cada módulo nuevo (finanzas, dominios) sigue este patrón: carpeta en `modules/`, rutas propias en `app/`, cross-links discretos ("Otros módulos" en sidebars), nunca entradas en el menú de otro módulo.
- El asistente del cliente pide campos DISTINTOS por categoría (soporte→duda/servicio/urgencia, caída→sistema/desde/alcance/síntoma, funcionalidad→resumen/objetivo/usuarios/plazo) y deriva la prioridad automáticamente (lógica en `modules/helpdesk/lib/wizard.ts`). El cliente nunca elige prioridad.

Lógica del login (módulo auth, `supabase/migration-usuarios.sql`):
- Nadie se registra solo: el ADMIN crea usuarios (usuario = DNI, contraseña inicial = DNI). Primer login → cambio de contraseña obligatorio → bienvenida animada en 3 actos (`WelcomeSequence`, solo esa vez).
- Acceso por módulos: `app_users.modules` (`website`/`helpdesk`/`quotes`); el admin accede a todo y es el único con `/usuarios`. Módulo nuevo ⇒ agregarlo al catálogo `MODULES` en `modules/auth/lib/auth.ts` y proteger su gestor con `<AuthGuard module="...">`.
- El trabajador solo ve los GESTORES; las vistas de cliente (`/`, `/soporte`, `/cotizaciones`) siguen públicas.
- Hashes de contraseña en `app_user_secrets` (sin políticas de lectura); login/cambio/reset vía RPCs `SECURITY DEFINER`. Sesión en localStorage (`hct.session`) con guard de cliente. Admin semilla: DNI `00000000`.

Reglas clave:
- **Feedback al usuario = toasts, nunca mensajes inline bajo los formularios.** `useToast()` de `modules/shared/components/Toast` (`toast.success/error/info/warning(título, detalle?)`); el `ToastProvider` ya está en el layout raíz y cubre toda la plataforma (trabajadores y clientes). Los estados vacíos/de carga sí van inline.
- **El endurecimiento de auth (RLS reales, sesiones server-side) queda para el FINAL del proyecto**. Las políticas RLS marcadas `temp` en `supabase/*.sql` son deliberadas; no publicar la plataforma a internet mientras tanto.
- Decidido quedarse en **Next.js** (no migrar a Vite) por SEO del sitio público.
- Tokens de diseño en `src/app/globals.css` (`@theme inline`): landing usa `void/carbon/steel/crimson/snow/fog`; admin usa `ivory/ink/burgundy`; los acentos (`azul/esmeralda/gold`) son transversales (estados en helpdesk/quotes, detalles en website). No mezclar las paletas base entre módulos.
- Contenido editable vive en Supabase (`site_settings`, `services`, `projects`, `testimonials`, `leads`) con fallback en `src/lib/content.ts` (`DEFAULT_CONTENT`).
- Si los estilos o imágenes no reflejan cambios: matar el dev server y borrar `.next` (caché agresiva de Turbopack).
- Tras cambios de UI, verificar visualmente con playwright (devDependency) antes de dar por terminado.
- Índice codegraph inicializado: en llamadas MCP pasar `projectPath: "C:\HERRERA CT\PLATAFORMA\herrera-ct"`. Reindexar con `codegraph index`.
