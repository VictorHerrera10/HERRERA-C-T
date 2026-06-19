"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Quote,
  type QuoteItem,
  quoteCode,
  money,
  quoteTotals,
  effectiveStatus,
} from "@/modules/quotes/lib/quotes";

const ease = [0.21, 0.6, 0.35, 1] as const;

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
          {w}{" "}
        </motion.span>
      ))}
    </span>
  );
}

export function ClientQuoteView() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("c") ?? "");
  const [email, setEmail] = useState(params.get("e") ?? "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const toast = useToast();
  const [note, setNote] = useState("");
  const [deciding, setDeciding] = useState<"aprobada" | "rechazada" | null>(null);

  const lookup = useCallback(
    async (c?: string, e?: string) => {
      const codeV = (c ?? code).trim().toUpperCase();
      const emailV = (e ?? email).trim().toLowerCase();
      const n = parseInt(codeV.replace(/\D/g, ""), 10);
      setQuote(null);
      if (!n || !emailV) {
        toast.warning("Faltan datos", "Ingresa el código (ej. COT-0001) y tu correo.");
        return;
      }
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("quote_no", n)
        .eq("client_email", emailV)
        .maybeSingle();
      if (error || !data) {
        toast.error(
          "Cotización no encontrada",
          "No hay una cotización con ese código y correo. Revisa los datos."
        );
        return;
      }
      setQuote(data as Quote);
      const { data: i } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", data.id)
        .order("sort_order");
      setItems((i as QuoteItem[]) ?? []);
    },
    [code, email]
  );

  /* Si llega con enlace directo (?c=&e=), busca sola */
  useEffect(() => {
    if (params.get("c") && params.get("e")) lookup(params.get("c")!, params.get("e")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decide(status: "aprobada" | "rechazada") {
    if (!quote) return;
    setDeciding(status);
    const { error } = await supabase
      .from("quotes")
      .update({
        status,
        client_note: note.trim(),
        decided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);
    setDeciding(null);
    if (error)
      return toast.error("No se pudo registrar tu decisión", "Intenta de nuevo.");
    if (status === "aprobada")
      toast.success("¡Cotización aprobada!", "Gracias por tu confianza. Nos pondremos en contacto.");
    else
      toast.info("Cotización rechazada", "Gracias por avisarnos. Quedamos atentos a tus comentarios.");
    lookup(quoteCode(quote.quote_no), quote.client_email);
  }

  const st = quote ? effectiveStatus(quote) : null;
  const totals = quote ? quoteTotals(items, quote.tax_rate) : null;

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-void text-snow print:bg-white print:text-ink">
      <div className="tech-grid absolute inset-0 opacity-40 print:hidden" />
      <div className="pointer-events-none absolute inset-0 print:hidden">
        <div className="absolute right-[-12%] top-[-15%] h-[30rem] w-[30rem] rounded-full bg-crimson/12 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-blood/25 blur-[130px]" />
      </div>
      <div className="scanline-layer print:hidden" />
      <FloatingIcons
        icons={[
          { name: "chart", className: "left-[5%] top-[20%] h-26 w-26 text-crimson/10 print:hidden", duration: 10 },
          { name: "rocket", className: "right-[6%] bottom-[14%] h-24 w-24 text-snow/5 print:hidden", delay: 2.5, duration: 11 },
        ]}
      />

      {/* Barra superior */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 border-b border-edge bg-void/70 backdrop-blur-md print:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <a href="/cotizaciones" className="flex items-center gap-3">
            <div className="logo-badge h-9 w-9 p-1.5">
              <div className="relative h-full w-full">
                <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
              </div>
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                Cotizaciones
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

      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-12 print:pt-4">
        {!quote && (
          <>
            <h1 className="font-display text-center text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              <WordReveal text="Tu propuesta," />
              <WordReveal text="a un clic" className="text-shimmer" />
            </h1>
            <p className="mt-4 text-center text-sm text-fog">
              Ingresa el código de tu cotización y el correo donde la recibiste.
            </p>

            <div className="mx-auto mt-9 flex max-w-lg flex-col gap-3 sm:flex-row sm:gap-4">
              <input
                className="field-dark font-mono uppercase"
                placeholder="COT-0000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <input
                className="field-dark"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => lookup()}
                className="rounded-lg bg-crimson px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-snow shadow-[0_8px_28px_rgba(216,17,43,0.4)] transition-shadow hover:shadow-[0_12px_40px_rgba(216,17,43,0.6)]"
              >
                Ver
              </motion.button>
            </div>

          </>
        )}

        <AnimatePresence>
          {quote && totals && st && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              {/* Documento */}
              <div className="hud-corners rounded-lg border border-edge bg-steel/60 p-7 backdrop-blur-sm print:border-ink/20 print:bg-white lg:p-10">
                {/* Cabecera del documento */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-edge pb-6 print:border-ink/15">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-crimson-bright">
                      Propuesta comercial
                    </p>
                    <h1 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight text-snow print:text-ink sm:text-3xl">
                      {quote.title}
                    </h1>
                    <p className="mt-2 text-sm text-fog print:text-ink-soft">
                      Para: <span className="text-snow/90 print:text-ink">{quote.client_name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-snow print:text-ink">
                      {quoteCode(quote.quote_no)}
                    </p>
                    {quote.valid_until && (
                      <p className="font-mono mt-1 text-[10px] uppercase tracking-[0.16em] text-ash">
                        Válida hasta{" "}
                        {new Date(quote.valid_until + "T00:00:00").toLocaleDateString("es", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Líneas */}
                <div className="mt-6 space-y-3">
                  {items.map((it, i) => (
                    <motion.div
                      key={it.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.45, ease }}
                      className="flex items-baseline justify-between gap-4 border-b border-edge/60 pb-3 print:border-ink/10"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-snow/90 print:text-ink">
                          {it.description}
                        </p>
                        <p className="font-mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-ash">
                          {it.qty} × {money(it.unit_price, quote.currency)}
                        </p>
                      </div>
                      <p className="font-display shrink-0 text-sm font-semibold text-snow print:text-ink">
                        {money(it.qty * it.unit_price, quote.currency)}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Totales */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-6 flex justify-end"
                >
                  <div className="w-full space-y-1.5 text-sm sm:w-64">
                    <div className="flex justify-between text-fog print:text-ink-soft">
                      <span>Subtotal</span>
                      <span>{money(totals.subtotal, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-fog print:text-ink-soft">
                      <span>Impuesto ({quote.tax_rate}%)</span>
                      <span>{money(totals.tax, quote.currency)}</span>
                    </div>
                    <div className="font-display flex justify-between border-t border-edge pt-2 text-xl font-bold text-crimson-bright print:border-ink/15 print:text-burgundy">
                      <span>Total</span>
                      <span>{money(totals.total, quote.currency)}</span>
                    </div>
                  </div>
                </motion.div>

                {quote.notes && (
                  <div className="mt-7 rounded-lg bg-void/60 p-4 print:bg-ivory">
                    <p className="font-mono mb-1.5 text-[10px] uppercase tracking-[0.2em] text-ash">
                      Notas y condiciones
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-fog print:text-ink-soft">
                      {quote.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-7 print:hidden">
                {st === "enviada" && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease }}
                    className="rounded-lg border border-edge bg-steel/60 p-6 backdrop-blur-sm"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                      ¿Avanzamos? Tu decisión queda registrada al instante
                    </p>
                    <textarea
                      className="field-dark mt-4 resize-none"
                      rows={2}
                      placeholder="Comentario opcional (condiciones, dudas, ajustes)…"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => decide("aprobada")}
                        disabled={!!deciding}
                        className="flex-1 rounded-lg bg-esmeralda px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-void shadow-[0_8px_28px_rgba(31,206,140,0.35)] transition-shadow hover:shadow-[0_12px_40px_rgba(31,206,140,0.5)] disabled:opacity-50"
                      >
                        {deciding === "aprobada" ? "Registrando…" : "✓ Aprobar propuesta"}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => decide("rechazada")}
                        disabled={!!deciding}
                        className="rounded-lg border border-crimson/40 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-crimson-bright transition-colors hover:bg-crimson/10 disabled:opacity-50"
                      >
                        Rechazar
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {st === "aprobada" && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-esmeralda/30 bg-esmeralda/10 px-5 py-4 text-center text-sm font-semibold text-esmeralda"
                  >
                    ✓ Aprobaste esta propuesta
                    {quote.decided_at &&
                      ` el ${new Date(quote.decided_at).toLocaleDateString("es", { day: "numeric", month: "long" })}`}
                    . Nos pondremos en contacto para iniciar.
                  </motion.p>
                )}
                {st === "rechazada" && (
                  <p className="rounded-lg border border-crimson/30 bg-crimson/10 px-5 py-4 text-center text-sm font-semibold text-crimson-bright">
                    Rechazaste esta propuesta. Si quieres conversar ajustes,
                    escríbenos.
                  </p>
                )}
                {st === "vencida" && (
                  <p className="rounded-lg border border-gold/30 bg-gold/10 px-5 py-4 text-center text-sm font-semibold text-gold-soft">
                    Esta propuesta venció. Contáctanos para renovarla.
                  </p>
                )}
                {st === "borrador" && (
                  <p className="rounded-lg border border-edge bg-steel/50 px-5 py-4 text-center text-sm text-fog">
                    Esta propuesta aún está en preparación.
                  </p>
                )}

                <div className="mt-5 flex justify-center gap-4">
                  <button
                    onClick={() => window.print()}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog transition-colors hover:text-snow"
                  >
                    ⬇ Descargar PDF
                  </button>
                  <button
                    onClick={() => setQuote(null)}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog transition-colors hover:text-snow"
                  >
                    Buscar otra
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
