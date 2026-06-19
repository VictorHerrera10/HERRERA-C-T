"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/contenido", label: "Contenido del sitio" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/testimonios", label: "Testimonios" },
  { href: "/admin/mensajes", label: "Mensajes recibidos" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ink/8 bg-burgundy-deep text-ivory max-lg:hidden">
      <div className="border-b border-ivory/10 px-6 py-6">
        <p className="font-display text-lg font-semibold">Herrera C&amp;T</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-soft">
          Gestor del sitio
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-ivory/12 text-ivory"
                  : "text-ivory/60 hover:bg-ivory/6 hover:text-ivory"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ivory/10 px-3 py-4">
        <p className="px-3.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-ivory/40">
          Otros módulos
        </p>
        <Link
          href="/inicio"
          className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-ivory/70 transition-colors hover:bg-ivory/6 hover:text-ivory"
        >
          Inicio de la plataforma →
        </Link>
        <Link
          href="/soporte/gestion"
          className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-ivory/70 transition-colors hover:bg-ivory/6 hover:text-ivory"
        >
          Mesa de ayuda →
        </Link>
        <Link
          href="/cotizaciones/gestion"
          className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-ivory/70 transition-colors hover:bg-ivory/6 hover:text-ivory"
        >
          Cotizaciones →
        </Link>
        <a
          href="/"
          target="_blank"
          className="block rounded-lg px-3.5 py-2.5 text-sm font-medium text-gold-soft transition-colors hover:bg-ivory/6"
        >
          Ver sitio público ↗
        </a>
      </div>
    </aside>
  );
}
