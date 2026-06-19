"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Product,
  type ProductCategory,
  type SaleOrderItem,
  type CategorySlug,
  money,
  stockLabel,
  orderCode,
  CATEGORY_LABELS,
} from "../lib/ventas";

const ease = [0.21, 0.6, 0.35, 1] as const;

const HERO_PHRASES = [
  { prefix: "Todo para",        highlight: "tu empresa."    },
  { prefix: "Lo que necesitas,", highlight: "aquí."         },
  { prefix: "Equipa",           highlight: "tu negocio."    },
  { prefix: "Entregamos",       highlight: "pedidos."       },
  { prefix: "Productos que",    highlight: "impulsan."      },
  { prefix: "Somos",            highlight: "calidad."       },
];

function RotatingHeroTitle() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_PHRASES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const phrase = HERO_PHRASES[idx];

  return (
    <div className="font-display text-4xl font-extrabold uppercase tracking-tight text-snow sm:text-6xl">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
          exit={{    opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease }}
          className="block"
        >
          {phrase.prefix}{" "}
          <span className="text-shimmer">{phrase.highlight}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ── Tarjeta de producto ── */
function ProductCard({
  product,
  onPedir,
}: {
  product: Product;
  onPedir: (p: Product) => void;
}) {
  const sl = stockLabel(product);
  const stockBadge = {
    disponible: { label: "Disponible",     cls: "bg-esmeralda/10 text-esmeralda" },
    pocas:      { label: "Pocas unidades", cls: "bg-gold/15 text-gold" },
    agotado:    { label: "Agotado",        cls: "bg-crimson/10 text-crimson-bright" },
  }[sl];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-carbon/70 backdrop-blur-sm transition-all hover:border-snow/15 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
    >
      {/* Imagen */}
      <div className="relative h-44 w-full overflow-hidden bg-steel">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-30">
              {product.currency === "PEN" ? "📦" : "🖥️"}
            </span>
          </div>
        )}
        {/* Badge stock */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${stockBadge.cls}`}
          style={{ backdropFilter: "blur(8px)", background: "rgba(5,5,7,0.7)" }}
        >
          {stockBadge.label}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1">
          <p className="font-display text-base font-semibold leading-snug text-snow">
            {product.name}
          </p>
          {product.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fog">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xl font-bold text-crimson-bright">
            {money(product.price, product.currency)}
          </p>
          {product.sku && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-ash">
              {product.sku}
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onPedir(product)}
          disabled={sl === "agotado"}
          className="relative w-full overflow-hidden rounded-xl bg-crimson py-2.5 text-sm font-bold uppercase tracking-wider text-snow shadow-[0_4px_20px_rgba(216,17,43,0.35)] transition-all hover:bg-crimson-bright hover:shadow-[0_6px_28px_rgba(216,17,43,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">
            {sl === "agotado" ? "Sin stock" : "Pedir →"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Modal de orden ── */
function OrdenModal({
  product,
  onClose,
  onSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess: (code: string) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", qty: 1, notes: "",
  });
  const [saving, setSaving] = useState(false);

  const total = product.price * form.qty;

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Faltan datos", "Ingresa tu nombre y correo.");
      return;
    }
    if (form.qty < 1 || form.qty > product.stock) {
      toast.warning("Cantidad inválida", `Máximo disponible: ${product.stock}`);
      return;
    }
    setSaving(true);
    const { data: order, error } = await supabase
      .from("sale_orders")
      .insert({
        client_name: form.name.trim(),
        client_email: form.email.trim().toLowerCase(),
        client_phone: form.phone.trim(),
        notes: form.notes.trim(),
        total,
        status: "nueva",
      })
      .select()
      .single();

    if (error || !order) {
      setSaving(false);
      toast.error("No se pudo enviar", error?.message ?? "Error desconocido");
      return;
    }

    await supabase.from("sale_order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      qty: form.qty,
    } satisfies Omit<SaleOrderItem, "id">);

    setSaving(false);
    onSuccess(orderCode(order.order_no));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(5,5,7,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-carbon"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(216,17,43,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <div>
            <p className="font-display text-base font-bold text-snow">Solicitar producto</p>
            <p className="mt-0.5 text-xs text-fog">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ash transition-colors hover:bg-white/8 hover:text-snow"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fog">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-edge bg-steel/60 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-ash transition-colors focus:border-crimson/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fog">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Opcional"
                className="w-full rounded-xl border border-edge bg-steel/60 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-ash transition-colors focus:border-crimson/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fog">Correo *</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-edge bg-steel/60 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-ash transition-colors focus:border-crimson/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fog">
              Cantidad <span className="text-ash">(máx. {product.stock})</span>
            </label>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full rounded-xl border border-edge bg-steel/60 px-4 py-2.5 text-sm text-snow outline-none transition-colors focus:border-crimson/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fog">Notas adicionales</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Modelo preferido, color, dirección de entrega…"
              className="w-full resize-none rounded-xl border border-edge bg-steel/60 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-ash transition-colors focus:border-crimson/50"
            />
          </div>

          {/* Resumen */}
          <div className="flex items-center justify-between rounded-xl border border-edge bg-steel/40 px-4 py-3">
            <span className="text-xs text-fog">Total estimado</span>
            <span className="font-display text-lg font-bold text-crimson-bright">
              {money(total, product.currency)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-edge px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-edge py-2.5 text-sm font-semibold text-fog transition-colors hover:border-snow/20 hover:text-snow"
          >
            Cancelar
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl bg-crimson py-2.5 text-sm font-bold text-snow shadow-[0_4px_16px_rgba(216,17,43,0.4)] transition-colors hover:bg-crimson-bright disabled:opacity-60"
          >
            {saving ? "Enviando…" : "Enviar solicitud →"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Popover tab "Personalizados" — solo frase gancho ── */
function PersonalizadosPopover({
  anchorRef,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function update() {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  if (!rect) return null;

  const top  = rect.bottom + 10;
  const left = Math.min(rect.left, window.innerWidth - 280);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.21, 0.6, 0.35, 1] }}
      onClick={(e) => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 9999 }}
      className="w-64 rounded-xl border border-gold/40 bg-void px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Flecha */}
      <div
        className="absolute -top-[6px] h-2.5 w-2.5 rotate-45 border-l border-t border-gold/40 bg-void"
        style={{ left: Math.max(0, rect.left - left) + 20 }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold leading-snug text-snow">
          ✨ Tu marca en cualquier objeto — <span className="text-gold">hacemos click aquí</span>
        </p>
        <button onClick={onClose} className="shrink-0 text-ash hover:text-snow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </motion.div>,
    document.body
  );
}

/* ── Sección inline al activar categoría personalizados ── */
const CUSTOM_SERVICES = [
  {
    emoji: "🎨",
    title: "Sublimación",
    items: ["Tazas y termos", "Camisetas y polos", "Gorras", "Almohadas y cojines", "Platos y azulejos"],
    desc: "Imprimimos cualquier diseño a todo color. Ideal para regalos corporativos y merchandising.",
  },
  {
    emoji: "🧵",
    title: "Bordado",
    items: ["Uniformes de trabajo", "Polos y camisas", "Gorras y gorros", "Mochilas y bolsos"],
    desc: "Logo o texto bordado con hilo resistente. Acabado profesional que no se despega ni decolora.",
  },
  {
    emoji: "✏️",
    title: "Diseño incluido",
    items: ["Vectorización de logo", "Diseño desde cero", "Arte para sublimación", "Digitalización para bordado"],
    desc: "¿No tienes el arte listo? Nuestro equipo lo prepara sin costo adicional.",
  },
];

function PersonalizadosSection() {
  return (
    <motion.div
      key="personalizados-section"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
      className="mb-12"
    >
      {/* Banner superior */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-carbon via-void to-carbon px-6 py-8 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-5%] top-[-30%] h-64 w-64 rounded-full bg-gold/8 blur-[80px]" />
          <div className="absolute bottom-[-20%] left-[-5%] h-48 w-48 rounded-full bg-crimson/8 blur-[70px]" />
        </div>
        <p className="font-mono relative mb-2 text-[10px] uppercase tracking-[0.28em] text-gold">✨ Servicio especial</p>
        <h2 className="font-display relative text-2xl font-extrabold uppercase tracking-tight text-snow sm:text-3xl">
          Tu marca en cualquier objeto
        </h2>
        <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-fog">
          Contamos con máquinas propias de sublimación y bordado. Personalizamos productos con el logo, colores y diseño de tu empresa — desde una pieza hasta pedidos en volumen.
        </p>
      </div>

      {/* Cards de servicios */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CUSTOM_SERVICES.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.45, ease: [0.21, 0.6, 0.35, 1] }}
            className="rounded-2xl border border-edge bg-carbon/60 p-5"
          >
            <span className="mb-3 inline-block text-3xl">{s.emoji}</span>
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-snow">{s.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-fog">{s.desc}</p>
            <ul className="mt-3 space-y-1">
              {s.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-[11px] text-ash">
                  <span className="h-1 w-1 rounded-full bg-gold/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* CTA inferior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-6 rounded-2xl border border-edge bg-steel/20 px-6 py-5 text-center"
      >
        <p className="font-display text-base font-semibold text-snow">¿Listo para personalizar?</p>
        <p className="mt-1 text-xs text-fog">
          Explora el catálogo de abajo, elige el producto y solicita tu orden — te contactamos para coordinar el diseño y la cantidad.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Vista principal del catálogo ── */
export function CatalogoView() {
  const toast = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategorySlug>("tecnologia");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const specialTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowCustomPopover(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function load() {
      const [cats, prods] = await Promise.all([
        supabase.from("product_categories").select("*").order("sort_order"),
        supabase.from("products_ventas").select("*").eq("published", true).order("sort_order"),
      ]);
      if (cats.data) setCategories(cats.data as ProductCategory[]);
      if (prods.data) setProducts(prods.data as Product[]);
      if (cats.error || prods.error) {
        toast.error("No se pudo cargar el catálogo", "Intenta de nuevo más tarde.");
      }
      setLoading(false);
    }
    load();
  }, []);

  const activeCat = categories.find((c) => c.slug === activeTab);

  const visible = useMemo(() => {
    let list = products.filter((p) => {
      const cat = categories.find((c) => c.id === p.category_id);
      return cat?.slug === activeTab;
    });
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((p) => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    return list;
  }, [products, categories, activeTab, search]);

  function handleSuccess(code: string) {
    setSelectedProduct(null);
    setSuccessCode(code);
    toast.success("¡Solicitud enviada! 🎉", `Tu orden ${code} fue recibida. El equipo te contactará pronto.`);
  }

  return (
    <div className="min-h-screen bg-void">
      {/* Hero de la tienda */}
      <div className="relative overflow-hidden border-b border-edge pb-16 pt-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-10%] top-[-20%] h-[32rem] w-[32rem] rounded-full bg-crimson/10 blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[-5%] h-[24rem] w-[24rem] rounded-full bg-blood/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-crimson-bright"
          >
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-crimson" />
            Herrera C&T · Tienda
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease }}
          >
            <RotatingHeroTitle />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease }}
            className="mt-4 max-w-lg text-base text-fog"
          >
            Todo lo que tu empresa necesita, en un solo lugar. Solicita y el equipo te confirma disponibilidad.
          </motion.p>

          {/* Búsqueda */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease }}
            className="relative mt-8 max-w-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos…"
              className="w-full rounded-xl border border-edge bg-steel/50 py-3 pl-11 pr-4 text-sm text-snow outline-none placeholder:text-ash backdrop-blur-sm transition-colors focus:border-crimson/40"
            />
          </motion.div>
        </div>
      </div>

      {/* Tabs de categoría */}
      <div className="sticky top-0 z-20 border-b border-edge bg-void/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-3 lg:px-8">
          {(categories.length ? categories : [
            { id: "t", slug: "tecnologia"    as CategorySlug, name: "Tecnología",            icon: "chip",   sort_order: 1 },
            { id: "l", slug: "libreria"      as CategorySlug, name: "Librería",              icon: "wrench", sort_order: 2 },
            { id: "p", slug: "personalizados" as CategorySlug, name: "Objetos Personalizados", icon: "star",  sort_order: 3 },
          ]).map((cat) => {
            const info = CATEGORY_LABELS[cat.slug as CategorySlug];
            const active = activeTab === cat.slug;
            const isSpecial = info?.special;
            const btn = (
              <button
                ref={isSpecial ? specialTabRef : undefined}
                onClick={() => {
                  setActiveTab(cat.slug as CategorySlug);
                  if (isSpecial) setShowCustomPopover((v) => !v);
                }}
                className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "text-snow" : "text-fog hover:text-snow"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cat-pill"
                    transition={{ duration: 0.3, ease }}
                    className={`absolute inset-0 rounded-xl border ${
                      isSpecial
                        ? "bg-gradient-to-r from-crimson/30 via-gold/20 to-esmeralda/20 border-gold/40"
                        : "bg-steel/80 border-edge"
                    }`}
                  />
                )}
                <span className={`relative ${isSpecial && !active ? "bg-gradient-to-r from-crimson via-gold to-esmeralda bg-clip-text text-transparent" : ""}`}>
                  {info?.emoji ?? "📦"} {info?.label ?? cat.name}
                </span>
              </button>
            );

            if (!isSpecial) return <div key={cat.slug}>{btn}</div>;

            return (
              <div key={cat.slug} className="relative">
                {btn}
                <AnimatePresence>
                  {showCustomPopover && (
                    <PersonalizadosPopover anchorRef={specialTabRef} onClose={() => setShowCustomPopover(false)} />
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <span className="ml-auto font-mono text-xs text-ash">
            {visible.length} producto{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Grid de productos */}
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <AnimatePresence>
          {activeTab === "personalizados" && <PersonalizadosSection />}
        </AnimatePresence>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-carbon/70" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="text-5xl">
              {CATEGORY_LABELS[activeTab]?.emoji ?? "📦"}
            </p>
            <p className="mt-4 font-display text-xl font-semibold text-snow">
              {search ? "Sin resultados" : "Próximamente"}
            </p>
            <p className="mt-2 text-sm text-fog">
              {search
                ? `No hay productos que coincidan con "${search}".`
                : "Estamos preparando el catálogo. Vuelve pronto."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} onPedir={setSelectedProduct} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Modal de orden */}
      <AnimatePresence>
        {selectedProduct && (
          <OrdenModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>

      {/* Banner de éxito */}
      <AnimatePresence>
        {successCode && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className="flex items-center gap-4 rounded-2xl border border-esmeralda/30 bg-carbon/95 px-6 py-4 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            >
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-snow">Solicitud enviada</p>
                <p className="text-xs text-fog">
                  Orden <span className="font-mono text-esmeralda">{successCode}</span> — te contactamos pronto.
                </p>
              </div>
              <button
                onClick={() => setSuccessCode(null)}
                className="ml-2 text-ash hover:text-snow"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
