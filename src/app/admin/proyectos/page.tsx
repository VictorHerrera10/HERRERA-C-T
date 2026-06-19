"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import type { Project } from "@/modules/website/lib/content";

type Draft = Omit<Project, "id">;

const EMPTY: Draft = {
  title: "",
  description: "",
  category: "",
  image_url: "",
  link: "",
  sort_order: 0,
  published: true,
};

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function load() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order");
    if (error) toast.error("No se pudieron cargar los proyectos", error.message);
    else setProjects((data as Project[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  /* Sube la imagen al bucket "projects" y devuelve la URL pública */
  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("projects").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error(
        "No se pudo subir la imagen",
        `${error.message} — ¿Ejecutaste migration-proyectos.sql?`
      );
      return null;
    }
    return supabase.storage.from("projects").getPublicUrl(path).data.publicUrl;
  }

  async function saveNew() {
    const { error } = await supabase
      .from("projects")
      .insert({ ...draft, sort_order: projects.length + 1 });
    if (error) return toast.error("No se pudo crear el proyecto", error.message);
    toast.success("Proyecto creado");
    setCreating(false);
    setDraft(EMPTY);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = await supabase.from("projects").update(rest).eq("id", id);
    if (error) return toast.error("No se pudo guardar", error.message);
    toast.success("Proyecto actualizado");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este proyecto del sitio?")) return;
    await supabase.from("projects").delete().eq("id", id);
    load();
  }

  async function togglePublished(p: Project) {
    await supabase
      .from("projects")
      .update({ published: !p.published })
      .eq("id", p.id);
    load();
  }

  function Fields({
    value,
    onChange,
  }: {
    value: Draft;
    onChange: (v: Draft) => void;
  }) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="field"
            placeholder="Título del proyecto *"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
          <input
            className="field"
            placeholder="Categoría (ej. Desarrollo Web)"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          />
        </div>
        <textarea
          className="field resize-y"
          rows={3}
          placeholder="Descripción del proyecto"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
        <input
          className="field"
          placeholder="Enlace (opcional, ej. https://cliente.com)"
          value={value.link}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Imagen del proyecto
          </p>
          <div className="flex items-start gap-4">
            {value.image_url ? (
              <div className="relative">
                <img
                  src={value.image_url}
                  alt="Vista previa"
                  className="h-28 w-44 rounded-lg border border-ink/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...value, image_url: "" })}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-burgundy text-xs font-bold text-ivory"
                  title="Quitar imagen"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex h-28 w-44 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink/20 text-xs text-ink-faint transition-colors hover:border-burgundy/50 hover:text-burgundy">
                {uploading ? (
                  "Subiendo…"
                ) : (
                  <>
                    <span className="text-xl">＋</span>
                    Subir imagen
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) onChange({ ...value, image_url: url });
                  }}
                />
              </label>
            )}
            <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
              Recomendado: imagen horizontal (16:9), JPG o PNG. Si no subes
              imagen, el sitio muestra un diseño técnico con la inicial del
              proyecto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Proyectos</h1>
          <p className="mt-1 text-sm text-ink-faint">
            El portafolio que se muestra en la sección “Proyectos” del sitio.
            El primero de la lista aparece destacado en grande.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory transition-all hover:-translate-y-0.5 hover:bg-burgundy-bright"
        >
          + Nuevo proyecto
        </button>
      </div>

      {creating && (
        <div className="mt-6 rounded-lg border border-burgundy/25 bg-white p-6">
          <h2 className="font-display mb-4 text-lg font-medium text-ink">
            Nuevo proyecto
          </h2>
          <Fields value={draft} onChange={setDraft} />
          <div className="mt-5 flex gap-3">
            <button
              onClick={saveNew}
              disabled={!draft.title.trim() || uploading}
              className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-burgundy-bright disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink/35"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {projects.map((p) =>
          editing?.id === p.id ? (
            <div key={p.id} className="rounded-lg border border-burgundy/25 bg-white p-6">
              <Fields
                value={editing}
                onChange={(v) => setEditing({ ...editing, ...v })}
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveEdit}
                  disabled={uploading}
                  className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-burgundy-bright disabled:opacity-50"
                >
                  Guardar cambios
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink/35"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className={`flex items-start gap-4 rounded-lg border border-ink/8 bg-white p-5 ${
                !p.published ? "opacity-55" : ""
              }`}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="h-16 w-24 shrink-0 rounded-lg border border-ink/8 object-cover"
                />
              ) : (
                <span className="font-display flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-burgundy/8 text-2xl font-bold text-burgundy">
                  {p.title.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {p.title}
                  {p.category && (
                    <span className="ml-2 rounded-md bg-azul/10 px-2 py-0.5 text-[11px] font-medium text-azul">
                      {p.category}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
                  {p.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs font-medium">
                <button
                  onClick={() => togglePublished(p)}
                  className={`rounded-md px-3 py-1.5 ${
                    p.published
                      ? "bg-esmeralda/10 text-esmeralda"
                      : "bg-ink/8 text-ink-soft"
                  }`}
                >
                  {p.published ? "Publicado" : "Oculto"}
                </button>
                <button
                  onClick={() => {
                    setEditing(p);
                    setCreating(false);
                  }}
                  className="rounded-md bg-azul/10 px-3 py-1.5 text-azul hover:bg-azul/18"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-md bg-burgundy/8 px-3 py-1.5 text-burgundy hover:bg-burgundy/15"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
        {!projects.length && (
          <p className="rounded-lg border border-dashed border-ink/15 px-5 py-8 text-center text-sm text-ink-faint">
            Aún no hay proyectos en la base de datos. El sitio muestra ejemplos
            por defecto. Crea el primero con “+ Nuevo proyecto”.
            <br />
            <span className="mt-1 inline-block text-xs">
              Recuerda ejecutar{" "}
              <code className="rounded bg-ink/8 px-1.5 py-0.5">
                supabase/migration-proyectos.sql
              </code>{" "}
              en Supabase si ya habías creado las tablas anteriores.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
