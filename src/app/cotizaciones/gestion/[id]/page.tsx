"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Quote,
  type QuoteItem,
  type CatalogItem,
  QUOTE_STATUS,
  quoteCode,
  money,
  quoteTotals,
  effectiveStatus,
} from "@/modules/quotes/lib/quotes";

const ease = [0.21, 0.6, 0.35, 1] as const;

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const toast = useToast();
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [q, i, c] = await Promise.all([
      supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order"),
      supabase.from("catalog_items").select("*").order("name"),
    ]);
    if (q.error) {
      setLoadFailed(true);
      toast.error("No se pudo cargar la cotización", q.error.message);
    } else setQuote(q.data as Quote | null);
    setItems((i.data as QuoteItem[]) ?? []);
    setCatalog((c.data as CatalogItem[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* Guardado automático (debounce) de los campos de la cotización */
  function patchQuote(fields: Partial<Quote>) {
    if (!quote) return;
    const next = { ...quote, ...fields };
    setQuote(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase
        .from("quotes")
        .update({ ...fields, updated_at: new Date().toISOString() })
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

  async function removeQuote() {
    if (!quote) return;
    if (!confirm(`¿Eliminar la cotización ${quoteCode(quote.quote_no)}?`)) return;
    await supabase.from("quotes").delete().eq("id", quote.id);
    router.push("/cotizaciones/gestion");
  }

  const totals = useMemo(
    () => quoteTotals(items, quote?.tax_rate ?? 0),
    [items, quote?.tax_rate]
  );

  if (!quote)
    return (
      <p className="text-sm text-ink-faint">
        {loadFailed ? "No se pudo cargar la cotización." : "Cargando…"}
      </p>
    );

  const st = effectiveStatus(quote);
  const shareUrl = `/cotizaciones?c=${quoteCode(quote.quote_no)}&e=${encodeURIComponent(quote.client_email)}`;

  return (
    <div>
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <Link
            href="/cotizaciones/gestion"
            className="text-xs font-medium text-ink-faint transition-colors hover:text-burgundy"
          >
            ← Cotizaciones
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-display text-2xl font-medium text-ink">
              {quoteCode(quote.quote_no)}
            </h1>
            <span
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${QUOTE_STATUS[st].badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${QUOTE_STATUS[st].dot}`} />
              {QUOTE_STATUS[st].label}
            </span>
            <AnimatePresence>
              {savedFlash && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-esmeralda"
                >
                  ✓ Guardado
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex gap-2">
          {st === "borrador" && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => patchQuote({ status: "enviada" })}
              className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory shadow-[0_4px_16px_rgba(138,22,38,0.3)] transition-colors hover:bg-burgundy-bright"
            >
              Marcar como enviada
            </motion.button>
          )}
          {st !== "borrador" && (
            <button
              onClick={() => patchQuote({ status: "borrador", client_note: "", decided_at: null })}
              className="rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/35"
            >
              Volver a borrador
            </button>
          )}
          <button
            onClick={removeQuote}
            className="rounded-lg border border-burgundy/25 px-3.5 py-2.5 text-xs font-semibold text-burgundy transition-colors hover:bg-burgundy/8"
          >
            Eliminar
          </button>
        </div>
      </motion.div>

      {/* Respuesta del cliente */}
      {(st === "aprobada" || st === "rechazada") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-lg border px-5 py-4 text-sm ${
            st === "aprobada"
              ? "border-esmeralda/30 bg-esmeralda/8 text-ink"
              : "border-burgundy/30 bg-burgundy/8 text-ink"
          }`}
        >
          <strong>
            {st === "aprobada" ? "✓ Aprobada por el cliente" : "✕ Rechazada por el cliente"}
          </strong>
          {quote.decided_at &&
            ` · ${new Date(quote.decided_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`}
          {quote.client_note && (
            <p className="mt-1 text-ink-soft">“{quote.client_note}”</p>
          )}
        </motion.div>
      )}

      {/* Datos generales */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease }}
        className="mt-6 rounded-lg border border-ink/8 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Título de la propuesta
            </span>
            <input
              className="field"
              value={quote.title}
              onChange={(e) => patchQuote({ title: e.target.value })}
              placeholder="Ej. Desarrollo de plataforma de gestión"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Cliente / Empresa
            </span>
            <input
              className="field"
              value={quote.client_name}
              onChange={(e) => patchQuote({ client_name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Correo del cliente
            </span>
            <input
              className="field"
              type="email"
              value={quote.client_email}
              onChange={(e) =>
                patchQuote({ client_email: e.target.value.toLowerCase() })
              }
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Válida hasta
            </span>
            <input
              className="field"
              type="date"
              value={quote.valid_until ?? ""}
              onChange={(e) => patchQuote({ valid_until: e.target.value || null })}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Moneda
              </span>
              <input
                className="field"
                value={quote.currency}
                onChange={(e) => patchQuote({ currency: e.target.value.toUpperCase() })}
                placeholder="USD"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
                Impuesto %
              </span>
              <input
                className="field"
                type="number"
                min={0}
                value={quote.tax_rate}
                onChange={(e) => patchQuote({ tax_rate: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </div>
      </motion.div>

      {/* Líneas */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16, ease }}
        className="mt-5 rounded-lg border border-ink/8 bg-white p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Servicios cotizados
          </p>
          <div className="flex gap-2">
            {catalog.length > 0 && (
              <select
                className="field !w-auto !py-2 text-xs"
                value=""
                onChange={(e) => {
                  const c = catalog.find((x) => x.id === e.target.value);
                  if (c) addItem(c);
                }}
              >
                <option value="">+ Desde catálogo…</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {money(c.unit_price, quote.currency)}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => addItem()}
              className="rounded-lg border border-burgundy/30 px-3.5 py-2 text-xs font-semibold text-burgundy transition-colors hover:bg-burgundy/8"
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
                  className="field !py-2 text-sm max-sm:col-span-2"
                  placeholder="Descripción del servicio…"
                  value={it.description}
                  onChange={(e) => patchItem(it.id, { description: e.target.value })}
                />
                <input
                  className="field !py-2 text-right text-sm"
                  type="number"
                  min={0}
                  value={it.qty}
                  onChange={(e) => patchItem(it.id, { qty: Number(e.target.value) || 0 })}
                  title="Cantidad"
                />
                <input
                  className="field !py-2 text-right text-sm"
                  type="number"
                  min={0}
                  value={it.unit_price}
                  onChange={(e) =>
                    patchItem(it.id, { unit_price: Number(e.target.value) || 0 })
                  }
                  title="Precio unitario"
                />
                <span className="font-display px-1 text-right text-sm font-semibold text-ink">
                  {money(it.qty * it.unit_price, quote.currency)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => saveToCatalog(it)}
                    title="Guardar en catálogo"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-azul/10 hover:text-azul"
                  >
                    ★
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    title="Quitar línea"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-burgundy/10 hover:text-burgundy"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!items.length && (
            <p className="rounded-lg border border-dashed border-ink/15 px-4 py-6 text-center text-xs text-ink-faint">
              Agrega la primera línea de servicio.
            </p>
          )}
        </div>

        {/* Totales */}
        <div className="mt-6 flex justify-end border-t border-ink/8 pt-5">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{money(totals.subtotal, quote.currency)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Impuesto ({quote.tax_rate}%)</span>
              <span>{money(totals.tax, quote.currency)}</span>
            </div>
            <motion.div
              key={totals.total}
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              className="font-display flex justify-between border-t border-ink/10 pt-2 text-lg font-semibold text-burgundy"
            >
              <span>Total</span>
              <span>{money(totals.total, quote.currency)}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Notas + compartir */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24, ease }}
        className="mt-5 grid gap-5 lg:grid-cols-2"
      >
        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Notas / condiciones
          </p>
          <textarea
            className="field resize-y"
            rows={4}
            placeholder="Condiciones de pago, alcance, exclusiones…"
            value={quote.notes}
            onChange={(e) => patchQuote({ notes: e.target.value })}
          />
        </div>

        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Compartir con el cliente
          </p>
          <p className="text-xs leading-relaxed text-ink-faint">
            El cliente entra al portal con el código{" "}
            <code className="rounded bg-ink/8 px-1.5 py-0.5 font-semibold text-ink">
              {quoteCode(quote.quote_no)}
            </code>{" "}
            y su correo, o directamente con este enlace:
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              className="field !py-2 text-xs"
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
          <p className="mt-3 text-[11px] text-ink-faint">
            💡 Marca la cotización como <strong>enviada</strong> para que el
            cliente pueda aprobarla o rechazarla en línea.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
