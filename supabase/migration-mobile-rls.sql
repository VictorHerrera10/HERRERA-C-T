-- ============================================================
-- Migración: cierre de acceso directo a tickets/leads/app_users
-- Ejecutar DESPUÉS de migration-mobile.sql, y solo tras confirmar
-- que la app móvil y el sitio web (páginas migradas a hct_*)
-- funcionan correctamente con las nuevas funciones.
--
-- A partir de aquí, tickets, ticket_comments y leads dejan de ser
-- legibles/escribibles directo con la clave pública — todo pasa
-- por las funciones hct_* (SECURITY DEFINER) de migration-mobile.sql.
--
-- El resto del sitio (site_settings, services, projects,
-- testimonials, panel /admin en general) NO se toca aquí — sigue
-- con políticas "temp" como estaba decidido; el endurecimiento
-- completo del sitio sigue siendo la fase final del proyecto.
-- ============================================================

revoke all on tickets from anon, authenticated;
revoke all on ticket_comments from anon, authenticated;
revoke all on leads from anon, authenticated;
revoke select on app_users from anon, authenticated;
