"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Ticket,
  type TicketComment,
  type TicketStatus,
  type TicketPriority,
  STATUS,
  STATUS_ORDER,
  CATEGORY,
  PRIORITY,
  ticketCode,
  timeAgo,
} from "@/modules/helpdesk/lib/tickets";

const ease = [0.21, 0.6, 0.35, 1] as const;

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([
      supabase.from("tickets").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at"),
    ]);
    if (t.error) {
      setLoadFailed(true);
      toast.error("No se pudo cargar el ticket", t.error.message);
    } else setTicket(t.data as Ticket | null);
    setComments((c.data as TicketComment[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(fields: Partial<Ticket>) {
    if (!ticket) return;
    setTicket({ ...ticket, ...fields });
    await supabase
      .from("tickets")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
  }

  async function sendReply() {
    if (!reply.trim() || !ticket) return;
    setSending(true);
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      author: "Herrera C&T",
      body: reply.trim(),
    });
    setSending(false);
    if (error) return toast.error("No se pudo enviar la respuesta", error.message);
    setReply("");
    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
    load();
  }

  async function removeTicket() {
    if (!ticket) return;
    if (!confirm(`¿Eliminar el ticket ${ticketCode(ticket.ticket_no)} y toda su conversación?`))
      return;
    await supabase.from("tickets").delete().eq("id", ticket.id);
    router.push("/soporte/gestion");
  }

  if (!ticket)
    return (
      <p className="text-sm text-ink-faint">
        {loadFailed ? "No se pudo cargar el ticket." : "Cargando ticket…"}
      </p>
    );

  return (
    <div>
      {/* Migas + encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <Link
          href="/soporte/gestion"
          className="text-xs font-medium text-ink-faint transition-colors hover:text-burgundy"
        >
          ← Mesa de ayuda
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-ink-faint">
              {ticketCode(ticket.ticket_no)} · creado {timeAgo(ticket.created_at)}
            </p>
            <h1 className="font-display mt-1 text-2xl font-medium text-ink sm:text-3xl">
              {ticket.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${CATEGORY[ticket.category].chip}`}
              >
                {CATEGORY[ticket.category].label}
              </span>
              {ticket.client_name && (
                <span className="rounded-md bg-ink/6 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                  {ticket.client_name}
                  {ticket.client_email && ` · ${ticket.client_email}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={removeTicket}
            className="rounded-lg border border-burgundy/25 px-3.5 py-2 text-xs font-semibold text-burgundy transition-colors hover:bg-burgundy/8"
          >
            Eliminar ticket
          </button>
        </div>
      </motion.div>

      {/* Stepper de estados */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        className="mt-7 rounded-lg border border-ink/8 bg-white p-5"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Estado del ticket
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_ORDER.map((s, i) => {
            const isCurrent = ticket.status === s;
            const isPast =
              STATUS_ORDER.indexOf(ticket.status) > i;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <button
                  onClick={() => update({ status: s })}
                  className={`relative rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "text-ivory"
                      : isPast
                        ? "text-ink hover:bg-ink/5"
                        : "text-ink-faint hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {isCurrent && (
                    <motion.span
                      layoutId="status-pill"
                      transition={{ duration: 0.35, ease }}
                      className="absolute inset-0 rounded-lg bg-burgundy"
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isCurrent ? "bg-ivory" : STATUS[s].dot
                      } ${isCurrent ? "animate-pulse-dot" : ""}`}
                    />
                    {STATUS[s].label}
                  </span>
                </button>
                {i < STATUS_ORDER.length - 1 && (
                  <span
                    className={`h-px w-4 ${isPast ? "bg-burgundy/40" : "bg-ink/12"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Prioridad
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRIORITY) as TicketPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => update({ priority: p })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                ticket.priority === p
                  ? "border-burgundy bg-burgundy/8 text-burgundy"
                  : "border-ink/12 text-ink-soft hover:border-ink/30"
              }`}
            >
              {PRIORITY[p].label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Descripción */}
      {ticket.description && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease }}
          className="mt-5 rounded-lg border border-ink/8 bg-white p-5"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Descripción
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {ticket.description}
          </p>
        </motion.div>
      )}

      {/* Conversación */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.26, ease }}
        className="mt-5 rounded-lg border border-ink/8 bg-white p-5"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Conversación ({comments.length})
        </p>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="flex gap-3"
              >
                <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-burgundy/10 text-sm font-semibold text-burgundy">
                  {c.author.charAt(0)}
                </span>
                <div className="min-w-0 flex-1 rounded-lg bg-ivory px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-semibold text-ink">{c.author}</p>
                    <time className="shrink-0 text-[10px] text-ink-faint">
                      {timeAgo(c.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                    {c.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!comments.length && (
            <p className="rounded-lg border border-dashed border-ink/12 px-4 py-6 text-center text-xs text-ink-faint">
              Sin respuestas aún. Escribe la primera actualización del ticket.
            </p>
          )}
        </div>

        {/* Responder */}
        <div className="mt-5 border-t border-ink/8 pt-5">
          <textarea
            className="field resize-y"
            rows={3}
            placeholder="Escribe una actualización o respuesta…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-faint">
              La respuesta queda registrada en el historial del ticket.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-burgundy-bright disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Responder"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
