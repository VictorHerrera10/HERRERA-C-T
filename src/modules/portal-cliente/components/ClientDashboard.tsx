"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { getClientSession, loadClientSession, clearClientSession } from "../lib/auth";
import type { MyQuote, MyProject } from "../lib/types";
import { PreliminaryQuoteForm } from "./PreliminaryQuoteForm";

const ease = [0.21, 0.6, 0.35, 1] as const;

const QUOTE_BADGE: Record<MyQuote["status"], string> = {
  borrador: "bg-ink/8 text-fog",
  enviada: "bg-azul/10 text-azul",
  aprobada: "bg-esmeralda/10 text-esmeralda",
  rechazada: "bg-crimson/10 text-crimson-bright",
  vencida: "bg-gold/15 text-gold-soft",
};

const PROJECT_BADGE: Record<MyProject["stage"], string> = {
  requisitos: "bg-gold/15 text-gold-soft",
  desarrollo: "bg-azul/10 text-azul",
  gerencia: "bg-[#6366f1]/15 text-[#a5a8fb]",
  cerrado: "bg-esmeralda/10 text-esmeralda",
};

export function ClientDashboard() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<MyQuote[]>([]);
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const client = getClientSession();

  const load = useCallback(async () => {
    const [q, p] = await Promise.all([
      supabase.rpc("hct_client_list_my_quotes"),
      supabase.rpc("hct_client_list_my_projects"),
    ]);
    setQuotes((q.data as MyQuote[]) ?? []);
    setProjects((p.data as MyProject[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadClientSession().then((c) => {
      if (cancelled) return;
      if (!c) {
        router.replace("/portal/cliente");
        return;
      }
      load();
    });
    return () => {
      cancelled = true;
    };
  }, [router, load]);

  async function logout() {
    await clearClientSession();
    router.push("/portal");
  }

  if (!client) return null;

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-void text-snow">
      <div className="tech-grid absolute inset-0 opacity-40" />
      <div className="scanline-layer" />

      <header className="relative z-10 border-b border-edge bg-void/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/portal" className="flex items-center gap-3">
            <div className="logo-badge h-9 w-9 p-1.5">
              <div className="relative h-full w-full">
                <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
              </div>
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Herrera C&amp;T</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-soft">
                Portal de cliente
              </p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="text-xs font-medium text-fog transition-colors hover:text-snow"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <p className="section-number">/ tu espacio</p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Hola, {client.first_name || "bienvenido"}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fog">
            Aquí puedes ver el estado de tus cotizaciones y proyectos, o pedirnos una
            cotización nueva.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-8"
        >
          <PreliminaryQuoteForm onCreated={load} />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="mt-10"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-fog">
            Tus cotizaciones
          </p>
          <div className="space-y-2.5">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-4 rounded-xl border border-edge bg-carbon/70 p-4"
              >
                <span className="font-mono hidden shrink-0 text-xs text-ash sm:block">
                  COT-{String(q.quote_no).padStart(4, "0")}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-snow/90">
                  {q.title || "Sin título"}
                </p>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${QUOTE_BADGE[q.status]}`}
                >
                  {q.status}
                </span>
              </div>
            ))}
            {!loading && !quotes.length && (
              <p className="rounded-xl border border-dashed border-edge px-5 py-8 text-center text-sm text-fog">
                Aún no tienes cotizaciones. Solicita la primera arriba.
              </p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mt-10"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-fog">
            Tus proyectos
          </p>
          <div className="space-y-2.5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-edge bg-carbon/70 p-4"
              >
                <span className="font-mono hidden shrink-0 text-xs text-ash sm:block">
                  PRY-{String(p.project_no).padStart(4, "0")}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-snow/90">{p.title}</p>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${PROJECT_BADGE[p.stage]}`}
                >
                  {p.stage}
                </span>
              </div>
            ))}
            {!loading && !projects.length && (
              <p className="rounded-xl border border-dashed border-edge px-5 py-8 text-center text-sm text-fog">
                Cuando una cotización se apruebe y se convierta en proyecto, lo verás aquí.
              </p>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
