"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { getSession } from "@/modules/auth/lib/auth";
import { StatCard } from "@/modules/shared/components/StatCard";
import { EmptyState } from "@/modules/shared/components/EmptyState";
import { Badge } from "@/modules/shared/components/Badge";
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
    const myId = getSession()?.id ?? null;
    const { data, error } = await supabase
      .from("quotes")
      .insert({ title: "Nueva cotización", created_by: myId, assigned_to: myId })
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
    },
    { label: "Borradores", value: stats.borradores, accent: "text-fog" },
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
          <p className="section-number">/ propuestas</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-snow">
            Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-fog">
            Propuestas comerciales: crea, envía y recibe aprobaciones en línea.
          </p>
          <a
            href="/cotizaciones"
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-xs text-azul transition-colors hover:text-snow"
          >
            Ver portal del cliente ↗
          </a>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={createQuote}
          disabled={creating}
          className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow shadow-[0_4px_16px_rgba(216,17,43,0.35)] transition-colors hover:bg-crimson-bright disabled:opacity-60"
        >
          {creating ? "Creando…" : "+ Nueva cotización"}
        </motion.button>
      </motion.div>

      {/* Estadísticas */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={loading ? "—" : c.value}
            accent={c.accent}
            delay={i * 0.08}
          />
        ))}
      </div>

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
                ? "text-snow"
                : "text-fog hover:bg-steel hover:text-snow"
            }`}
          >
            {filter === f.key && (
              <motion.span
                layoutId="qfilter-pill"
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 rounded-lg bg-crimson"
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, cliente o código…"
          className="field-dark w-full sm:ml-auto sm:w-auto sm:max-w-xs !py-2 text-xs sm:text-sm"
        />
      </motion.div>

      {/* Lista */}
      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((q, i) => {
            const st = effectiveStatus(q);
            const me = getSession();
            const pendingForMe =
              q.approval_status === "pendiente" && me && q.approver_id === me.id;
            return (
              <motion.button
                key={q.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.04, ease } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                whileHover={{ x: 4 }}
                onClick={() => router.push(`/cotizaciones/gestion/${q.id}`)}
                className={`group flex w-full items-center gap-4 rounded-lg border bg-carbon/70 p-4 text-left transition-colors hover:border-snow/20 ${
                  pendingForMe ? "border-gold/50 ring-1 ring-gold/20" : "border-edge"
                }`}
              >
                <span className="font-mono hidden shrink-0 text-xs text-fog sm:block">
                  {quoteCode(q.quote_no)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-snow">
                    {q.title || "Sin título"}
                    {pendingForMe && (
                      <span className="ml-2 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-soft">
                        Tuya para aprobar
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-fog">
                    {q.client_name || "Sin cliente"}
                    {q.valid_until &&
                      ` · válida hasta ${new Date(q.valid_until + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                <span className="font-display hidden shrink-0 text-sm font-semibold text-snow sm:block">
                  {money(totalOf(q), q.currency)}
                </span>
                <Badge
                  tone={
                    st === "aprobada"
                      ? "esmeralda"
                      : st === "rechazada"
                        ? "crimson"
                        : st === "vencida"
                          ? "gold"
                          : st === "enviada"
                            ? "azul"
                            : "neutral"
                  }
                  pulse={st === "enviada"}
                >
                  {QUOTE_STATUS[st].label}
                </Badge>
                <span className="text-ash transition-transform duration-200 group-hover:translate-x-1 group-hover:text-crimson-bright">
                  →
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {!loading && !visible.length && (
          <EmptyState
            title={
              quotes.length
                ? "Ninguna cotización coincide con el filtro."
                : "Aún no hay cotizaciones."
            }
            description={!quotes.length ? "Crea la primera con “+ Nueva cotización”." : undefined}
          />
        )}
      </div>
    </div>
  );
}
