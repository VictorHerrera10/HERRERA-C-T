"use client";

/* Estructura de la plataforma interna (/inicio, /perfil, /usuarios):
   menú LATERAL animado construido según la sesión (módulos del
   trabajador, Usuarios solo para el admin) + drawer en móvil.
   Al cerrar sesión muestra la cortina animada (SessionCurtain). */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { PageTransition } from "@/modules/shared/components/PageTransition";
import {
  getSession,
  clearSession,
  displayName,
  roleLabel,
  canAccess,
  MODULES,
  type SessionUser,
} from "../lib/auth";
import { SessionCurtain } from "./SessionCurtain";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  accent?: string;
  external?: boolean; // sale del shell (gestores de módulos)
};

type NavSection = { label: string; items: NavItem[] };

function buildSections(user: SessionUser): NavSection[] {
  const sections: NavSection[] = [
    {
      label: "Plataforma",
      items: [
        { href: "/inicio", label: "Inicio", icon: "home" },
        ...(user.is_admin
          ? [{ href: "/usuarios", label: "Usuarios", icon: "shield", accent: "text-gold" }]
          : []),
      ],
    },
  ];
  const mods = MODULES.filter((m) => canAccess(user, m.key));
  if (mods.length)
    sections.push({
      label: "Mis módulos",
      items: mods.map((m) => ({
        href: m.href,
        label: m.label,
        icon: m.icon,
        accent: m.accent,
        external: true,
      })),
    });
  sections.push({
    label: "Cuenta",
    items: [{ href: "/perfil", label: "Mi perfil", icon: "user" }],
  });
  return sections;
}

const listAnim = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.15 } },
};
const itemAnim = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function SidebarContent({
  user,
  pathname,
  onLogout,
  onNavigate,
}: {
  user: SessionUser;
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const sections = buildSections(user);

  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <Link
        href="/inicio"
        onClick={onNavigate}
        className="group flex items-center gap-3 border-b border-edge px-5 py-5"
      >
        <div className="logo-badge h-10 w-10 shrink-0 p-1.5">
          <div className="relative h-full w-full">
            <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
          </div>
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Herrera C&amp;T</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-gold-soft">
            Plataforma interna
          </p>
        </div>
      </Link>

      {/* Navegación */}
      <motion.nav
        variants={listAnim}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        {sections.map((sec) => (
          <div key={sec.label} className="mb-6">
            <motion.p
              variants={itemAnim}
              className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.26em] text-ash"
            >
              {sec.label}
            </motion.p>
            <div className="space-y-1">
              {sec.items.map((it) => {
                const active =
                  !it.external &&
                  (it.href === "/inicio"
                    ? pathname === it.href
                    : pathname.startsWith(it.href));
                return (
                  <motion.div key={it.href} variants={itemAnim}>
                    <Link
                      href={it.href}
                      onClick={onNavigate}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "text-snow" : "text-fog hover:text-snow"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="side-active"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-xl border border-crimson/30 bg-crimson/12"
                        />
                      )}
                      {active && (
                        <motion.span
                          layoutId="side-bar"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-crimson shadow-[0_0_12px_rgba(216,17,43,0.8)]"
                        />
                      )}
                      <span
                        className={`relative flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/70 transition-all duration-300 group-hover:scale-110 group-hover:border-snow/25 ${
                          active ? "border-crimson/40" : ""
                        }`}
                      >
                        <Icon
                          name={it.icon}
                          className={`h-4 w-4 ${it.accent ?? (active ? "text-crimson-bright" : "")}`}
                        />
                      </span>
                      <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                        {it.label}
                      </span>
                      {it.external && (
                        <span className="relative ml-auto text-[10px] text-ash transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-snow">
                          →
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.nav>

      {/* Usuario + salir */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.45 }}
        className="border-t border-edge p-3"
      >
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-snow/5"
        >
          <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-edge bg-steel">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-xs font-bold text-crimson-bright">
                {(user.first_name[0] ?? "") + (user.last_name[0] ?? "")}
              </span>
            )}
            <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-carbon bg-esmeralda" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-snow">
              {displayName(user)}
            </span>
            <span className="block truncate text-[11px] text-fog">
              {roleLabel(user)}
            </span>
          </span>
        </Link>
        <button
          onClick={onLogout}
          className="group mt-2 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-fog transition-colors hover:bg-crimson/10 hover:text-snow"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/70 transition-all duration-300 group-hover:border-crimson/50 group-hover:bg-crimson/15">
            <Icon name="logout" className="h-4 w-4 group-hover:text-crimson-bright" />
          </span>
          Cerrar sesión
        </button>
        <p className="mt-3 flex items-center gap-2 px-2.5 text-[10px] text-ash">
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-esmeralda" />
          Plataforma operativa
        </p>
      </motion.div>
    </div>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false); // drawer móvil
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setUser(getSession());
    setOpen(false); // cierra el drawer al navegar
  }, [pathname]);

  function logout() {
    setLeaving(true); // la cortina hace el resto
  }

  if (leaving && user)
    return (
      <SessionCurtain
        mode="out"
        name={user.first_name || user.dni}
        onDone={() => {
          clearSession();
          router.replace("/login");
        }}
      />
    );

  return (
    <div className="grain relative flex min-h-screen bg-void text-snow">
      <div className="tech-grid absolute inset-0 opacity-40" />

      {/* ── Menú lateral (escritorio) ── */}
      <motion.aside
        initial={{ x: -48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-30 hidden h-screen w-[264px] shrink-0 border-r border-edge bg-carbon/85 backdrop-blur-md lg:block"
      >
        {user && (
          <SidebarContent user={user} pathname={pathname} onLogout={logout} />
        )}
      </motion.aside>

      {/* ── Barra superior (móvil) ── */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-edge bg-carbon/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link href="/inicio" className="flex items-center gap-2.5">
          <div className="logo-badge h-8 w-8 p-1">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <span className="font-display text-sm font-semibold">Herrera C&amp;T</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg border border-edge p-2 text-fog transition-colors hover:text-snow"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </div>

      {/* ── Drawer móvil ── */}
      <AnimatePresence>
        {open && user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-edge bg-carbon lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="absolute right-3 top-4 z-10 rounded-lg p-2 text-ash transition-colors hover:text-snow"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
              <SidebarContent
                user={user}
                pathname={pathname}
                onLogout={logout}
                onNavigate={() => setOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Contenido ── */}
      <main className="relative z-10 min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-5 sm:pb-12 sm:pt-20 lg:px-10 lg:pt-10">
        <div className="mx-auto w-full max-w-5xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
