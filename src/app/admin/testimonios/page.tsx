"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import type { Testimonial } from "@/modules/website/lib/content";

const EMPTY = { quote: "", author: "", role: "", sort_order: 0, published: true };

export default function TestimoniosPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [draft, setDraft] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  async function load() {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order");
    if (error)
      toast.error("No se pudieron cargar los testimonios", error.message);
    else setItems((data as Testimonial[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveNew() {
    const { error } = await supabase
      .from("testimonials")
      .insert({ ...draft, sort_order: items.length + 1 });
    if (error) return toast.error("No se pudo crear el testimonio", error.message);
    toast.success("Testimonio creado");
    setCreating(false);
    setDraft(EMPTY);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = await supabase.from("testimonials").update(rest).eq("id", id);
    if (error) return toast.error("No se pudo guardar", error.message);
    toast.success("Testimonio actualizado");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  }

  function Fields({
    value,
    onChange,
  }: {
    value: typeof EMPTY;
    onChange: (v: typeof EMPTY) => void;
  }) {
    return (
      <div className="space-y-4">
        <textarea
          className="field resize-y"
          rows={3}
          placeholder="Cita del cliente"
          value={value.quote}
          onChange={(e) => onChange({ ...value, quote: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="field"
            placeholder="Autor (ej. Juan Pérez)"
            value={value.author}
            onChange={(e) => onChange({ ...value, author: e.target.value })}
          />
          <input
            className="field"
            placeholder="Cargo / Empresa"
            value={value.role}
            onChange={(e) => onChange({ ...value, role: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Testimonios</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Citas de clientes que aparecen en el sitio público.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory transition-all hover:-translate-y-0.5 hover:bg-burgundy-bright"
        >
          + Nuevo testimonio
        </button>
      </div>

      {creating && (
        <div className="mt-6 rounded-lg border border-burgundy/25 bg-white p-6">
          <Fields value={draft} onChange={setDraft} />
          <div className="mt-5 flex gap-3">
            <button
              onClick={saveNew}
              disabled={!draft.quote.trim() || !draft.author.trim()}
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
        {items.map((t) =>
          editing?.id === t.id ? (
            <div key={t.id} className="rounded-lg border border-burgundy/25 bg-white p-6">
              <Fields
                value={editing}
                onChange={(v) => setEditing({ ...editing, ...v })}
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveEdit}
                  className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-burgundy-bright"
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
            <div key={t.id} className="rounded-lg border border-ink/8 bg-white p-5">
              <blockquote className="font-display text-lg font-light italic text-ink">
                “{t.quote}”
              </blockquote>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-soft">
                  {t.author}
                  {t.role && <span className="text-ink-faint"> · {t.role}</span>}
                </p>
                <div className="flex gap-2 text-xs font-medium">
                  <button
                    onClick={() => {
                      setEditing(t);
                      setCreating(false);
                    }}
                    className="rounded-md bg-azul/10 px-3 py-1.5 text-azul hover:bg-azul/18"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="rounded-md bg-burgundy/8 px-3 py-1.5 text-burgundy hover:bg-burgundy/15"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        )}
        {!items.length && (
          <p className="rounded-lg border border-dashed border-ink/15 px-5 py-8 text-center text-sm text-ink-faint">
            Sin testimonios aún.
          </p>
        )}
      </div>
    </div>
  );
}
