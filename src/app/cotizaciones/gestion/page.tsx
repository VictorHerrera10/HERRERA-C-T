"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Quote,
  type QuoteItem,
  type QuoteStatus,
  QUOTE_STATUS,
  QUOTE_STATUS_ORDER,
  quoteCode,
  money,
  quoteTotals,
  effectiveStatus,
} from "@/modules/quotes/lib/quotes";

const ease = [0.21, 0.6, 0.35, 1] as const;

type Filter = "todas" | QuoteStatus;

export default function CotizacionesGestionPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("todas");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const [q, i] = await Promise.all([
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("quote_items").select("*"),
    ]);
    if (q.error)
      toast.error(
        "No se pudo cargar el módulo",
        `${q.error.message} — ejecuta supabase/migration-cotizaciones.sql si falta.`
      );
    else {
      setQuotes((q.data as Quote[]) ?? []);
      setItems((i.data as QuoteItem[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function totalOf(q: Quote): number {
    const its = items.filter((it) => it.quote_id === q.id);
    return quoteTotals(its, q.tax_rate).total;
  }

  const stats = useMemo(() => {
    const byStatus = (s: QuoteStatus) =>
      quotes.filter((q) => effectiveStatus(q) === s);
    const aprobadas = byStatus("aprobada");
    return {
      enviadas: byStatus("enviada").length,
      aprobadas: aprobadas.length,
      montoAprobado: aprobadas.reduce((s, q) => s + totalOf(q), 0),
      borradores: byStatus("borrador").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, items]);

  const visible = useMemo(() => {
    let list = quotes;
    if (filter !== "todas")
      list = list.filter((q) => effectiveStatus(q) === filter);
    const s = search.trim().toLowerCase();
    if (s)
      list = list.filter(
        (q) =>
          q.title.toLowerCase().includes(s) ||
          q.client_name.toLowerCase().includes(s) ||
          quoteCode(q.quote_no).toLowerCase().includes(s)
      );
    return list;
  }, [quotes, filter, search]);

  async function createQuote() {
    setCreating(true);
    const { data, error } = await supabase
      .from("quotes")
      .insert({ title: "Nueva cotización" })
      .select()
      .single();
    setCreating(false);
    if (error) return toast.error("No se pudo crear la cotización", error.message);
    router.push(`/cotizaciones/gestion/${data.id}`);
  }

  const currency = quotes[0]?.currency ?? "USD";

  const cards = [
    { label: "Enviadas (en espera)", value: stats.enviadas, accent: "text-azul" },
    { label: "Aprobadas", value: stats.aprobadas, accent: "text-esmeralda" },
    {
      label: "Monto aprobado",
      value: money(stats.montoAprobado, currency),
      accent: "text-esmeralda",
      isMoney: true,
    },
    { label: "Borradores", value: stats.borradores, accent: "text-ink-soft" },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">
            Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Propuestas comerciales: crea, envía y recibe aprobaciones en línea.
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={createQuote}
          disabled={creating}
          className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory shadow-[0_4px_16px_rgba(138,22,38,0.3)] transition-colors hover:bg-burgundy-bright disabled:opacity-60"
        >
          {creating ? "Creando…" : "+ Nueva cotización"}
        </motion.button>
      </motion.div>

      {/* Estadísticas */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
        className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {cards.map((c) => (
          <motion.div
            key={c.label}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
            }}
            whileHover={{ y: -4 }}
            className="rounded-lg border border-ink/8 bg-white p-5 shadow-[0_2px_12px_rgba(30,33,37,0.04)] transition-shadow hover:shadow-[0_10px_26px_rgba(30,33,37,0.08)]"
          >
            <p
              className={`font-display font-medium ${c.accent} ${
                c.isMoney ? "text-xl leading-[2.5rem]" : "text-4xl"
              }`}
            >
              {loading ? "—" : c.value}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {c.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center gap-2 overflow-x-auto pb-1"
      >
        {(
          [{ key: "todas" as Filter, label: "Todas" }].concat(
            QUOTE_STATUS_ORDER.map((s) => ({
              key: s as Filter,
              label: QUOTE_STATUS[s].label,
            }))
          )
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              filter === f.key
                ? "text-ivory"
                : "text-ink-soft hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {filter === f.key && (
              <motion.span
                layoutId="qfilter-pill"
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 rounded-lg bg-burgundy"
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, cliente o código…"
          className="field w-full sm:ml-auto sm:w-auto sm:max-w-xs !py-2 text-xs sm:text-sm"
        />
      </motion.div>

      {/* Lista */}
      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((q, i) => {
            const st = effectiveStatus(q);
            return (
              <motion.button
                key={q.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.04, ease } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                whileHover={{ x: 4 }}
                onClick={() => router.push(`/cotizaciones/gestion/${q.id}`)}
                className="group flex w-full items-center gap-4 rounded-lg border border-ink/8 bg-white p-4 text-left shadow-[0_1px_8px_rgba(30,33,37,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,33,37,0.08)]"
              >
                <span className="font-mono hidden shrink-0 text-xs text-ink-faint sm:block">
                  {quoteCode(q.quote_no)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {q.title || "Sin título"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    {q.client_name || "Sin cliente"}
                    {q.valid_until &&
                      ` · válida hasta ${new Date(q.valid_until + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                <span className="font-display hidden shrink-0 text-sm font-semibold text-ink sm:block">
                  {money(totalOf(q), q.currency)}
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${QUOTE_STATUS[st].badge}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${QUOTE_STATUS[st].dot} ${st === "enviada" ? "animate-pulse-dot" : ""}`}
                  />
                  {QUOTE_STATUS[st].label}
                </span>
                <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-burgundy">
                  →
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {!loading && !visible.length && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-dashed border-ink/15 px-5 py-12 text-center text-sm text-ink-faint"
          >
            {quotes.length
              ? "Ninguna cotización coincide con el filtro."
              : "Aún no hay cotizaciones. Crea la primera con “+ Nueva cotización”."}
          </motion.p>
        )}
      </div>
    </div>
  );
}
