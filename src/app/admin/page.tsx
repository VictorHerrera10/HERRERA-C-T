"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/modules/shared/lib/supabase";

type Stats = {
  services: number | null;
  testimonials: number | null;
  unreadLeads: number | null;
  dbOk: boolean;
};

export default function AdminHome() {
  const [stats, setStats] = useState<Stats>({
    services: null,
    testimonials: null,
    unreadLeads: null,
    dbOk: true,
  });

  useEffect(() => {
    async function load() {
      const [s, t, l] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("testimonials").select("id", { count: "exact", head: true }),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("read", false),
      ]);
      setStats({
        services: s.count,
        testimonials: t.count,
        unreadLeads: l.count,
        dbOk: !s.error,
      });
    }
    load();
  }, []);

  const cards = [
    {
      label: "Servicios publicados",
      value: stats.services,
      href: "/admin/servicios",
      accent: "text-azul",
    },
    {
      label: "Testimonios",
      value: stats.testimonials,
      href: "/admin/testimonios",
      accent: "text-esmeralda",
    },
    {
      label: "Mensajes sin leer",
      value: stats.unreadLeads,
      href: "/admin/mensajes",
      accent: "text-burgundy",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-ink">Resumen</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Estado general del sitio público de Herrera C&amp;T.
      </p>

      {!stats.dbOk && (
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-ink">
          <strong>Base de datos sin inicializar.</strong> Ejecuta el archivo{" "}
          <code className="rounded bg-ink/8 px-1.5 py-0.5 text-xs">
            supabase/schema.sql
          </code>{" "}
          en el SQL Editor de tu proyecto Supabase para crear las tablas y el
          contenido inicial. Mientras tanto, el sitio muestra el contenido por
          defecto.
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-lg border border-ink/8 bg-white p-6 shadow-[0_2px_12px_rgba(30,33,37,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,33,37,0.09)]"
          >
            <p className={`font-display text-4xl font-medium ${c.accent}`}>
              {c.value ?? "—"}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {c.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-ink/8 bg-white p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium text-ink">
          Accesos rápidos
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/contenido"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            ✏️ Editar textos del sitio (hero, nosotros, contacto…)
          </Link>
          <Link
            href="/admin/servicios"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            🧩 Agregar o modificar servicios
          </Link>
          <Link
            href="/admin/mensajes"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            📬 Revisar mensajes del formulario de contacto
          </Link>
          <a
            href="/"
            target="_blank"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            🌐 Ver el sitio público en otra pestaña
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-ink/8 bg-white p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium text-ink">
          Módulos conectados
        </h2>
        <p className="mt-1 text-xs text-ink-faint">
          Otros módulos de la plataforma Herrera C&amp;T. Cada uno tiene su
          propia área de trabajo.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/soporte/gestion"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            🎧 Mesa de ayuda — gestión de tickets
          </Link>
          <a
            href="/soporte"
            target="_blank"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            🛟 Portal de soporte (vista del cliente) ↗
          </a>
          <Link
            href="/cotizaciones/gestion"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            📄 Cotizaciones — propuestas comerciales
          </Link>
          <a
            href="/cotizaciones"
            target="_blank"
            className="rounded-lg border border-ink/10 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy/4"
          >
            ✍️ Portal de cotizaciones (vista del cliente) ↗
          </a>
        </div>
      </div>

      <p className="mt-8 rounded-lg bg-cream/70 px-5 py-4 text-xs leading-relaxed text-ink-soft">
        ⚠ <strong>Nota de seguridad:</strong> este panel aún no tiene login (se
        implementará en la fase final del proyecto). No publiques la URL{" "}
        <code>/admin</code> mientras tanto.
      </p>
    </div>
  );
}
