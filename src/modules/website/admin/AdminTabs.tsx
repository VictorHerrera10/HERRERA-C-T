"use client";

/* Sub-navegación del gestor del sitio web: píldoras horizontales
   (mismo patrón de fondo deslizante que los filtros de otros gestores),
   renderizadas dentro del shell unificado en vez de un sidebar propio. */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const ease = [0.21, 0.6, 0.35, 1] as const;

const tabs = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/testimonios", label: "Testimonios" },
  { href: "/admin/mensajes", label: "Mensajes" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              active ? "text-snow" : "text-fog hover:bg-steel hover:text-snow"
            }`}
          >
            {active && (
              <motion.span
                layoutId="admin-tab-pill"
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 rounded-lg bg-crimson"
              />
            )}
            <span className="relative">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
