-- ============================================================
-- Migración: las ÁREAS definen módulos por defecto para sus
-- miembros, además de los módulos que ya se asignan por usuario.
--
-- El acceso EFECTIVO de un trabajador a un módulo es la unión de:
--   · app_users.modules (checkboxes individuales en /usuarios)
--   · areas.default_modules (heredado del área a la que pertenece)
--   · is_admin = true → acceso total, como ya funcionaba
-- ============================================================

alter table areas
  add column if not exists default_modules text[] not null default '{}';

-- Devuelve true si el usuario tiene el módulo por asignación directa
-- O porque su área lo incluye en default_modules (o es admin).
create or replace function hct_user_has_module(p_user_id uuid, p_module text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (
      select u.is_admin
        or p_module = any(u.modules)
        or (a.default_modules is not null and p_module = any(a.default_modules))
      from app_users u
      left join areas a on a.id = u.area_id
      where u.id = p_user_id and u.active
    ),
    false
  )
$$;

-- app_user_json expone además effective_modules: unión de modules
-- propios + default_modules del área (lo que debe pintar el sidebar).
create or replace function app_user_json(p_id uuid)
returns json language sql security definer set search_path = public as $$
  select to_json(t) from (
    select u.id, u.dni, u.first_name, u.last_name, u.email, u.phone,
           u.avatar_url, u.is_admin, u.area_id, u.role_id, u.modules,
           u.must_change_password, u.active,
           a.name as area_name, r.name as role_name,
           (
             select coalesce(array_agg(distinct m), '{}')
             from unnest(u.modules || coalesce(a.default_modules, '{}')) as m
           ) as effective_modules
    from app_users u
    left join areas a on a.id = u.area_id
    left join area_roles r on r.id = u.role_id
    where u.id = p_id
  ) t
$$;

-- Actualiza los módulos por defecto de un área (solo admin).
create or replace function hct_set_area_modules(p_area_id uuid, p_modules text[])
returns areas language plpgsql security definer set search_path = public as $$
declare v_row areas;
begin
  perform hct_require_admin();
  update areas set default_modules = p_modules where id = p_area_id
  returning * into v_row;
  return v_row;
end $$;
