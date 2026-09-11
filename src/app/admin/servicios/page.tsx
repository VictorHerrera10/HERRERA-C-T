"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import type { Service } from "@/modules/website/lib/content";
import { Icon, ICON_NAMES } from "@/modules/shared/components/Icon";

const ACCENTS = [
  { value: "burgundy", label: "Borgoña" },
  { value: "azul", label: "Azul" },
  { value: "gold", label: "Dorado" },
  { value: "esmeralda", label: "Verde" },
] as const;

const EMPTY: Omit<Service, "id"> = {
  title: "",
  description: "",
  icon: "code",
  accent: "burgundy",
  sort_order: 0,
  published: true,
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [draft, setDraft] = useState<Omit<Service, "id">>(EMPTY);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  async function load() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort_order");
    if (error)
      toast.error(
        "No se pudieron cargar los servicios",
        `${error.message} — ¿Ejecutaste supabase/schema.sql?`
      );
    else setServices((data as Service[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveNew() {
    const { error } = await supabase
      .from("services")
      .insert({ ...draft, sort_order: services.length + 1 });
    if (error) return toast.error("No se pudo crear el servicio", error.message);
    toast.success("Servicio creado");
    setCreating(false);
    setDraft(EMPTY);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = await supabase.from("services").update(rest).eq("id", id);
    if (error) return toast.error("No se pudo guardar", error.message);
    toast.success("Servicio actualizado");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este servicio del sitio?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  }

  async function togglePublished(s: Service) {
    await supabase
      .from("services")
      .update({ published: !s.published })
      .eq("id", s.id);
    load();
  }

  function ServiceFields({
    value,
    onChange,
  }: {
    value: Omit<Service, "id">;
    onChange: (v: Omit<Service, "id">) => void;
  }) {
    return (
      <div className="space-y-4">
        <input
          className="field-dark"
          placeholder="Título del servicio"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
        <textarea
          className="field-dark resize-y"
          rows={3}
          placeholder="Descripción breve"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
              Ícono
            </p>
            <div className="flex flex-wrap gap-2">
              {ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange({ ...value, icon: name })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                    value.icon === name
                      ? "border-crimson bg-crimson/10 text-[#ff8195]"
                      : "border-edge text-fog hover:border-snow/25"
                  }`}
                  title={name}
                >
                  <Icon name={name} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
              Color de acento
            </p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => onChange({ ...value, accent: a.value })}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    value.accent === a.value
                      ? "border-crimson bg-crimson/10 text-[#ff8195]"
                      : "border-edge text-fog hover:border-snow/25"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-snow">Servicios</h1>
          <p className="mt-1 text-sm text-fog">
            Las tarjetas que se muestran en la sección “Servicios” del sitio.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow transition-all hover:-translate-y-0.5 hover:bg-crimson-bright"
        >
          + Nuevo servicio
        </button>
      </div>

      {creating && (
        <div className="mt-6 rounded-lg border border-crimson/25 bg-carbon/70 p-6">
          <h2 className="font-display mb-4 text-lg font-medium text-snow">
            Nuevo servicio
          </h2>
          <ServiceFields value={draft} onChange={setDraft} />
          <div className="mt-5 flex gap-3">
            <button
              onClick={saveNew}
              disabled={!draft.title.trim()}
              className="rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-snow hover:bg-crimson-bright disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-fog hover:border-snow/30"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {services.map((s) =>
          editing?.id === s.id ? (
            <div key={s.id} className="rounded-lg border border-crimson/25 bg-carbon/70 p-6">
              <ServiceFields
                value={editing}
                onChange={(v) => setEditing({ ...editing, ...v })}
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveEdit}
                  className="rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-snow hover:bg-crimson-bright"
                >
                  Guardar cambios
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-fog hover:border-snow/30"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              key={s.id}
              className={`flex items-start gap-4 rounded-lg border border-edge bg-carbon/70 p-5 ${
                !s.published ? "opacity-55" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-crimson/10 text-[#ff8195]">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-snow">{s.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-fog">
                  {s.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs font-medium">
                <button
                  onClick={() => togglePublished(s)}
                  className={`rounded-md px-3 py-1.5 ${
                    s.published
                      ? "bg-esmeralda/10 text-esmeralda"
                      : "bg-steel text-fog"
                  }`}
                >
                  {s.published ? "Publicado" : "Oculto"}
                </button>
                <button
                  onClick={() => {
                    setEditing(s);
                    setCreating(false);
                  }}
                  className="rounded-md bg-azul/10 px-3 py-1.5 text-azul hover:bg-azul/18"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="rounded-md bg-crimson/10 px-3 py-1.5 text-[#ff8195] hover:bg-crimson/15"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
        {!services.length && (
          <p className="rounded-lg border border-dashed border-edge px-5 py-8 text-center text-sm text-fog">
            Aún no hay servicios en la base de datos. El sitio muestra los
            servicios por defecto. Crea el primero con “+ Nuevo servicio”.
          </p>
        )}
      </div>
    </div>
  );
}
