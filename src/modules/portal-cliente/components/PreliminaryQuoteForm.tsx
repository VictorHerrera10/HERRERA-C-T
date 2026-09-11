"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { Select } from "@/modules/shared/components/Select";
import type { ModuleMember } from "../lib/types";

const ease = [0.21, 0.6, 0.35, 1] as const;

export function PreliminaryQuoteForm({ onCreated }: { onCreated: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [budget, setBudget] = useState("");
  const [assignment, setAssignment] = useState<"cualquiera" | "especifico">("cualquiera");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState<ModuleMember[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && !members.length) {
      supabase.rpc("hct_list_module_members", { p_module: "quotes" }).then(({ data }) => {
        setMembers((data as ModuleMember[]) ?? []);
      });
    }
  }, [open, members.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.warning("Falta el título de tu solicitud");
    setBusy(true);
    const { error } = await supabase.rpc("hct_client_create_preliminary_quote", {
      p_title: title.trim(),
      p_project_summary: summary.trim(),
      p_budget_range: budget.trim(),
      p_assignment: assignment,
      p_assigned_to: assignment === "especifico" ? assignedTo || null : null,
    });
    setBusy(false);
    if (error) return toast.error("No se pudo enviar tu solicitud", error.message);
    toast.success(
      "¡Solicitud enviada!",
      "Un consultor la revisará y se pondrá en contacto contigo."
    );
    setTitle("");
    setSummary("");
    setBudget("");
    setAssignment("cualquiera");
    setAssignedTo("");
    setOpen(false);
    onCreated();
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-crimson px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_24px_rgba(216,17,43,0.4)]"
      >
        + Solicitar cotización
      </button>
    );

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.35, ease }}
      onSubmit={submit}
      className="mt-5 overflow-hidden rounded-2xl border border-edge bg-carbon/80 p-7"
    >
      <h2 className="font-display text-lg font-semibold">Cuéntanos qué necesitas</h2>
      <p className="mt-1 text-xs text-fog">
        Una versión corta y puntual — un consultor la completará a detalle contigo.
      </p>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
        Título *
      </label>
      <input
        className="field-dark mt-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej. Página web para mi negocio"
      />

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
        Cuéntanos brevemente
      </label>
      <textarea
        className="field-dark mt-2 resize-y"
        rows={3}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="¿Qué te gustaría lograr?"
      />

      <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
        Rango de presupuesto (opcional)
      </label>
      <input
        className="field-dark mt-2"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        placeholder="Ej. USD 1,000 - 3,000"
      />

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-fog">
        ¿Quién la atiende?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAssignment("cualquiera")}
          className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
            assignment === "cualquiera"
              ? "border-crimson/50 bg-crimson/10 text-snow"
              : "border-edge text-fog hover:border-snow/25"
          }`}
        >
          Cualquier consultor disponible
        </button>
        <button
          type="button"
          onClick={() => setAssignment("especifico")}
          className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
            assignment === "especifico"
              ? "border-crimson/50 bg-crimson/10 text-snow"
              : "border-edge text-fog hover:border-snow/25"
          }`}
        >
          Elegir un consultor
        </button>
      </div>

      {assignment === "especifico" && (
        <div className="mt-3">
          <Select
            value={assignedTo}
            onChange={setAssignedTo}
            placeholder="Elige un consultor…"
            options={members.map((m) => {
              const name = [m.first_name, m.last_name].filter(Boolean).join(" ");
              return { value: m.id, label: name, avatarSeed: name, avatarSrc: m.avatar_url };
            })}
          />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          disabled={busy}
          className="rounded-xl bg-crimson px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Enviar solicitud"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-edge px-6 py-3 font-display text-xs font-semibold uppercase tracking-wider text-fog transition-colors hover:text-snow"
        >
          Cancelar
        </button>
      </div>
    </motion.form>
  );
}
