"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { getSession } from "@/modules/auth/lib/auth";
import { Spinner } from "@/modules/shared/components/Spinner";
import { Select } from "@/modules/shared/components/Select";
import {
  type Quote,
  type QuoteItem,
  type CatalogItem,
  type QuoteTermTemplate,
  type QuoteStatus,
  QUOTE_STATUS,
  APPROVAL_STATUS,
  quoteCode,
  money,
  quoteTotals,
  effectiveStatus,
} from "@/modules/quotes/lib/quotes";

const ease = [0.21, 0.6, 0.35, 1] as const;

const STEPPER: { key: QuoteStatus; label: string }[] = [
  { key: "borrador", label: "Borrador" },
  { key: "enviada", label: "Enviada" },
  { key: "aprobada", label: "Aprobada" },
];

type AppUserRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null };

function shortName(u: AppUserRef | undefined | null): string {
  if (!u) return "";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Sin nombre";
}

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [termTemplates, setTermTemplates] = useState<QuoteTermTemplate[]>([]);
  const [admins, setAdmins] = useState<AppUserRef[]>([]);
  const [author, setAuthor] = useState<AppUserRef | null>(null);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [managerNote, setManagerNote] = useState("");
  const [confirmingProject, setConfirmingProject] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const toast = useToast();
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFields = useRef<Partial<Quote>>({});
  const me = getSession();

  const load = useCallback(async () => {
    const [q, i, c, t, a] = await Promise.all([
      supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order"),
      supabase.from("catalog_items").select("*").order("name"),
      supabase.from("quote_term_templates").select("*").order("name"),
      supabase.rpc("hct_list_admins"),
    ]);
    if (q.error) {
      setLoadFailed(true);
      toast.error("No se pudo cargar la cotización", q.error.message);
    } else setQuote(q.data as Quote | null);
    setItems((i.data as QuoteItem[]) ?? []);
    setCatalog((c.data as CatalogItem[]) ?? []);
    setTermTemplates((t.data as QuoteTermTemplate[]) ?? []);
    setAdmins((a.data as AppUserRef[]) ?? []);

    const createdBy = (q.data as Quote | null)?.created_by;
    if (createdBy) {
      const { data: authorData } = await supabase.rpc("hct_user_name", {
        p_user_id: createdBy,
      });
      setAuthor((authorData as AppUserRef) ?? null);
    } else {
      setAuthor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* Guardado automático (debounce) de los campos de la cotización.
     Los cambios se acumulan en pendingFields entre pulsaciones — si el
     usuario edita varios campos seguidos antes de que venza el debounce,
     el guardado persiste TODOS los acumulados, no solo el último tocado. */
  function patchQuote(fields: Partial<Quote>) {
    if (!quote) return;
    const next = { ...quote, ...fields };
    setQuote(next);
    pendingFields.current = { ...pendingFields.current, ...fields };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const toSave = pendingFields.current;
      pendingFields.current = {};
      await supabase
        .from("quotes")
        .update({ ...toSave, updated_at: new Date().toISOString() })
        .eq("id", next.id);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }, 600);
  }

  async function patchItem(itemId: string, fields: Partial<QuoteItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, ...fields } : it))
    );
    await supabase.from("quote_items").update(fields).eq("id", itemId);
  }

  async function addItem(fromCatalog?: CatalogItem) {
    if (!quote) return;
    const { data } = await supabase
      .from("quote_items")
      .insert({
        quote_id: quote.id,
        description: fromCatalog?.name ?? "",
        unit_price: fromCatalog?.unit_price ?? 0,
        qty: 1,
        sort_order: items.length + 1,
      })
      .select()
      .single();
    if (data) setItems([...items, data as QuoteItem]);
  }

  async function removeItem(itemId: string) {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    await supabase.from("quote_items").delete().eq("id", itemId);
  }

  async function saveToCatalog(it: QuoteItem) {
    if (!it.description.trim()) return;
    const { data } = await supabase
      .from("catalog_items")
      .insert({ name: it.description.trim(), unit_price: it.unit_price })
      .select()
      .single();
    if (data) setCatalog([...catalog, data as CatalogItem].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function confirmManager() {
    if (!quote) return;
    setConfirmingProject(true);
    const { data, error } = await supabase.rpc("hct_confirm_quote_manager", {
      p_quote_id: quote.id,
      p_note: managerNote.trim(),
    });
    setConfirmingProject(false);
    if (error) return toast.error("No se pudo confirmar", error.message);
    setQuote({ ...quote, manager_confirmed_at: new Date().toISOString() });
    setCreatedProjectId((data as { id: string }).id);
    toast.success("Proyecto creado", "Ya puedes gestionarlo desde el módulo Proyectos.");
  }

  async function saveTermTemplate() {
    if (!quote || !quote.terms.trim()) return;
    const name = window.prompt("Nombre para esta plantilla de términos:");
    if (!name?.trim()) return;
    const { data } = await supabase
      .from("quote_term_templates")
      .insert({ name: name.trim(), body: quote.terms })
      .select()
      .single();
    if (data) {
      setTermTemplates(
        [...termTemplates, data as QuoteTermTemplate].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      toast.success("Plantilla guardada");
    }
  }

  async function removeQuote() {
    if (!quote) return;
    if (!confirm(`¿Eliminar la cotización ${quoteCode(quote.quote_no)}?`)) return;
    await supabase.from("quotes").delete().eq("id", quote.id);
    router.push("/cotizaciones/gestion");
  }

  async function sendToApproval() {
    if (!quote || !selectedApprover) return;
    await patchQuote({ approver_id: selectedApprover, approval_status: "pendiente" });
    toast.success("Enviada a aprobación");
  }

  async function decideApproval(decision: "aprobada" | "rechazada") {
    if (!quote) return;
    await patchQuote({
      approval_status: decision,
      approval_note: approvalNote.trim(),
      approved_at: new Date().toISOString(),
    });
    setApprovalNote("");
    toast.success(
      decision === "aprobada" ? "Cotización aprobada internamente" : "Cotización rechazada"
    );
  }

  const totals = useMemo(
    () => quoteTotals(items, quote?.tax_rate ?? 0),
    [items, quote?.tax_rate]
  );

  if (!quote) return <Spinner />;

  const st = effectiveStatus(quote);
  const shareUrl = `/cotizaciones?c=${quoteCode(quote.quote_no)}&e=${encodeURIComponent(quote.client_email)}`;
  const isApprover = !!(me && quote.approver_id === me.id);
  const canSendToApproval = st === "borrador" && admins.length > 0 && !quote.approval_status;
  const canSendToClient =
    st === "borrador" && (!quote.approval_status || quote.approval_status === "aprobada" || admins.length === 0);

  const stepIndex = STEPPER.findIndex((s) => s.key === st);
  const effectiveStepIndex = stepIndex === -1 ? 0 : stepIndex; // rechazada/vencida: no avanza más

  return (
    <div>
      {/* Encabezado con gradiente + stepper */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="relative overflow-hidden rounded-2xl border border-crimson/25 bg-gradient-to-br from-carbon via-steel to-carbon p-6 text-snow shadow-[0_8px_32px_rgba(216,17,43,0.15)]"
      >
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/cotizaciones/gestion"
              className="text-xs font-medium text-fog transition-colors hover:text-snow"
            >
              ← Cotizaciones
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-medium text-snow">
                {quoteCode(quote.quote_no)}
              </h1>
              {quote.approval_status && (
                <span
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${APPROVAL_STATUS[quote.approval_status].badge}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${APPROVAL_STATUS[quote.approval_status].dot}`}
                  />
                  {APPROVAL_STATUS[quote.approval_status].label}
                </span>
              )}
              <AnimatePresence>
                {savedFlash && (
                  <motion.span
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-xs font-medium text-esmeralda"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      ✓
                    </motion.span>
                    Guardado
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {author && (
              <p className="mt-1.5 text-xs text-fog">
                Creada por <span className="font-medium text-snow/85">{shortName(author)}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {canSendToClient && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => patchQuote({ status: "enviada" })}
                className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow shadow-[0_4px_16px_rgba(216,17,43,0.35)] transition-colors hover:bg-crimson-bright"
              >
                Marcar como enviada
              </motion.button>
            )}
            {st !== "borrador" && (
              <button
                onClick={() => patchQuote({ status: "borrador", client_note: "", decided_at: null })}
                className="rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-fog transition-colors hover:border-snow/30"
              >
                Volver a borrador
              </button>
            )}
            <button
              onClick={removeQuote}
              className="rounded-lg border border-edge px-3.5 py-2.5 text-xs font-semibold text-fog transition-colors hover:bg-steel"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Stepper visual del ciclo de vida */}
        {st !== "rechazada" && st !== "vencida" && (
          <div className="relative mt-6 flex items-center">
            {STEPPER.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      scale: i === effectiveStepIndex ? 1.15 : 1,
                      backgroundColor:
                        i <= effectiveStepIndex ? "#ff2742" : "rgba(244,244,246,0.15)",
                    }}
                    transition={{ duration: 0.4, ease }}
                    className="h-3 w-3 rounded-full"
                  />
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      i <= effectiveStepIndex ? "text-snow" : "text-ash"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPPER.length - 1 && (
                  <div className="mx-2 h-[2px] flex-1 overflow-hidden rounded-full bg-edge">
                    <motion.div
                      initial={false}
                      animate={{ width: i < effectiveStepIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease }}
                      className="h-full bg-crimson"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {(st === "rechazada" || st === "vencida") && (
          <div className="relative mt-6">
            <span
              className={`flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${QUOTE_STATUS[st].badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${QUOTE_STATUS[st].dot}`} />
              {QUOTE_STATUS[st].label}
            </span>
          </div>
        )}
      </motion.div>

      {/* Respuesta del cliente */}
      {(st === "aprobada" || st === "rechazada") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-lg border px-5 py-4 text-sm text-snow ${
            st === "aprobada"
              ? "border-esmeralda/30 bg-esmeralda/8"
              : "border-crimson/30 bg-crimson/8"
          }`}
        >
          <strong>
            {st === "aprobada" ? "✓ Aprobada por el cliente" : "✕ Rechazada por el cliente"}
          </strong>
          {quote.decided_at &&
            ` · ${new Date(quote.decided_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`}
          {quote.client_note && (
            <p className="mt-1 text-fog">“{quote.client_note}”</p>
          )}
        </motion.div>
      )}

      {/* Conformidad del encargado: dispara la creación del proyecto */}
      {st === "aprobada" && !quote.manager_confirmed_at && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-lg border border-[#6366f1]/25 bg-[#6366f1]/5 px-5 py-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6366f1]">
            El cliente aprobó esta cotización
          </p>
          <p className="mt-1 text-xs text-fog">
            Confirma para convertirla en un proyecto de ejecución en el módulo Proyectos.
          </p>
          <textarea
            className="field-dark mt-3 resize-y"
            rows={2}
            placeholder="Nota opcional…"
            value={managerNote}
            onChange={(e) => setManagerNote(e.target.value)}
          />
          <button
            onClick={confirmManager}
            disabled={confirmingProject}
            className="mt-3 rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {confirmingProject ? "Creando…" : "Confirmar y crear proyecto"}
          </button>
        </motion.div>
      )}
      {(quote.manager_confirmed_at || createdProjectId) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-lg border border-esmeralda/30 bg-esmeralda/8 px-5 py-4 text-sm text-snow"
        >
          <strong>✓ Convertida en proyecto</strong>
          {createdProjectId && (
            <>
              {" · "}
              <Link
                href={`/proyectos/gestion/${createdProjectId}`}
                className="font-medium text-crimson-bright underline underline-offset-2"
              >
                Ver proyecto →
              </Link>
            </>
          )}
        </motion.div>
      )}

      {/* Aprobación interna: enviar a un administrador antes de mandarla al cliente */}
      {canSendToApproval && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-lg border border-gold/25 bg-gold/5 px-5 py-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-soft">
            Aprobación interna (opcional)
          </p>
          <p className="mt-1 text-xs text-fog">
            Envía esta cotización a un administrador para que la revise antes de mandarla al cliente.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Select
              compact
              value={selectedApprover}
              onChange={setSelectedApprover}
              placeholder="Elegir aprobador…"
              options={admins.map((a) => ({
                value: a.id,
                label: shortName(a),
                avatarSeed: shortName(a),
                avatarSrc: a.avatar_url,
              }))}
            />
            <button
              onClick={sendToApproval}
              disabled={!selectedApprover}
              className="rounded-lg bg-gold/90 px-4 py-2 text-xs font-semibold text-void transition-colors hover:bg-gold disabled:opacity-50"
            >
              Enviar a aprobación
            </button>
          </div>
        </motion.div>
      )}

      {/* Decisión del aprobador asignado */}
      {quote.approval_status === "pendiente" && isApprover && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-lg border border-gold/25 bg-gold/5 px-5 py-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-soft">
            Te asignaron esta cotización para revisar
          </p>
          <textarea
            className="field-dark mt-3 resize-y"
            rows={2}
            placeholder="Comentario opcional para quien la armó…"
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => decideApproval("aprobada")}
              className="rounded-lg bg-esmeralda px-4 py-2 text-xs font-semibold text-void transition-colors hover:opacity-90"
            >
              Aprobar internamente
            </button>
            <button
              onClick={() => decideApproval("rechazada")}
              className="rounded-lg border border-crimson/30 px-4 py-2 text-xs font-semibold text-[#ff8195] transition-colors hover:bg-crimson/10"
            >
              Rechazar
            </button>
          </div>
        </motion.div>
      )}

      {/* Resultado de la aprobación interna, visible para todos */}
      {(quote.approval_status === "aprobada" || quote.approval_status === "rechazada") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-lg border px-5 py-4 text-sm text-snow ${
            quote.approval_status === "aprobada"
              ? "border-esmeralda/30 bg-esmeralda/8"
              : "border-crimson/30 bg-crimson/8"
          }`}
        >
          <strong>{APPROVAL_STATUS[quote.approval_status].label}</strong>
          {quote.approved_at &&
            ` · ${new Date(quote.approved_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`}
          {quote.approval_note && (
            <p className="mt-1 text-fog">“{quote.approval_note}”</p>
          )}
        </motion.div>
      )}

      {/* Datos del proyecto */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease }}
        className="mt-6 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
          Datos del proyecto
        </p>
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Título de la propuesta
            </span>
            <input
              className="field-dark"
              value={quote.title}
              onChange={(e) => patchQuote({ title: e.target.value })}
              placeholder="Ej. Desarrollo de plataforma de gestión"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Qué se cotiza (resumen del proyecto)
            </span>
            <textarea
              className="field-dark resize-y"
              rows={3}
              value={quote.project_summary}
              onChange={(e) => patchQuote({ project_summary: e.target.value })}
              placeholder="Describe el alcance general del proyecto que se está cotizando…"
            />
          </label>
        </div>
      </motion.div>

      {/* Datos del cliente */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease }}
        className="mt-5 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
          Datos del cliente
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Cliente / Contacto
            </span>
            <input
              className="field-dark"
              value={quote.client_name}
              onChange={(e) => patchQuote({ client_name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Empresa
            </span>
            <input
              className="field-dark"
              value={quote.client_company}
              onChange={(e) => patchQuote({ client_company: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Correo del cliente
            </span>
            <input
              className="field-dark"
              type="email"
              value={quote.client_email}
              onChange={(e) =>
                patchQuote({ client_email: e.target.value.toLowerCase() })
              }
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Teléfono
            </span>
            <input
              className="field-dark"
              value={quote.client_phone}
              onChange={(e) => patchQuote({ client_phone: e.target.value })}
            />
          </label>
        </div>
      </motion.div>

      {/* Plazo y validez */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease }}
        className="mt-5 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
          Plazo y validez
        </p>
        <p className="mb-4 text-[11px] text-ash">
          El tiempo de desarrollo es cuánto dura el proyecto; la validez es
          hasta cuándo sigue en pie esta oferta.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Tiempo de desarrollo
            </span>
            <input
              className="field-dark"
              value={quote.estimated_duration_text}
              onChange={(e) => patchQuote({ estimated_duration_text: e.target.value })}
              placeholder="Ej. 6 semanas"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Fecha estimada de entrega
            </span>
            <input
              className="field-dark"
              type="date"
              value={quote.estimated_delivery_date ?? ""}
              onChange={(e) =>
                patchQuote({ estimated_delivery_date: e.target.value || null })
              }
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Válida hasta
            </span>
            <input
              className="field-dark"
              type="date"
              value={quote.valid_until ?? ""}
              onChange={(e) => patchQuote({ valid_until: e.target.value || null })}
            />
          </label>
        </div>
      </motion.div>

      {/* Moneda e impuesto */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease }}
        className="mt-5 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Moneda
            </span>
            <input
              className="field-dark"
              value={quote.currency}
              onChange={(e) => patchQuote({ currency: e.target.value.toUpperCase() })}
              placeholder="USD"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ash">
              Impuesto %
            </span>
            <input
              className="field-dark"
              type="number"
              min={0}
              value={quote.tax_rate}
              onChange={(e) => patchQuote({ tax_rate: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      </motion.div>

      {/* Líneas */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease }}
        className="mt-5 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Servicios cotizados
          </p>
          <div className="flex gap-2">
            {catalog.length > 0 && (
              <Select
                compact
                value=""
                onChange={(v) => {
                  const c = catalog.find((x) => x.id === v);
                  if (c) addItem(c);
                }}
                placeholder="+ Desde catálogo…"
                options={catalog.map((c) => ({
                  value: c.id,
                  label: `${c.name} — ${money(c.unit_price, quote.currency)}`,
                }))}
              />
            )}
            <button
              onClick={() => addItem()}
              className="rounded-lg border border-crimson/30 px-3.5 py-2 text-xs font-semibold text-[#ff8195] transition-colors hover:bg-crimson/10"
            >
              + Agregar línea
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                className="grid grid-cols-[1fr_4.5rem_7rem_7rem_auto] items-center gap-2.5 max-sm:grid-cols-2"
              >
                <input
                  className="field-dark !py-2 text-sm max-sm:col-span-2"
                  placeholder="Descripción del servicio…"
                  value={it.description}
                  onChange={(e) => patchItem(it.id, { description: e.target.value })}
                />
                <input
                  className="field-dark !py-2 text-right text-sm"
                  type="number"
                  min={0}
                  value={it.qty}
                  onChange={(e) => patchItem(it.id, { qty: Number(e.target.value) || 0 })}
                  title="Cantidad"
                />
                <input
                  className="field-dark !py-2 text-right text-sm"
                  type="number"
                  min={0}
                  value={it.unit_price}
                  onChange={(e) =>
                    patchItem(it.id, { unit_price: Number(e.target.value) || 0 })
                  }
                  title="Precio unitario"
                />
                <span className="font-display px-1 text-right text-sm font-semibold text-snow">
                  {money(it.qty * it.unit_price, quote.currency)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => saveToCatalog(it)}
                    title="Guardar en catálogo"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fog transition-colors hover:bg-azul/10 hover:text-azul"
                  >
                    ★
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    title="Quitar línea"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-fog transition-colors hover:bg-crimson/10 hover:text-[#ff8195]"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!items.length && (
            <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-fog">
              Agrega la primera línea de servicio.
            </p>
          )}
        </div>

        {/* Totales */}
        <div className="mt-6 flex justify-end border-t border-edge pt-5">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-fog">
              <span>Subtotal</span>
              <span>{money(totals.subtotal, quote.currency)}</span>
            </div>
            <div className="flex justify-between text-fog">
              <span>Impuesto ({quote.tax_rate}%)</span>
              <span>{money(totals.tax, quote.currency)}</span>
            </div>
            <motion.div
              key={totals.total}
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              className="font-display flex justify-between border-t border-edge pt-2 text-lg font-semibold text-crimson-bright"
            >
              <span>Total</span>
              <span>{money(totals.total, quote.currency)}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Políticas y términos */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24, ease }}
        className="mt-5 rounded-lg border border-edge bg-carbon/70 p-6"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Políticas y términos
          </p>
          <div className="flex gap-2">
            {termTemplates.length > 0 && (
              <Select
                compact
                value=""
                onChange={(v) => {
                  const t = termTemplates.find((x) => x.id === v);
                  if (t) patchQuote({ terms: t.body });
                }}
                placeholder="Insertar plantilla…"
                options={termTemplates.map((t) => ({ value: t.id, label: t.name }))}
              />
            )}
            <button
              type="button"
              onClick={saveTermTemplate}
              title="Guardar como plantilla"
              className="rounded-lg border border-azul/30 px-3 py-2 text-xs font-semibold text-azul transition-colors hover:bg-azul/8"
            >
              ★ Guardar como plantilla
            </button>
          </div>
        </div>
        <textarea
          className="field-dark resize-y"
          rows={4}
          placeholder="Condiciones de pago, alcance, exclusiones, garantías…"
          value={quote.terms}
          onChange={(e) => patchQuote({ terms: e.target.value })}
        />
      </motion.div>

      {/* Notas internas + compartir */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease }}
        className="mt-5 grid gap-5 lg:grid-cols-2"
      >
        <div className="rounded-lg border border-edge bg-carbon/70 p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Notas internas
          </p>
          <textarea
            className="field-dark resize-y"
            rows={4}
            placeholder="Comentarios internos que el cliente no ve…"
            value={quote.notes}
            onChange={(e) => patchQuote({ notes: e.target.value })}
          />
        </div>

        <div className="rounded-lg border border-edge bg-carbon/70 p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Compartir con el cliente
          </p>
          <p className="text-xs leading-relaxed text-ash">
            El cliente entra al portal con el código{" "}
            <code className="rounded bg-steel px-1.5 py-0.5 font-semibold text-snow">
              {quoteCode(quote.quote_no)}
            </code>{" "}
            y su correo, o directamente con este enlace:
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              className="field-dark !py-2 text-xs"
              value={typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl}
              onFocus={(e) => e.target.select()}
            />
            <a
              href={shareUrl}
              target="_blank"
              className="shrink-0 rounded-lg border border-azul/30 px-3.5 py-2 text-xs font-semibold text-azul transition-colors hover:bg-azul/8"
            >
              Vista cliente ↗
            </a>
          </div>
          <p className="mt-3 text-[11px] text-ash">
            💡 Marca la cotización como <strong>enviada</strong> para que el
            cliente pueda aprobarla o rechazarla en línea.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
