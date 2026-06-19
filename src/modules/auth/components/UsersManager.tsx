"use client";

/* Gestor de usuarios (solo administrador): crea trabajadores con su DNI
   (contraseña inicial = DNI), asigna área/rol y los módulos a los que
   cada uno tendrá acceso. */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";
import {
  getSession,
  saveSession,
  MODULES,
  type Area,
  type AreaRole,
  type AppUser,
  type ModuleKey,
} from "../lib/auth";

type Draft = {
  dni: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_admin: boolean;
  area_id: string | null;
  role_id: string | null;
  modules: ModuleKey[];
};

const EMPTY: Draft = {
  dni: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  is_admin: false,
  area_id: null,
  role_id: null,
  modules: [],
};

export function UsersManager() {
  const toast = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<AreaRole[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null); // null = cerrado, "new" = alta
  const [panel, setPanel] = useState<"closed" | "new" | "edit">("closed");
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  async function load() {
    const [u, a, r] = await Promise.all([
      supabase.from("app_users").select("*").order("created_at"),
      supabase.from("areas").select("*").order("name"),
      supabase.from("area_roles").select("*").order("name"),
    ]);
    const err = u.error ?? a.error ?? r.error;
    if (err) {
      setLoadFailed(true);
      return toast.error(
        "No se pudo cargar el equipo",
        `${err.message} — ¿Ejecutaste migration-usuarios.sql?`
      );
    }
    setUsers((u.data as AppUser[]) ?? []);
    setAreas((a.data as Area[]) ?? []);
    setRoles((r.data as AreaRole[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const roleName = useMemo(() => {
    const map = new Map(roles.map((r) => [r.id, r.name]));
    return (id: string | null) => (id ? map.get(id) ?? null : null);
  }, [roles]);
  const areaName = useMemo(() => {
    const map = new Map(areas.map((a) => [a.id, a.name]));
    return (id: string | null) => (id ? map.get(id) ?? null : null);
  }, [areas]);

  const draftRoles = roles.filter((r) => r.area_id === draft.area_id);

  function openNew() {
    setDraft(EMPTY);
    setEditingId(null);
    setPanel("new");
  }

  function openEdit(u: AppUser) {
    setDraft({
      dni: u.dni,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      is_admin: u.is_admin,
      area_id: u.area_id,
      role_id: u.role_id,
      modules: u.modules,
    });
    setEditingId(u.id);
    setPanel("edit");
  }

  function toggleModule(key: ModuleKey) {
    setDraft((d) => ({
      ...d,
      modules: d.modules.includes(key)
        ? d.modules.filter((m) => m !== key)
        : [...d.modules, key],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{8,}$/.test(draft.dni))
      return toast.warning("DNI inválido", "Debe tener al menos 8 dígitos.");
    if (!draft.first_name.trim())
      return toast.warning("Faltan los nombres del trabajador");
    setBusy(true);
    try {
      if (panel === "new") {
        const { error } = await supabase.rpc("admin_create_user", {
          p_dni: draft.dni,
          p_first_name: draft.first_name.trim(),
          p_last_name: draft.last_name.trim(),
          p_email: draft.email.trim(),
          p_phone: draft.phone.trim(),
          p_is_admin: draft.is_admin,
          p_area_id: draft.area_id,
          p_role_id: draft.role_id,
          p_modules: draft.modules,
        });
        if (error) throw new Error(error.message);
        toast.success(
          "Usuario creado",
          `Su contraseña inicial es su DNI (${draft.dni}); la cambiará en su primer ingreso.`
        );
      } else if (editingId) {
        const { error } = await supabase
          .from("app_users")
          .update({
            dni: draft.dni,
            first_name: draft.first_name.trim(),
            last_name: draft.last_name.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            is_admin: draft.is_admin,
            area_id: draft.area_id,
            role_id: draft.role_id,
            modules: draft.modules,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);
        if (error) throw new Error(error.message);
        // Si el admin se editó a sí mismo, refleja el cambio en su sesión
        const session = getSession();
        if (session && session.id === editingId) {
          saveSession({
            ...session,
            ...draft,
            area_name: areaName(draft.area_id),
            role_name: roleName(draft.role_id),
          });
        }
        toast.success("Cambios guardados");
      }
      setPanel("closed");
      await load();
    } catch (err) {
      toast.error(
        "No se pudo guardar",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: AppUser) {
    const { error } = await supabase
      .from("app_users")
      .update({ active: !u.active, updated_at: new Date().toISOString() })
      .eq("id", u.id);
    if (error) return toast.error("No se pudo cambiar el estado", error.message);
    toast.info(
      u.active
        ? `${u.first_name} ya no puede ingresar a la plataforma.`
        : `${u.first_name} vuelve a tener acceso.`
    );
    load();
  }

  async function resetPassword(u: AppUser) {
    if (
      !window.confirm(
        `¿Restablecer la contraseña de ${u.first_name} ${u.last_name}? Volverá a ser su DNI y deberá cambiarla al ingresar.`
      )
    )
      return;
    const { error } = await supabase.rpc("admin_reset_password", {
      p_user_id: u.id,
    });
    if (error)
      return toast.error("No se pudo restablecer la contraseña", error.message);
    toast.success(
      "Contraseña restablecida",
      `${u.first_name} ingresará con su DNI y deberá crear una nueva.`
    );
    load();
  }

  const me = typeof window !== "undefined" ? getSession() : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-number">/ equipo</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Usuarios</h1>
          <p className="mt-2 max-w-xl text-sm text-fog">
            Solo tú creas las cuentas. Cada trabajador ingresa con su DNI y lo
            usa como contraseña inicial; el sistema le exigirá cambiarla.
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-xl bg-crimson px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_24px_rgba(216,17,43,0.4)]"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Panel alta/edición */}
      <AnimatePresence>
        {panel !== "closed" && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onSubmit={save}
            className="mt-7 overflow-hidden rounded-2xl border border-edge bg-carbon/80"
          >
            <div className="p-7">
              <h2 className="font-display text-lg font-semibold">
                {panel === "new" ? "Nuevo trabajador" : "Editar trabajador"}
              </h2>
              {panel === "new" && (
                <p className="mt-1 text-xs text-fog">
                  Su contraseña inicial será el mismo DNI.
                </p>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    DNI *
                  </label>
                  <input
                    className="field-dark mt-2 font-mono tracking-widest"
                    value={draft.dni}
                    onChange={(e) =>
                      setDraft({ ...draft, dni: e.target.value.replace(/\D/g, "") })
                    }
                    placeholder="12345678"
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Nombres *
                  </label>
                  <input
                    className="field-dark mt-2"
                    value={draft.first_name}
                    onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Apellidos
                  </label>
                  <input
                    className="field-dark mt-2"
                    value={draft.last_name}
                    onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Correo
                  </label>
                  <input
                    className="field-dark mt-2"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Teléfono
                  </label>
                  <input
                    className="field-dark mt-2"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Área
                  </label>
                  <select
                    className="field-dark mt-2"
                    value={draft.area_id ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        area_id: e.target.value || null,
                        role_id: null,
                      })
                    }
                  >
                    <option value="">— Sin área —</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                    Rol
                  </label>
                  <select
                    className="field-dark mt-2"
                    value={draft.role_id ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, role_id: e.target.value || null })
                    }
                    disabled={!draft.area_id}
                  >
                    <option value="">
                      {draft.area_id
                        ? "— Sin rol —"
                        : "Elige primero un área"}
                    </option>
                    {draftRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {draft.area_id && draftRoles.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-ash">
                      Esta área aún no tiene roles. Créalos en “Áreas y roles”.
                    </p>
                  )}
                </div>
                <label className="flex items-end gap-2.5 pb-2 text-sm text-snow/85">
                  <input
                    type="checkbox"
                    checked={draft.is_admin}
                    onChange={(e) => setDraft({ ...draft, is_admin: e.target.checked })}
                    className="h-4 w-4 accent-[#e8b33c]"
                  />
                  Administrador de la plataforma
                </label>
              </div>

              {/* Acceso a módulos */}
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-fog">
                Acceso a módulos
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {MODULES.map((m) => {
                  const on = draft.modules.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleModule(m.key)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                        on
                          ? "border-crimson/60 bg-crimson/10"
                          : "border-edge bg-steel/60 hover:border-snow/20"
                      }`}
                    >
                      <Icon name={m.icon} className={`mt-0.5 h-5 w-5 ${m.accent}`} />
                      <span>
                        <span className="block text-sm font-semibold text-snow">
                          {m.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-fog">
                          {m.description}
                        </span>
                      </span>
                      <span
                        className={`ml-auto mt-1 h-2 w-2 shrink-0 rounded-full ${
                          on ? "bg-crimson-bright" : "bg-snow/15"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {draft.is_admin && (
                <p className="mt-2.5 text-[11px] text-gold-soft">
                  Un administrador accede a todos los módulos aunque no estén
                  marcados.
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  disabled={busy}
                  className="rounded-xl bg-crimson px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright disabled:opacity-50"
                >
                  {busy ? "Guardando…" : panel === "new" ? "Crear usuario" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("closed")}
                  className="rounded-xl border border-edge px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider text-fog transition-colors hover:text-snow"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="mt-8 space-y-3">
        {users.map((u) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`rounded-2xl border bg-carbon/70 p-5 ${
              u.active ? "border-edge" : "border-edge opacity-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-edge bg-steel">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-crimson-bright">
                    {(u.first_name[0] ?? "") + (u.last_name[0] ?? "")}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-base font-semibold">
                  {u.first_name} {u.last_name}
                  {u.is_admin && (
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-soft">
                      Admin
                    </span>
                  )}
                  {me?.id === u.id && (
                    <span className="rounded-full border border-edge bg-steel px-2 py-0.5 text-[10px] text-fog">
                      Tú
                    </span>
                  )}
                  {u.must_change_password && (
                    <span className="rounded-full border border-azul/30 bg-azul/10 px-2 py-0.5 text-[10px] text-azul">
                      Pendiente de 1er ingreso
                    </span>
                  )}
                  {!u.active && (
                    <span className="rounded-full border border-crimson/30 bg-crimson/10 px-2 py-0.5 text-[10px] text-[#ff8195]">
                      Inactivo
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fog">
                  <span className="font-mono tracking-wider">DNI {u.dni}</span>
                  {areaName(u.area_id) && <span>{areaName(u.area_id)}</span>}
                  {roleName(u.role_id) && <span>· {roleName(u.role_id)}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(u.is_admin ? MODULES : MODULES.filter((m) => u.modules.includes(m.key))).map(
                    (m) => (
                      <span
                        key={m.key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-steel px-2.5 py-0.5 text-[10px] text-fog"
                      >
                        <Icon name={m.icon} className={`h-3 w-3 ${m.accent}`} />
                        {m.label}
                      </span>
                    )
                  )}
                  {!u.is_admin && u.modules.length === 0 && (
                    <span className="text-[10px] text-ash">Sin módulos asignados</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 text-xs">
                <button
                  onClick={() => openEdit(u)}
                  className="rounded-lg border border-edge px-3.5 py-2 text-fog transition-colors hover:border-snow/30 hover:text-snow"
                >
                  Editar
                </button>
                <button
                  onClick={() => resetPassword(u)}
                  className="rounded-lg border border-edge px-3.5 py-2 text-fog transition-colors hover:border-gold/40 hover:text-gold-soft"
                >
                  Restablecer clave
                </button>
                {me?.id !== u.id && (
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded-lg border px-3.5 py-2 transition-colors ${
                      u.active
                        ? "border-edge text-fog hover:border-crimson/50 hover:text-[#ff8195]"
                        : "border-esmeralda/40 text-esmeralda hover:bg-esmeralda/10"
                    }`}
                  >
                    {u.active ? "Desactivar" : "Activar"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {users.length === 0 && (
          <div className="rounded-2xl border border-edge bg-carbon/70 p-10 text-center text-sm text-fog">
            {loadFailed
              ? "No se pudo cargar el equipo. Revisa la conexión con Supabase."
              : "Cargando equipo…"}
          </div>
        )}
      </div>
    </div>
  );
}
