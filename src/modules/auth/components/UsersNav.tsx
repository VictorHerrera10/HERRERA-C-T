"use client";

/* Pestañas del gestor de usuarios (Usuarios | Áreas y roles) */

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/usuarios", label: "Usuarios", exact: true },
  { href: "/usuarios/areas", label: "Áreas y roles", exact: false },
];

export function UsersNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-2 border-b border-edge pb-px">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-crimson text-snow"
                : "border-transparent text-fog hover:text-snow"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
