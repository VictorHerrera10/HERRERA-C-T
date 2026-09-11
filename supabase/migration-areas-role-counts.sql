-- ============================================================
-- Migración: AreasManager.tsx también leía app_users directo
-- (select role_id, para contar cuántos usuarios tiene cada rol)
-- y quedó bloqueado por el mismo revoke de migration-mobile-rls.sql.
-- Esta función expone solo el conteo, sin listar usuarios.
-- ============================================================

create or replace function hct_role_user_counts()
returns table(role_id uuid, total bigint)
language plpgsql security definer set search_path = public as $$
begin
  perform hct_require_admin();
  return query
    select u.role_id, count(*) as total
    from app_users u
    where u.role_id is not null
    group by u.role_id;
end $$;
