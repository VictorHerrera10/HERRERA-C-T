"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function MensajesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const toast = useToast();

  async function load() {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("No se pudieron cargar los mensajes", error.message);
    else setLeads((data as Lead[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(lead: Lead) {
    await supabase.from("leads").update({ read: !lead.read }).eq("id", lead.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este mensaje definitivamente?")) return;
    await supabase.from("leads").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-ink">
        Mensajes recibidos
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        Consultas enviadas desde el formulario de contacto del sitio.
      </p>

      <div className="mt-8 space-y-4">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className={`rounded-lg border bg-white p-5 transition-colors ${
              lead.read ? "border-ink/8" : "border-burgundy/30 shadow-[0_4px_18px_rgba(110,20,35,0.08)]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {!lead.read && (
                  <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-burgundy" />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    {lead.name}
                    {lead.company && (
                      <span className="font-normal text-ink-faint"> · {lead.company}</span>
                    )}
                  </p>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-sm text-azul hover:underline"
                  >
                    {lead.email}
                  </a>
                </div>
              </div>
              <time className="text-xs text-ink-faint">
                {new Date(lead.created_at).toLocaleString("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>

            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-ivory px-4 py-3 text-sm leading-relaxed text-ink-soft">
              {lead.message}
            </p>

            <div className="mt-4 flex gap-2 text-xs font-medium">
              <button
                onClick={() => toggleRead(lead)}
                className={`rounded-md px-3 py-1.5 ${
                  lead.read
                    ? "bg-ink/8 text-ink-soft hover:bg-ink/14"
                    : "bg-esmeralda/10 text-esmeralda hover:bg-esmeralda/18"
                }`}
              >
                {lead.read ? "Marcar como no leído" : "Marcar como leído"}
              </button>
              <a
                href={`mailto:${lead.email}?subject=Re: tu consulta a Herrera C%26T`}
                className="rounded-md bg-azul/10 px-3 py-1.5 text-azul hover:bg-azul/18"
              >
                Responder por correo
              </a>
              <button
                onClick={() => remove(lead.id)}
                className="rounded-md bg-burgundy/8 px-3 py-1.5 text-burgundy hover:bg-burgundy/15"
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
        {!leads.length && (
          <p className="rounded-lg border border-dashed border-ink/15 px-5 py-10 text-center text-sm text-ink-faint">
            Bandeja vacía. Cuando alguien escriba desde el sitio, su mensaje
            aparecerá aquí.
          </p>
        )}
      </div>
    </div>
  );
}
