"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import {
  type Product,
  type ProductCategory,
  type SaleOrder,
  type SaleOrderItem,
  type OrderStatus,
  type CategorySlug,
  money,
  orderCode,
  stockLabel,
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  CURRENCIES,
  CATEGORY_LABELS,
} from "../lib/ventas";

const ease = [0.21, 0.6, 0.35, 1] as const;

/* ════════════════════════════════════════
   PANEL LATERAL — Formulario de producto
   ════════════════════════════════════════ */
function ProductoPanel({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Partial<Product> | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !product?.id;

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? (categories[0]?.id ?? ""),
    price: product?.price ?? 0,
    currency: product?.currency ?? "PEN",
    stock: product?.stock ?? 0,
    stock_min: product?.stock_min ?? 5,
    sku: product?.sku ?? "",
    image_url: product?.image_url ?? "",
    published: product?.published ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("ventas-products")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Error al subir imagen", error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("ventas-products").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  }

  async function save() {
    if (!form.name.trim()) return toast.warning("Falta el nombre", "Ingresa un nombre para el producto.");
    if (!form.category_id) return toast.warning("Falta la categoría");
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      stock_min: Number(form.stock_min),
      updated_at: new Date().toISOString(),
    };
    const { error } = isNew
      ? await supabase.from("products_ventas").insert(payload)
      : await supabase.from("products_ventas").update(payload).eq("id", product!.id!);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar", error.message);
    toast.success(isNew ? "Producto creado ✓" : "Producto actualizado ✓");
    onSaved();
    onClose();
  }

  const fieldCls = "w-full rounded-lg border border-ink/12 bg-ivory px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-burgundy/50";
  const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(30,33,37,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-[−16px_0_48px_rgba(30,33,37,0.12)]"
      >
        {/* Header panel */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/8 bg-white px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isNew ? "Nuevo producto" : "Editar producto"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-6">
          {/* Imagen */}
          <div>
            <label className={labelCls}>Imagen del producto</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink/15 bg-cream/50 transition-colors hover:border-burgundy/40"
            >
              {form.image_url ? (
                <Image src={form.image_url} alt="" fill className="object-cover" />
              ) : (
                <div className="text-center">
                  <p className="text-3xl">📷</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {uploading ? "Subiendo…" : "Clic para subir imagen"}
                  </p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-burgundy border-t-transparent" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          {/* Nombre */}
          <div>
            <label className={labelCls}>Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Laptop Dell Inspiron 15" className={fieldCls} />
          </div>

          {/* Descripción */}
          <div>
            <label className={labelCls}>Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Especificaciones o detalles del producto…" className={`${fieldCls} resize-none`} />
          </div>

          {/* Categoría */}
          <div>
            <label className={labelCls}>Categoría *</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={fieldCls}>
              {categories.map((c) => {
                const info = CATEGORY_LABELS[c.slug as CategorySlug];
                return <option key={c.id} value={c.id}>{info?.emoji} {info?.label ?? c.name}</option>;
              })}
            </select>
          </div>

          {/* Precio y moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Precio *</label>
              <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={fieldCls}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stock actual</label>
              <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Alerta mínimo</label>
              <input type="number" min={0} value={form.stock_min} onChange={(e) => setForm({ ...form, stock_min: parseInt(e.target.value) || 0 })} className={fieldCls} />
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className={labelCls}>SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ej. TECH-001" className={`${fieldCls} font-mono`} />
          </div>

          {/* Publicado */}
          <div className="flex items-center justify-between rounded-lg border border-ink/8 bg-cream/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Publicado</p>
              <p className="text-xs text-ink-faint">Visible en el catálogo público</p>
            </div>
            <button
              onClick={() => setForm({ ...form, published: !form.published })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.published ? "bg-esmeralda" : "bg-ink/20"}`}
            >
              <motion.span
                animate={{ x: form.published ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-ink/8 bg-white px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-ink/12 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink/25 hover:text-ink">
            Cancelar
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-lg bg-burgundy py-2.5 text-sm font-semibold text-ivory shadow-[0_4px_16px_rgba(138,22,38,0.3)] transition-colors hover:bg-burgundy-bright disabled:opacity-60"
          >
            {saving ? "Guardando…" : isNew ? "Crear producto" : "Guardar cambios"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   PANEL LATERAL — Detalle de orden
   ════════════════════════════════════════ */
function OrdenPanel({
  order,
  items,
  onClose,
  onUpdated,
}: {
  order: SaleOrder;
  items: SaleOrderItem[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const toast = useToast();
  const [updating, setUpdating] = useState(false);
  const st = ORDER_STATUS[order.status];
  const orderItems = items.filter((i) => i.order_id === order.id);

  async function changeStatus(next: OrderStatus) {
    setUpdating(true);
    const { error } = await supabase
      .from("sale_orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setUpdating(false);
    if (error) return toast.error("No se pudo actualizar", error.message);
    toast.success(`Orden ${ORDER_STATUS[next].label.toLowerCase()}`);
    onUpdated();
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(30,33,37,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/8 bg-white px-6 py-4">
          <div>
            <p className="font-mono text-xs text-ink-faint">{orderCode(order.order_no)}</p>
            <h2 className="font-display text-lg font-semibold text-ink">{order.client_name}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-ink/5 hover:text-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Estado actual */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Estado</p>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${st.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>

          {/* Cliente */}
          <div className="rounded-xl border border-ink/8 bg-cream/50 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Datos del cliente</p>
            <p className="text-sm font-semibold text-ink">{order.client_name}</p>
            <p className="text-sm text-ink-soft">{order.client_email}</p>
            {order.client_phone && <p className="text-sm text-ink-soft">{order.client_phone}</p>}
            {order.notes && (
              <div className="mt-3 border-t border-ink/8 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Notas</p>
                <p className="mt-1 text-sm text-ink-soft">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Productos */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Productos solicitados</p>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-ink/8 bg-white p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.product_name}</p>
                    <p className="text-xs text-ink-faint">Cant. {item.qty} × {money(item.unit_price)}</p>
                  </div>
                  <p className="font-display text-sm font-semibold text-ink">{money(item.unit_price * item.qty)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between rounded-lg bg-cream px-4 py-3">
              <span className="text-sm font-semibold text-ink">Total</span>
              <span className="font-display text-base font-bold text-burgundy">{money(order.total)}</span>
            </div>
          </div>

          {/* Fecha */}
          <p className="text-xs text-ink-faint">
            Recibida el{" "}
            {new Date(order.created_at).toLocaleDateString("es", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>

          {/* Cambios de estado */}
          {order.status !== "entregada" && order.status !== "cancelada" && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Avanzar estado</p>
              <div className="flex flex-wrap gap-2">
                {st.next && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => changeStatus(st.next!)}
                    disabled={updating}
                    className="rounded-lg bg-burgundy px-4 py-2 text-sm font-semibold text-ivory shadow-[0_2px_12px_rgba(138,22,38,0.25)] hover:bg-burgundy-bright disabled:opacity-60"
                  >
                    {updating ? "…" : `Marcar como ${ORDER_STATUS[st.next].label} →`}
                  </motion.button>
                )}
                <button
                  onClick={() => changeStatus("cancelada")}
                  disabled={updating}
                  className="rounded-lg border border-burgundy/30 px-4 py-2 text-sm font-semibold text-burgundy hover:bg-burgundy/5 disabled:opacity-60"
                >
                  Cancelar orden
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   VISTA PRINCIPAL DEL GESTOR
   ════════════════════════════════════════ */
type Tab = "productos" | "ordenes";
type ProdFilter = "todos" | "tecnologia" | "libreria" | "personalizados" | "ocultos";
type OrdFilter  = "todas" | OrderStatus;

export function GestorVentas() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("productos");

  // Datos
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [orders, setOrders]         = useState<SaleOrder[]>([]);
  const [orderItems, setOrderItems] = useState<SaleOrderItem[]>([]);
  const [loading, setLoading]       = useState(true);

  // UI
  const [prodFilter, setProdFilter] = useState<ProdFilter>("todos");
  const [ordFilter,  setOrdFilter]  = useState<OrdFilter>("todas");
  const [search,     setSearch]     = useState("");
  const [editProduct, setEditProduct]   = useState<Partial<Product> | null | "new">(null);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);

  async function load() {
    setLoading(true);
    const [cats, prods, ords, ois] = await Promise.all([
      supabase.from("product_categories").select("*").order("sort_order"),
      supabase.from("products_ventas").select("*").order("sort_order"),
      supabase.from("sale_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("sale_order_items").select("*"),
    ]);
    if (cats.data)  setCategories(cats.data as ProductCategory[]);
    if (prods.data) setProducts(prods.data as Product[]);
    if (ords.data)  setOrders(ords.data as SaleOrder[]);
    if (ois.data)   setOrderItems(ois.data as SaleOrderItem[]);
    if (cats.error) toast.error("Error al cargar categorías", cats.error.message);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteProduct(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("products_ventas").delete().eq("id", id);
    if (error) return toast.error("No se pudo eliminar", error.message);
    toast.success("Producto eliminado");
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  // Productos filtrados
  const visibleProducts = useMemo(() => {
    let list = products;
    if (prodFilter === "tecnologia" || prodFilter === "libreria" || prodFilter === "personalizados") {
      const cat = categories.find((c) => c.slug === prodFilter);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    } else if (prodFilter === "ocultos") {
      list = list.filter((p) => !p.published);
    }
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    return list;
  }, [products, categories, prodFilter, search]);

  // Órdenes filtradas
  const visibleOrders = useMemo(() => {
    let list = orders;
    if (ordFilter !== "todas") list = list.filter((o) => o.status === ordFilter);
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((o) =>
      o.client_name.toLowerCase().includes(s) ||
      o.client_email.toLowerCase().includes(s) ||
      orderCode(o.order_no).toLowerCase().includes(s)
    );
    return list;
  }, [orders, ordFilter, search]);

  // Stats rápidas
  const stats = useMemo(() => ({
    total: products.length,
    publicados: products.filter((p) => p.published).length,
    sinStock: products.filter((p) => p.stock === 0).length,
    nuevasOrdenes: orders.filter((o) => o.status === "nueva").length,
  }), [products, orders]);

  function catNameOf(categoryId: string) {
    const c = categories.find((x) => x.id === categoryId);
    if (!c) return "—";
    const info = CATEGORY_LABELS[c.slug as CategorySlug];
    return info ? `${info.emoji} ${info.label}` : c.name;
  }

  const tabCls = (t: Tab) =>
    `relative px-5 py-2.5 text-sm font-semibold transition-colors ${tab === t ? "text-ink" : "text-ink-faint hover:text-ink"}`;
  const filterPillCls = (active: boolean) =>
    `relative rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${active ? "text-ivory" : "text-ink-soft hover:bg-ink/5 hover:text-ink"}`;

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
          <h1 className="font-display text-3xl font-medium text-ink">Ventas</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Catálogo de productos y órdenes de clientes.
          </p>
        </div>
        {tab === "productos" && (
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setEditProduct("new")}
            className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-ivory shadow-[0_4px_16px_rgba(138,22,38,0.3)] transition-colors hover:bg-burgundy-bright"
          >
            + Nuevo producto
          </motion.button>
        )}
      </motion.div>

      {/* Stats rápidas */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
        className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {[
          { label: "Productos", value: stats.total, accent: "text-ink" },
          { label: "Publicados", value: stats.publicados, accent: "text-esmeralda" },
          { label: "Sin stock", value: stats.sinStock, accent: stats.sinStock > 0 ? "text-burgundy" : "text-ink-soft" },
          { label: "Órdenes nuevas", value: stats.nuevasOrdenes, accent: stats.nuevasOrdenes > 0 ? "text-azul" : "text-ink-soft" },
        ].map((c) => (
          <motion.div
            key={c.label}
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
            className="rounded-lg border border-ink/8 bg-white p-5 shadow-[0_2px_12px_rgba(30,33,37,0.04)]"
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

      {/* Tabs */}
      <div className="mt-8 flex items-center gap-1 border-b border-ink/8">
        {(["productos", "ordenes"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }} className={tabCls(t)}>
            {tab === t && (
              <motion.span
                layoutId="vtab"
                transition={{ duration: 0.3, ease }}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-burgundy"
              />
            )}
            <span className="relative capitalize">
              {t === "productos" ? "Productos" : "Órdenes"}
              {t === "ordenes" && stats.nuevasOrdenes > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-azul px-1 text-[9px] font-bold text-white">
                  {stats.nuevasOrdenes}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros + Búsqueda */}
      <div className="mt-5 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {tab === "productos" ? (
          <>
            {(["todos", "tecnologia", "libreria", "personalizados", "ocultos"] as ProdFilter[]).map((f) => {
              const label = f === "todos" ? "Todos" : f === "ocultos" ? "Ocultos" : (CATEGORY_LABELS[f as CategorySlug]?.label ?? f);
              return (
                <button key={f} onClick={() => setProdFilter(f)} className={filterPillCls(prodFilter === f)}>
                  {prodFilter === f && (
                    <motion.span layoutId="pfilter" transition={{ duration: 0.28, ease }} className="absolute inset-0 rounded-lg bg-burgundy" />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            {([{ key: "todas", label: "Todas" }].concat(ORDER_STATUS_ORDER.map((s) => ({ key: s, label: ORDER_STATUS[s].label })))).map((f) => (
              <button key={f.key} onClick={() => setOrdFilter(f.key as OrdFilter)} className={filterPillCls(ordFilter === f.key)}>
                {ordFilter === f.key && (
                  <motion.span layoutId="ofilter" transition={{ duration: 0.28, ease }} className="absolute inset-0 rounded-lg bg-burgundy" />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "productos" ? "Buscar por nombre o SKU…" : "Buscar por cliente o código…"}
          className="ml-auto max-w-xs rounded-lg border border-ink/12 bg-white px-3.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint transition-colors focus:border-burgundy/40"
        />
      </div>

      {/* ── TAB: PRODUCTOS ── */}
      <AnimatePresence mode="wait">
        {tab === "productos" && (
          <motion.div
            key="productos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/4" />)}
              </div>
            ) : visibleProducts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink/15 px-5 py-12 text-center text-sm text-ink-faint">
                {products.length ? "Ningún producto coincide con el filtro." : 'Aún no hay productos. Crea el primero con "+ Nuevo producto".'}
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((p, i) => {
                    const sl = stockLabel(p);
                    const stockColor = sl === "disponible" ? "text-esmeralda" : sl === "pocas" ? "text-gold" : "text-burgundy";
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03, duration: 0.4, ease } }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                        className="flex items-center gap-4 rounded-lg border border-ink/8 bg-white p-4 shadow-[0_1px_6px_rgba(30,33,37,0.03)]"
                      >
                        {/* Imagen miniatura */}
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                          {p.image_url
                            ? <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                            : <div className="flex h-full w-full items-center justify-center text-xl">{CATEGORY_LABELS[categories.find(c => c.id === p.category_id)?.slug as CategorySlug]?.emoji ?? "📦"}</div>
                          }
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-ink">{p.name}</p>
                            {!p.published && (
                              <span className="rounded-md bg-ink/8 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Oculto</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {catNameOf(p.category_id)}
                            {p.sku && <span className="font-mono ml-2 text-ink-faint/70">{p.sku}</span>}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-display text-sm font-semibold text-ink">{money(p.price, p.currency)}</p>
                          <p className={`text-xs ${stockColor}`}>
                            Stock: {p.stock}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-ink-faint transition-colors hover:border-burgundy/30 hover:text-burgundy"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-ink-faint transition-colors hover:border-burgundy/30 hover:text-burgundy"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: ÓRDENES ── */}
        {tab === "ordenes" && (
          <motion.div
            key="ordenes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/4" />)}
              </div>
            ) : visibleOrders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink/15 px-5 py-12 text-center text-sm text-ink-faint">
                {orders.length ? "Ninguna orden coincide con el filtro." : "Aún no hay órdenes de clientes."}
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {visibleOrders.map((o, i) => {
                    const st = ORDER_STATUS[o.status];
                    const itsCount = orderItems.filter((it) => it.order_id === o.id).length;
                    return (
                      <motion.button
                        key={o.id}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03, duration: 0.4, ease } }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedOrder(o)}
                        className="group flex w-full items-center gap-4 rounded-lg border border-ink/8 bg-white p-4 text-left shadow-[0_1px_6px_rgba(30,33,37,0.03)] transition-shadow hover:shadow-[0_6px_20px_rgba(30,33,37,0.07)]"
                      >
                        <span className="font-mono shrink-0 text-xs text-ink-faint">
                          {orderCode(o.order_no)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink">{o.client_name}</p>
                          <p className="mt-0.5 truncate text-xs text-ink-faint">
                            {o.client_email}
                            {itsCount > 0 && ` · ${itsCount} producto${itsCount !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                        <span className="font-display shrink-0 text-sm font-semibold text-ink">
                          {money(o.total)}
                        </span>
                        <span className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${st.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                        <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-burgundy">→</span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paneles laterales — montados en document.body para escapar del
          stacking context de PageTransition (que usa transform) */}
      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {editProduct !== null && (
            <ProductoPanel
              product={editProduct === "new" ? {} : editProduct}
              categories={categories}
              onClose={() => setEditProduct(null)}
              onSaved={load}
            />
          )}
          {selectedOrder && (
            <OrdenPanel
              order={selectedOrder}
              items={orderItems}
              onClose={() => setSelectedOrder(null)}
              onUpdated={load}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
