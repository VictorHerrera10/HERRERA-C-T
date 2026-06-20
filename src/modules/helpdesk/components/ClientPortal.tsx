"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { Icon } from "@/modules/shared/components/Icon";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";
import { useToast } from "@/modules/shared/components/Toast";
import { useClientSession } from "@/modules/shared/hooks/useClientSession";
import {
  type Ticket,
  type TicketComment,
  type TicketCategory,
  STATUS,
  STATUS_ORDER,
  CATEGORY,
  ticketCode,
  timeAgo,
} from "@/modules/helpdesk/lib/tickets";
import {
  type ClientData,
  type WizardDetalle,
  DETALLE_VACIO,
  SOPORTE_SERVICIOS,
  SOPORTE_URGENCIA,
  CAIDA_DESDE,
  CAIDA_ALCANCE,
  FUNCIONALIDAD_PLAZO,
  detalleValido,
  buildTicket,
  clientDisplayName,
} from "@/modules/helpdesk/lib/wizard";

const ease = [0.21, 0.6, 0.35, 1] as const;

/* ── Piezas de UI ────────────────────────────────────────── */

function WordReveal({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 + i * 0.05, duration: 0.55, ease }}
          className="inline-block"
        >
          {w}
          {" "}
        </motion.span>
      ))}
    </span>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.18em] text-fog">
      {children}
    </span>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <motion.button
          key={o.value}
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            value === o.value
              ? "border-crimson bg-crimson/12 text-crimson-bright shadow-[0_0_18px_rgba(216,17,43,0.25)]"
              : "border-edge bg-steel/40 text-fog hover:border-snow/25 hover:text-snow"
          }`}
        >
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden rounded-lg bg-crimson px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-snow shadow-[0_8px_28px_rgba(216,17,43,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(216,17,43,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
    </motion.button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-edge px-5 py-3.5 text-sm font-semibold text-fog transition-colors hover:border-snow/30 hover:text-snow"
    >
      {children}
    </button>
  );
}

const stepMotion = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, x: -48, transition: { duration: 0.25 } },
};

/* ── Tarjetas de categoría (paso 2) ──────────────────────── */

const CATEGORY_CARDS: {
  value: TicketCategory;
  icon: string;
  title: string;
  desc: string;
  hint: string;
  accent: string;
}[] = [
  {
    value: "soporte",
    icon: "support",
    title: "Tengo una duda",
    desc: "Preguntas y ayuda sobre tus servicios contratados.",
    hint: "¿Cómo edito…? ¿Dónde veo…?",
    accent: "text-azul",
  },
  {
    value: "caida",
    icon: "server",
    title: "Algo dejó de funcionar",
    desc: "Tu sitio, correo o sistema está caído o con fallas.",
    hint: "Atención prioritaria",
    accent: "text-crimson-bright",
  },
  {
    value: "funcionalidad",
    icon: "rocket",
    title: "Quiero algo nuevo",
    desc: "Una mejora o funcionalidad para tu plataforma.",
    hint: "Cuéntanos tu idea",
    accent: "text-esmeralda",
  },
];

/* ── Componente principal ────────────────────────────────── */

type Mode = "crear" | "seguir";

export function ClientPortal() {
  const [mode, setMode] = useState<Mode>("crear");
  const clientSession = useClientSession();

  /* asistente */
  const [step, setStep] = useState(0);
  const [datos, setDatos] = useState<ClientData>({ nombre: "", empresa: "", correo: "" });
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [detalle, setDetalle] = useState<WizardDetalle>(structuredClone(DETALLE_VACIO));
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<Ticket | null>(null);
  const toast = useToast();

  /* seguimiento */
  const [trackCode, setTrackCode] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [tracked, setTracked] = useState<Ticket | null>(null);
  const [trackComments, setTrackComments] = useState<TicketComment[]>([]);
  const [trackReply, setTrackReply] = useState("");

  /* Si viene con token, pre-llenar datos y saltar paso 0 */
  useEffect(() => {
    if (clientSession.status !== "ready") return;
    const s = clientSession.session;
    setDatos({
      nombre: s.user_name,
      empresa: s.client_name,
      correo: s.user_email,
    });
    setTrackEmail(s.user_email);
    setStep(1); // saltar directo a categoría
  }, [clientSession.status]);

  const hasToken = clientSession.status === "ready" || clientSession.status === "loading";
  const emailOk = /\S+@\S+\.\S+/.test(datos.correo);
  const datosOk = datos.nombre.trim().length > 1 && emailOk;

  async function submit() {
    if (!category) return;
    setSending(true);
    const built = buildTicket(category, datos, detalle);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        ...built,
        category,
        client_name: clientDisplayName(datos),
        client_email: datos.correo.trim().toLowerCase(),
      })
      .select()
      .single();
    setSending(false);
    if (error) {
      toast.error(
        "No pudimos registrar tu ticket",
        "Intenta de nuevo en unos minutos o escríbenos por correo."
      );
      return;
    }
    setCreated(data as Ticket);
    setStep(4);
  }

  async function track(codeOverride?: string, emailOverride?: string) {
    const code = (codeOverride ?? trackCode).trim().toUpperCase();
    const email = (emailOverride ?? trackEmail).trim().toLowerCase();
    const n = parseInt(code.replace(/\D/g, ""), 10);
    setTracked(null);
    if (!n || !email) {
      toast.warning(
        "Faltan datos",
        "Ingresa el código del ticket (ej. HCT-0012) y tu correo."
      );
      return;
    }
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_no", n)
      .eq("client_email", email)
      .maybeSingle();
    if (error || !data) {
      toast.error(
        "Ticket no encontrado",
        "No hay un ticket con ese código y correo. Revisa los datos."
      );
      return;
    }
    setTracked(data as Ticket);
    const { data: c } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", data.id)
      .order("created_at");
    setTrackComments((c as TicketComment[]) ?? []);
  }

  async function sendTrackReply() {
    if (!tracked || !trackReply.trim()) return;
    await supabase.from("ticket_comments").insert({
      ticket_id: tracked.id,
      author: tracked.client_name.split("—")[0].trim() || "Cliente",
      body: trackReply.trim(),
    });
    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tracked.id);
    setTrackReply("");
    track(ticketCode(tracked.ticket_no), tracked.client_email);
  }

  function resetWizard() {
    setStep(0);
    setCategory("");
    setDetalle(structuredClone(DETALLE_VACIO));
    setCreated(null);
  }

  const progress = mode === "crear" ? Math.min(step, 3) / 3 : 0;

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-void text-snow">
      {/* Atmósfera */}
      <div className="tech-grid absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-15%] h-[30rem] w-[30rem] rounded-full bg-crimson/12 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-blood/25 blur-[130px]" />
      </div>
      <div className="scanline-layer" />
      <FloatingIcons
        icons={[
          { name: "support", className: "left-[4%] top-[18%] h-28 w-28 text-crimson/10", duration: 10 },
          { name: "chip", className: "right-[5%] top-[30%] h-24 w-24 text-snow/5", delay: 2, duration: 11 },
          { name: "shield", className: "left-[10%] bottom-[10%] h-24 w-24 text-snow/5", delay: 4, duration: 9 },
        ]}
      />

      {/* Barra superior */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 border-b border-edge bg-void/70 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
          <a href="/soporte" className="flex items-center gap-3">
            <div className="logo-badge h-9 w-9 p-1.5">
              <div className="relative h-full w-full">
                <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
              </div>
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                Centro de soporte
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-fog">
                Herrera C&amp;T
              </p>
            </div>
          </a>
          <a
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog transition-colors hover:text-snow"
          >
            ← Volver al sitio
          </a>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-12">
        {/* Selector de modo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease }}
          className="mb-10 flex justify-center"
        >
          <div className="flex rounded-lg border border-edge bg-steel/50 p-1 backdrop-blur-sm">
            {(
              [
                { key: "crear", label: "Crear ticket" },
                { key: "seguir", label: "Seguir mi ticket" },
              ] as { key: Mode; label: string }[]
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`relative rounded-md px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === m.key ? "text-snow" : "text-fog hover:text-snow"
                }`}
              >
                {mode === m.key && (
                  <motion.span
                    layoutId="mode-pill"
                    transition={{ duration: 0.35, ease }}
                    className="absolute inset-0 rounded-md bg-crimson shadow-[0_4px_18px_rgba(216,17,43,0.45)]"
                  />
                )}
                <span className="relative">{m.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ════════ MODO CREAR ════════ */}
          {mode === "crear" && (
            <motion.div key="crear" {...stepMotion}>
              {/* Progreso */}
              {step < 4 && (
                <div className="mb-10">
                  {/* Tarjeta de identidad cuando viene con token */}
                  {hasToken && clientSession.status === "ready" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex items-center gap-3 rounded-lg border border-esmeralda/30 bg-esmeralda/8 px-4 py-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-esmeralda/20 text-esmeralda">
                        <Icon name="shield" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-snow">{clientSession.session.user_name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
                          {clientSession.session.client_name}
                          {clientSession.session.user_role ? ` · ${clientSession.session.user_role}` : ""}
                        </p>
                      </div>
                      <span className="font-mono ml-auto shrink-0 text-[9px] uppercase tracking-[0.18em] text-esmeralda">
                        ● Identificado
                      </span>
                    </motion.div>
                  )}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson-bright">
                      {hasToken
                        ? `[ Paso ${Math.min(step, 2)} / 03 ]`
                        : `[ Paso ${Math.min(step, 3) + 1} / 04 ]`}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                      {hasToken
                        ? ["Tipo de solicitud", "Tipo de solicitud", "Detalles", "Confirmar"][Math.min(step, 3)]
                        : ["Tus datos", "Tipo de solicitud", "Detalles", "Confirmar"][Math.min(step, 3)]}
                    </span>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-full bg-steel">
                    <motion.div
                      animate={{ width: hasToken ? `${Math.min(step, 3) * 33.3}%` : `${(Math.min(step, 3) + 1) * 25}%` }}
                      transition={{ duration: 0.5, ease }}
                      className="h-full bg-gradient-to-r from-crimson to-crimson-bright shadow-[0_0_12px_rgba(216,17,43,0.6)]"
                    />
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ── Paso 1: datos ── */}
                {step === 0 && (
                  <motion.section key="s0" {...stepMotion}>
                    <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                      <WordReveal text="Hablemos." />
                      <br />
                      <WordReveal
                        text="¿Quién nos escribe?"
                        className="text-shimmer"
                      />
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-fog">
                      Con tus datos seguimos tu caso y te avisamos de cada
                      avance.
                    </p>

                    <div className="mt-9 space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <MonoLabel>Tu nombre *</MonoLabel>
                          <input
                            className="field-dark"
                            placeholder="Nombre y apellido"
                            value={datos.nombre}
                            onChange={(e) =>
                              setDatos({ ...datos, nombre: e.target.value })
                            }
                          />
                        </label>
                        <label className="block">
                          <MonoLabel>Empresa</MonoLabel>
                          <input
                            className="field-dark"
                            placeholder="Nombre de tu empresa"
                            value={datos.empresa}
                            onChange={(e) =>
                              setDatos({ ...datos, empresa: e.target.value })
                            }
                          />
                        </label>
                      </div>
                      <label className="block">
                        <MonoLabel>Correo *</MonoLabel>
                        <input
                          className="field-dark"
                          type="email"
                          placeholder="tu@empresa.com"
                          value={datos.correo}
                          onChange={(e) =>
                            setDatos({ ...datos, correo: e.target.value })
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-9 flex justify-end">
                      <PrimaryButton disabled={!datosOk} onClick={() => setStep(1)}>
                        Continuar →
                      </PrimaryButton>
                    </div>
                  </motion.section>
                )}

                {/* ── Paso 2: categoría ── */}
                {step === 1 && (
                  <motion.section key="s1" {...stepMotion}>
                    <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                      <WordReveal text="¿Qué necesitas" />
                      <WordReveal text="hoy?" className="text-shimmer" />
                    </h1>
                    <p className="mt-4 text-sm text-fog">
                      Elige el tipo de solicitud — cada una sigue un camino
                      distinto.
                    </p>

                    <div className="mt-9 grid gap-3 sm:gap-4 sm:grid-cols-3">
                      {CATEGORY_CARDS.map((c, i) => (
                        <motion.button
                          key={c.value}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease }}
                          whileHover={{ y: -6 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setCategory(c.value);
                            setTimeout(() => setStep(2), 260);
                          }}
                          className={`hud-corners group rounded-lg border p-6 text-left backdrop-blur-sm transition-colors duration-300 ${
                            category === c.value
                              ? "border-crimson bg-crimson/10"
                              : "border-edge bg-steel/50 hover:border-crimson/40"
                          }`}
                        >
                          <span
                            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-void/60 ${c.accent} transition-transform duration-300 group-hover:scale-110`}
                          >
                            <Icon name={c.icon} className="h-6 w-6" />
                          </span>
                          <p className="font-display text-sm font-bold uppercase tracking-wide text-snow">
                            {c.title}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-fog">
                            {c.desc}
                          </p>
                          <p className="font-mono mt-3 text-[9px] uppercase tracking-[0.18em] text-ash">
                            {c.hint}
                          </p>
                        </motion.button>
                      ))}
                    </div>

                    <div className="mt-9">
                      <GhostButton onClick={() => setStep(0)}>← Atrás</GhostButton>
                    </div>
                  </motion.section>
                )}

                {/* ── Paso 3: detalles por categoría ── */}
                {step === 2 && category && (
                  <motion.section key={`s2-${category}`} {...stepMotion}>
                    <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                      <WordReveal
                        text={
                          category === "soporte"
                            ? "Cuéntanos tu duda"
                            : category === "caida"
                              ? "Reporta la caída"
                              : "Describe tu idea"
                        }
                        className={category === "caida" ? "text-shimmer" : undefined}
                      />
                    </h1>
                    <p className="mt-4 text-sm text-fog">
                      {category === "soporte" &&
                        "Mientras más contexto nos des, más rápida y precisa será la respuesta."}
                      {category === "caida" &&
                        "Estos datos nos permiten dimensionar el incidente y priorizarlo de inmediato."}
                      {category === "funcionalidad" &&
                        "Desglosa el requerimiento: qué debe hacer, para quién y para cuándo."}
                    </p>

                    <div className="mt-9 space-y-7">
                      {category === "soporte" && (
                        <>
                          <div>
                            <MonoLabel>¿Sobre qué servicio es tu duda? *</MonoLabel>
                            <Chips
                              options={SOPORTE_SERVICIOS.map((s) => ({ value: s, label: s }))}
                              value={detalle.soporte.servicio}
                              onChange={(v) =>
                                setDetalle({ ...detalle, soporte: { ...detalle.soporte, servicio: v } })
                              }
                            />
                          </div>
                          <label className="block">
                            <MonoLabel>Tu pregunta *</MonoLabel>
                            <textarea
                              className="field-dark resize-none"
                              rows={4}
                              placeholder="Escribe tu duda con el mayor detalle posible…"
                              value={detalle.soporte.pregunta}
                              onChange={(e) =>
                                setDetalle({ ...detalle, soporte: { ...detalle.soporte, pregunta: e.target.value } })
                              }
                            />
                          </label>
                          <div>
                            <MonoLabel>¿Qué tan urgente es?</MonoLabel>
                            <Chips
                              options={SOPORTE_URGENCIA}
                              value={detalle.soporte.urgencia}
                              onChange={(v) =>
                                setDetalle({ ...detalle, soporte: { ...detalle.soporte, urgencia: v } })
                              }
                            />
                          </div>
                        </>
                      )}

                      {category === "caida" && (
                        <>
                          <label className="block">
                            <MonoLabel>¿Qué sistema está fallando? *</MonoLabel>
                            <input
                              className="field-dark"
                              placeholder="Ej. Sitio web, correo, sistema de ventas…"
                              value={detalle.caida.sistema}
                              onChange={(e) =>
                                setDetalle({ ...detalle, caida: { ...detalle.caida, sistema: e.target.value } })
                              }
                            />
                          </label>
                          <div>
                            <MonoLabel>¿Desde cuándo? *</MonoLabel>
                            <Chips
                              options={CAIDA_DESDE.map((d) => ({ value: d, label: d }))}
                              value={detalle.caida.desde}
                              onChange={(v) =>
                                setDetalle({ ...detalle, caida: { ...detalle.caida, desde: v } })
                              }
                            />
                          </div>
                          <div>
                            <MonoLabel>¿A cuántas personas afecta?</MonoLabel>
                            <Chips
                              options={CAIDA_ALCANCE}
                              value={detalle.caida.alcance}
                              onChange={(v) =>
                                setDetalle({ ...detalle, caida: { ...detalle.caida, alcance: v } })
                              }
                            />
                            {detalle.caida.alcance === "todos" && (
                              <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-mono mt-3 text-[10px] uppercase tracking-[0.18em] text-crimson-bright"
                              >
                                ⚠ Se marcará como incidente crítico
                              </motion.p>
                            )}
                          </div>
                          <label className="block">
                            <MonoLabel>¿Qué ves? (mensaje de error, pantalla, etc.)</MonoLabel>
                            <textarea
                              className="field-dark resize-none"
                              rows={3}
                              placeholder="Opcional, pero acelera el diagnóstico…"
                              value={detalle.caida.sintoma}
                              onChange={(e) =>
                                setDetalle({ ...detalle, caida: { ...detalle.caida, sintoma: e.target.value } })
                              }
                            />
                          </label>
                        </>
                      )}

                      {category === "funcionalidad" && (
                        <>
                          <label className="block">
                            <MonoLabel>Resume tu idea en una frase *</MonoLabel>
                            <input
                              className="field-dark"
                              placeholder="Ej. Quiero un módulo de reservas en mi sitio"
                              value={detalle.funcionalidad.resumen}
                              onChange={(e) =>
                                setDetalle({ ...detalle, funcionalidad: { ...detalle.funcionalidad, resumen: e.target.value } })
                              }
                            />
                          </label>
                          <label className="block">
                            <MonoLabel>¿Qué debe hacer exactamente? *</MonoLabel>
                            <textarea
                              className="field-dark resize-none"
                              rows={4}
                              placeholder="Describe el flujo ideal: qué entra, qué pasa, qué sale…"
                              value={detalle.funcionalidad.objetivo}
                              onChange={(e) =>
                                setDetalle({ ...detalle, funcionalidad: { ...detalle.funcionalidad, objetivo: e.target.value } })
                              }
                            />
                          </label>
                          <label className="block">
                            <MonoLabel>¿Quiénes la usarán?</MonoLabel>
                            <input
                              className="field-dark"
                              placeholder="Ej. Mis clientes, el equipo de ventas… (opcional)"
                              value={detalle.funcionalidad.usuarios}
                              onChange={(e) =>
                                setDetalle({ ...detalle, funcionalidad: { ...detalle.funcionalidad, usuarios: e.target.value } })
                              }
                            />
                          </label>
                          <div>
                            <MonoLabel>¿Para cuándo la necesitas?</MonoLabel>
                            <Chips
                              options={FUNCIONALIDAD_PLAZO}
                              value={detalle.funcionalidad.plazo}
                              onChange={(v) =>
                                setDetalle({ ...detalle, funcionalidad: { ...detalle.funcionalidad, plazo: v } })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-9 flex justify-between">
                      <GhostButton onClick={() => setStep(1)}>← Atrás</GhostButton>
                      <PrimaryButton
                        disabled={!detalleValido(category, detalle)}
                        onClick={() => setStep(3)}
                      >
                        Revisar →
                      </PrimaryButton>
                    </div>
                  </motion.section>
                )}

                {/* ── Paso 4: confirmar ── */}
                {step === 3 && category && (
                  <motion.section key="s3" {...stepMotion}>
                    <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                      <WordReveal text="Todo listo." />
                      <WordReveal text="Confirma y enviamos." className="text-shimmer" />
                    </h1>

                    {(() => {
                      const built = buildTicket(category, datos, detalle);
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.5, ease }}
                          className="hud-corners mt-9 rounded-lg border border-edge bg-steel/60 p-6 backdrop-blur-sm lg:p-8"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono rounded-md border border-crimson/40 bg-void/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-crimson-bright">
                              {CATEGORY[category].label}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                              prioridad estimada: {built.priority}
                            </span>
                          </div>
                          <p className="font-display mt-4 text-lg font-bold uppercase tracking-wide text-snow">
                            {built.title}
                          </p>
                          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-void/60 p-4 font-body text-sm leading-relaxed text-fog">
                            {built.description}
                          </pre>
                          <p className="font-mono mt-4 text-[10px] uppercase tracking-[0.18em] text-ash">
                            {clientDisplayName(datos)} · {datos.correo}
                          </p>
                        </motion.div>
                      );
                    })()}

                    <div className="mt-9 flex justify-between">
                      <GhostButton onClick={() => setStep(2)}>← Corregir</GhostButton>
                      <PrimaryButton disabled={sending} onClick={submit}>
                        {sending ? "Enviando…" : "Enviar ticket ⚡"}
                      </PrimaryButton>
                    </div>
                  </motion.section>
                )}

                {/* ── Éxito ── */}
                {step === 4 && created && (
                  <motion.section key="s4" {...stepMotion} className="text-center">
                    <motion.svg
                      viewBox="0 0 52 52"
                      className="mx-auto h-20 w-20"
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.circle
                        cx="26"
                        cy="26"
                        r="24"
                        fill="none"
                        stroke="#1fce8c"
                        strokeWidth="2"
                        variants={{
                          hidden: { pathLength: 0 },
                          visible: { pathLength: 1, transition: { duration: 0.7, ease } },
                        }}
                      />
                      <motion.path
                        d="M15 27l8 8 15-16"
                        fill="none"
                        stroke="#1fce8c"
                        strokeWidth="3"
                        strokeLinecap="round"
                        variants={{
                          hidden: { pathLength: 0 },
                          visible: { pathLength: 1, transition: { duration: 0.5, delay: 0.6, ease } },
                        }}
                      />
                    </motion.svg>

                    <h1 className="font-display mt-7 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                      Ticket recibido
                    </h1>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.6, ease }}
                      className="text-shimmer font-display mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl"
                    >
                      {ticketCode(created.ticket_no)}
                    </motion.p>
                    <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-fog">
                      Guarda este código. Con él y tu correo puedes seguir el
                      estado de tu solicitud en cualquier momento.
                    </p>

                    <div className="mt-9 flex flex-wrap justify-center gap-4">
                      <PrimaryButton
                        onClick={() => {
                          setMode("seguir");
                          setTrackCode(ticketCode(created.ticket_no));
                          setTrackEmail(created.client_email);
                          track(ticketCode(created.ticket_no), created.client_email);
                          resetWizard();
                        }}
                      >
                        Seguir este ticket
                      </PrimaryButton>
                      <GhostButton onClick={resetWizard}>Crear otro</GhostButton>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ════════ MODO SEGUIR ════════ */}
          {mode === "seguir" && (
            <motion.div key="seguir" {...stepMotion}>
              <h1 className="font-display text-center text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
                <WordReveal text="Sigue tu" />
                <WordReveal text="ticket" className="text-shimmer" />
              </h1>
              <p className="mt-4 text-center text-sm text-fog">
                Ingresa el código que recibiste y el correo con el que lo creaste.
              </p>

              <div className="mx-auto mt-9 flex max-w-lg flex-col gap-3 sm:flex-row sm:gap-4">
                <input
                  className="field-dark font-mono uppercase"
                  placeholder="HCT-0000"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                />
                <input
                  className="field-dark"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={trackEmail}
                  onChange={(e) => setTrackEmail(e.target.value)}
                />
                <PrimaryButton onClick={() => track()}>Buscar</PrimaryButton>
              </div>


              {tracked && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease }}
                  className="hud-corners mt-10 rounded-lg border border-edge bg-steel/60 p-6 backdrop-blur-sm lg:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                        {ticketCode(tracked.ticket_no)} · {timeAgo(tracked.created_at)}
                      </p>
                      <p className="font-display mt-1 text-lg font-bold uppercase tracking-wide text-snow">
                        {tracked.title}
                      </p>
                    </div>
                    <span className="font-mono rounded-md border border-crimson/40 bg-void/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-crimson-bright">
                      {CATEGORY[tracked.category].label}
                    </span>
                  </div>

                  {/* Línea de progreso de estados */}
                  <div className="mt-7">
                    <MonoLabel>Estado actual</MonoLabel>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      {STATUS_ORDER.map((s, i) => {
                        const currentIdx = STATUS_ORDER.indexOf(tracked.status);
                        const isCurrent = i === currentIdx;
                        const isPast = i < currentIdx;
                        return (
                          <div key={s} className="flex items-center gap-1.5">
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.15 + i * 0.08 }}
                              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                isCurrent
                                  ? "bg-crimson text-snow shadow-[0_0_16px_rgba(216,17,43,0.4)]"
                                  : isPast
                                    ? "bg-snow/10 text-snow/70"
                                    : "bg-steel text-ash"
                              }`}
                            >
                              {isCurrent && (
                                <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-snow" />
                              )}
                              {STATUS[s].label}
                            </motion.span>
                            {i < STATUS_ORDER.length - 1 && (
                              <span
                                className={`h-px w-3 ${isPast ? "bg-crimson/50" : "bg-edge"}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conversación */}
                  <div className="mt-7 border-t border-edge pt-6">
                    <MonoLabel>Conversación ({trackComments.length})</MonoLabel>
                    <div className="space-y-3">
                      {trackComments.map((c) => (
                        <div key={c.id} className="rounded-lg bg-void/60 px-4 py-3">
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-xs font-bold text-snow">{c.author}</p>
                            <time className="font-mono shrink-0 text-[9px] uppercase text-ash">
                              {timeAgo(c.created_at)}
                            </time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fog">
                            {c.body}
                          </p>
                        </div>
                      ))}
                      {!trackComments.length && (
                        <p className="rounded-lg border border-dashed border-edge px-4 py-5 text-center text-xs text-ash">
                          Aún no hay respuestas. Te avisaremos por correo.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <input
                        className="field-dark"
                        placeholder="Agregar un comentario…"
                        value={trackReply}
                        onChange={(e) => setTrackReply(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendTrackReply()}
                      />
                      <PrimaryButton onClick={sendTrackReply}>Enviar</PrimaryButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
