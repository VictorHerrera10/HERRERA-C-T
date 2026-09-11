"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/modules/shared/lib/supabase";
import { StatCard } from "@/modules/shared/components/StatCard";

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
        supabase.rpc("hct_public_unread_leads_count"),
      ]);
      setStats({
        services: s.count,
        testimonials: t.count,
        unreadLeads: l.data as number | null,
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
      accent: "text-[#ff8195]",
    },
  ];

  return (
    <div>
      <p className="section-number">/ sitio web</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-snow">Resumen</h1>
      <p className="mt-1 text-sm text-fog">
        Estado general del sitio público de Herrera C&amp;T.
      </p>

      {!stats.dbOk && (
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 px-5 py-4 text-sm text-snow">
          <strong>Base de datos sin inicializar.</strong> Ejecuta el archivo{" "}
          <code className="rounded bg-steel px-1.5 py-0.5 text-xs">
            supabase/schema.sql
          </code>{" "}
          en el SQL Editor de tu proyecto Supabase para crear las tablas y el
          contenido inicial. Mientras tanto, el sitio muestra el contenido por
          defecto.
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Link key={c.href} href={c.href} className="block">
            <StatCard label={c.label} value={c.value ?? "—"} accent={c.accent} delay={i * 0.08} />
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-edge bg-carbon/70 p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium text-snow">
          Accesos rápidos
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/contenido"
            className="rounded-lg border border-edge px-4 py-3.5 text-sm font-medium text-snow transition-colors hover:border-crimson/40 hover:bg-crimson/8"
          >
            ✏️ Editar textos del sitio (hero, nosotros, contacto…)
          </Link>
          <Link
            href="/admin/servicios"
            className="rounded-lg border border-edge px-4 py-3.5 text-sm font-medium text-snow transition-colors hover:border-crimson/40 hover:bg-crimson/8"
          >
            🧩 Agregar o modificar servicios
          </Link>
          <Link
            href="/admin/mensajes"
            className="rounded-lg border border-edge px-4 py-3.5 text-sm font-medium text-snow transition-colors hover:border-crimson/40 hover:bg-crimson/8"
          >
            📬 Revisar mensajes del formulario de contacto
          </Link>
          <a
            href="/"
            target="_blank"
            className="rounded-lg border border-edge px-4 py-3.5 text-sm font-medium text-snow transition-colors hover:border-crimson/40 hover:bg-crimson/8"
          >
            🌐 Ver el sitio público en otra pestaña
          </a>
        </div>
      </div>
    </div>
  );
}
