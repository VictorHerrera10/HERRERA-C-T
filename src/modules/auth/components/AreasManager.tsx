"use client";

/* Áreas y roles (solo administrador): el admin crea áreas de la
   consultora y, dentro de cada una, los roles que luego asigna
   a los trabajadores en el gestor de usuarios. */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import type { Area, AreaRole } from "../lib/auth";

export function AreasManager() {
  const toast = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<AreaRole[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map()); // role_id → usuarios
  const [newArea, setNewArea] = useState("");
  const [newRole, setNewRole] = useState<Record<string, string>>({});
  const [loadFailed, setLoadFailed] = useState(false);

  async function load() {
    const [a, r, u] = await Promise.all([
      supabase.from("areas").select("*").order("name"),
      supabase.from("area_roles").select("*").order("name"),
      supabase.from("app_users").select("role_id"),
    ]);
    const err = a.error ?? r.error ?? u.error;
    if (err) {
      setLoadFailed(true);
      return toast.error(
        "No se pudieron cargar las áreas",
        `${err.message} — ¿Ejecutaste migration-usuarios.sql?`
      );
    }
    setAreas((a.data as Area[]) ?? []);
    setRoles((r.data as AreaRole[]) ?? []);
    const map = new Map<string, number>();
    for (const row of (u.data as { role_id: string | null }[]) ?? [])
      if (row.role_id) map.set(row.role_id, (map.get(row.role_id) ?? 0) + 1);
    setCounts(map);
  }

  useEffect(() => {
    load();
  }, []);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    const name = newArea.trim();
    if (!name) return;
    const { error } = await supabase.from("areas").insert({ name });
    if (error) return toast.error("No se pudo crear el área", error.message);
    toast.success(`Área "${name}" creada`, "Ahora agrégale sus roles.");
    setNewArea("");
    load();
  }

  async function addRole(areaId: string) {
    const name = (newRole[areaId] ?? "").trim();
    if (!name) return;
    const { error } = await supabase
      .from("area_roles")
      .insert({ area_id: areaId, name });
    if (error) return toast.error("No se pudo crear el rol", error.message);
    toast.success(`Rol "${name}" agregado`);
    setNewRole((s) => ({ ...s, [areaId]: "" }));
    load();
  }

  async function removeRole(role: AreaRole) {
    const inUse = counts.get(role.id) ?? 0;
    if (
      !window.confirm(
        inUse > 0
          ? `El rol "${role.name}" está asignado a ${inUse} usuario(s); quedarán sin rol. ¿Eliminar?`
          : `¿Eliminar el rol "${role.name}"?`
      )
    )
      return;
    const { error } = await supabase.from("area_roles").delete().eq("id", role.id);
    if (error) return toast.error("No se pudo eliminar el rol", error.message);
    toast.info(`Rol "${role.name}" eliminado`);
    load();
  }

  async function removeArea(area: Area) {
    const areaRoles = roles.filter((r) => r.area_id === area.id);
    if (
      !window.confirm(
        `¿Eliminar el área "${area.name}"? Se borrarán sus ${areaRoles.length} rol(es) y los usuarios del área quedarán sin asignar.`
      )
    )
      return;
    const { error } = await supabase.from("areas").delete().eq("id", area.id);
    if (error) return toast.error("No se pudo eliminar el área", error.message);
    toast.info(`Área "${area.name}" eliminada`);
    load();
  }

  return (
    <div>
      <p className="section-number">/ organización</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Áreas y roles</h1>
      <p className="mt-2 max-w-xl text-sm text-fog">
        Define las áreas de la consultora y los roles de cada una. Luego, en{" "}
        <span className="text-snow">Usuarios</span>, asigna área y rol a cada
        trabajador.
      </p>

      {/* Nueva área */}
      <form onSubmit={addArea} className="mt-7 flex max-w-md gap-3">
        <input
          className="field-dark"
          value={newArea}
          onChange={(e) => setNewArea(e.target.value)}
          placeholder="Nueva área (ej. Desarrollo, Comercial…)"
        />
        <button className="shrink-0 rounded-xl bg-crimson px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright">
          Crear
        </button>
      </form>

      {/* Áreas */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {areas.map((area, i) => {
          const areaRoles = roles.filter((r) => r.area_id === area.id);
          return (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="hud-corners rounded-2xl border border-edge bg-carbon/70 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">{area.name}</h2>
                <button
                  onClick={() => removeArea(area)}
                  className="rounded-lg border border-edge px-3 py-1.5 text-[11px] text-fog transition-colors hover:border-crimson/50 hover:text-[#ff8195]"
                >
                  Eliminar área
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {areaRoles.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-edge bg-steel/60 px-4 py-2.5"
                  >
                    <span className="text-sm text-snow/90">{r.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-[11px] text-ash">
                        {counts.get(r.id) ?? 0} usuario(s)
                      </span>
                      <button
                        onClick={() => removeRole(r)}
                        className="text-[11px] text-fog transition-colors hover:text-[#ff8195]"
                      >
                        Quitar
                      </button>
                    </span>
                  </div>
                ))}
                {areaRoles.length === 0 && (
                  <p className="rounded-xl border border-dashed border-edge px-4 py-3 text-xs text-ash">
                    Sin roles todavía. Agrega el primero abajo.
                  </p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addRole(area.id);
                }}
                className="mt-4 flex gap-2.5"
              >
                <input
                  className="field-dark !py-2 text-sm"
                  value={newRole[area.id] ?? ""}
                  onChange={(e) =>
                    setNewRole((s) => ({ ...s, [area.id]: e.target.value }))
                  }
                  placeholder="Nuevo rol (ej. Consultor senior)"
                />
                <button className="shrink-0 rounded-lg border border-edge px-4 text-xs font-semibold text-fog transition-colors hover:border-snow/30 hover:text-snow">
                  Agregar
                </button>
              </form>
            </motion.div>
          );
        })}

        {areas.length === 0 && !loadFailed && (
          <div className="rounded-2xl border border-dashed border-edge p-10 text-center text-sm text-fog lg:col-span-2">
            Aún no hay áreas. Crea la primera arriba — por ejemplo
            “Desarrollo”, “Comercial” o “Soporte”.
          </div>
        )}
      </div>
    </div>
  );
}
