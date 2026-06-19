"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Ticket,
  type TicketStatus,
  STATUS,
  STATUS_ORDER,
  CATEGORY,
  PRIORITY,
  ACTIVE_STATUSES,
  ticketCode,
  timeAgo,
} from "@/modules/helpdesk/lib/tickets";

const ease = [0.21, 0.6, 0.35, 1] as const;

type Filter = "todos" | "activos" | TicketStatus;

type NewTicket = {
  title: string;
  description: string;
  client_name: string;
  client_email: string;
  category: Ticket["category"];
  priority: Ticket["priority"];
};

const NEW_TICKET: NewTicket = {
  title: "",
  description: "",
  client_name: "",
  client_email: "",
  category: "soporte",
  priority: "media",
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("activos");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ ...NEW_TICKET });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error)
      toast.error(
        "No se pudo cargar la mesa de ayuda",
        `${error.message} — si las tablas no existen, ejecuta supabase/migration-tickets.sql`
      );
    else setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  /* ── Estadísticas ── */
  const stats = useMemo(() => {
    const active = tickets.filter((t) =>
      ACTIVE_STATUSES.includes(t.status)
    );
    return {
      activos: active.length,
      criticos: active.filter(
        (t) => t.priority === "critica" || t.category === "caida"
      ).length,
      espera: active.filter((t) => t.status === "espera").length,
      resueltos: tickets.filter(
        (t) => t.status === "resuelto" || t.status === "cerrado"
      ).length,
    };
  }, [tickets]);

  /* ── Filtro + búsqueda ── */
  const visible = useMemo(() => {
    let list = tickets;
    if (filter === "activos")
      list = list.filter((t) => ACTIVE_STATUSES.includes(t.status));
    else if (filter !== "todos") list = list.filter((t) => t.status === filter);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.client_name.toLowerCase().includes(q) ||
          ticketCode(t.ticket_no).toLowerCase().includes(q)
      );
    return [...list].sort(
      (a, b) =>
        PRIORITY[b.priority].weight - PRIORITY[a.priority].weight ||
        +new Date(b.created_at) - +new Date(a.created_at)
    );
  }, [tickets, filter, search]);

  async function createTicket() {
    if (!draft.title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert(draft)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error("No se pudo crear el ticket", error.message);
    toast.success("Ticket creado");
    setModalOpen(false);
    setDraft({ ...NEW_TICKET });
    if (data) router.push(`/soporte/gestion/${data.id}`);
  }

  const cards = [
    { label: "Tickets activos", value: stats.activos, accent: "text-azul", ring: "border-azul/25" },
    { label: "Críticos / Caídas", value: stats.criticos, accent: "text-burgundy", ring: "border-burgundy/25" },
    { label: "Espera de cliente", value: stats.espera, accent: "text-[#8a6a14]", ring: "border-gold/30" },
    { label: "Resueltos", value: stats.resueltos, accent: "text-esmeralda", ring: "border-esmeralda/25" },
  ];

  const filterChips: { key: Filter; label: string }[] = [
    { key: "activos", label: "Activos" },
    { key: "todos", label: "Todos" },
    ...STATUS_ORDER.map((s) => ({ key: s as Filter, label: STATUS[s].label })),
  ];

  return (
    <div>
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">
            Mesa de ayuda
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Tickets de soporte, incidentes y solicitudes de tus clientes.
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory shadow-[0_4px_16px_rgba(138,22,38,0.3)] transition-colors hover:bg-burgundy-bright"
        >
          + Nuevo ticket
        </motion.button>
      </motion.div>

      {/* Tarjetas de estadísticas */}
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
            className={`rounded-lg border bg-white p-5 shadow-[0_2px_12px_rgba(30,33,37,0.04)] transition-shadow hover:shadow-[0_10px_26px_rgba(30,33,37,0.08)] ${c.ring}`}
          >
            <p className={`font-display text-4xl font-medium ${c.accent}`}>
              {loading ? "—" : c.value}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {c.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filtros + búsqueda */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center gap-2 overflow-x-auto pb-1"
      >
        {filterChips.map((f) => (
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
                layoutId="filter-pill"
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

      {/* Lista de tickets */}
      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((t, i) => (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.04, ease } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              whileHover={{ x: 4 }}
              onClick={() => router.push(`/soporte/gestion/${t.id}`)}
              className="group relative flex w-full items-center gap-4 overflow-hidden rounded-lg border border-ink/8 bg-white p-4 text-left shadow-[0_1px_8px_rgba(30,33,37,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,33,37,0.08)]"
            >
              {/* Barra de prioridad */}
              <span
                className={`absolute left-0 top-0 h-full w-1 ${PRIORITY[t.priority].bar}`}
              />

              <span className="font-mono ml-2 hidden shrink-0 text-xs text-ink-faint sm:block">
                {ticketCode(t.ticket_no)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{t.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-faint">
                  {t.client_name || "Sin cliente"} · {timeAgo(t.created_at)}
                </p>
              </div>

              <span
                className={`hidden shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold md:block ${CATEGORY[t.category].chip}`}
              >
                {CATEGORY[t.category].label}
              </span>
              <span
                className={`hidden shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold sm:block ${PRIORITY[t.priority].chip}`}
              >
                {PRIORITY[t.priority].label}
              </span>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${STATUS[t.status].badge}`}
              >
                <span
                  className={`animate-pulse-dot h-1.5 w-1.5 rounded-full ${STATUS[t.status].dot}`}
                />
                {STATUS[t.status].label}
              </span>

              <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-burgundy">
                →
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {!loading && !visible.length && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-dashed border-ink/15 px-5 py-12 text-center text-sm text-ink-faint"
          >
            {tickets.length
              ? "Ningún ticket coincide con el filtro."
              : "La mesa de ayuda está vacía. Crea el primer ticket con “+ Nuevo ticket”."}
          </motion.p>
        )}
      </div>

      {/* Modal: nuevo ticket */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.35, ease }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-7 shadow-[0_30px_80px_rgba(30,33,37,0.3)]"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-medium text-ink">
                    Nuevo ticket
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Registra un requerimiento, incidente o solicitud.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <input
                  className="field"
                  placeholder="Título del requerimiento *"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
                <textarea
                  className="field resize-y"
                  rows={4}
                  placeholder="Describe el problema o la solicitud…"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="field"
                    placeholder="Cliente / Empresa"
                    value={draft.client_name}
                    onChange={(e) =>
                      setDraft({ ...draft, client_name: e.target.value })
                    }
                  />
                  <input
                    className="field"
                    type="email"
                    placeholder="Correo del cliente"
                    value={draft.client_email}
                    onChange={(e) =>
                      setDraft({ ...draft, client_email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Categoría
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(CATEGORY) as (keyof typeof CATEGORY)[]).map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDraft({ ...draft, category: c })}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                            draft.category === c
                              ? "border-burgundy bg-burgundy/8 text-burgundy"
                              : "border-ink/12 text-ink-soft hover:border-ink/30"
                          }`}
                        >
                          {CATEGORY[c].label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Prioridad
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(PRIORITY) as (keyof typeof PRIORITY)[]).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setDraft({ ...draft, priority: p })}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                            draft.priority === p
                              ? "border-burgundy bg-burgundy/8 text-burgundy"
                              : "border-ink/12 text-ink-soft hover:border-ink/30"
                          }`}
                        >
                          {PRIORITY[p].label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={createTicket}
                  disabled={!draft.title.trim() || saving}
                  className="flex-1 rounded-lg bg-burgundy px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-burgundy-bright disabled:opacity-50"
                >
                  {saving ? "Creando…" : "Crear ticket"}
                </motion.button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-ink/15 px-5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink/35"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
