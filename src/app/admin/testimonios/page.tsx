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
          className="field-dark resize-y"
          rows={3}
          placeholder="Cita del cliente"
          value={value.quote}
          onChange={(e) => onChange({ ...value, quote: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="field-dark"
            placeholder="Autor (ej. Juan Pérez)"
            value={value.author}
            onChange={(e) => onChange({ ...value, author: e.target.value })}
          />
          <input
            className="field-dark"
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
          <h1 className="font-display text-3xl font-medium text-snow">Testimonios</h1>
          <p className="mt-1 text-sm text-fog">
            Citas de clientes que aparecen en el sitio público.
          </p>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow transition-all hover:-translate-y-0.5 hover:bg-crimson-bright"
        >
          + Nuevo testimonio
        </button>
      </div>

      {creating && (
        <div className="mt-6 rounded-lg border border-crimson/25 bg-carbon/70 p-6">
          <Fields value={draft} onChange={setDraft} />
          <div className="mt-5 flex gap-3">
            <button
              onClick={saveNew}
              disabled={!draft.quote.trim() || !draft.author.trim()}
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
        {items.map((t) =>
          editing?.id === t.id ? (
            <div key={t.id} className="rounded-lg border border-crimson/25 bg-carbon/70 p-6">
              <Fields
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
            <div key={t.id} className="rounded-lg border border-edge bg-carbon/70 p-5">
              <blockquote className="font-display text-lg font-light italic text-snow">
                “{t.quote}”
              </blockquote>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-medium text-fog">
                  {t.author}
                  {t.role && <span className="text-fog"> · {t.role}</span>}
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
                    className="rounded-md bg-crimson/10 px-3 py-1.5 text-[#ff8195] hover:bg-crimson/15"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        )}
        {!items.length && (
          <p className="rounded-lg border border-dashed border-edge px-5 py-8 text-center text-sm text-fog">
            Sin testimonios aún.
          </p>
        )}
      </div>
    </div>
  );
}
