"use client";

/* Inicio del trabajador: saludo + tarjetas de los módulos a los que
   tiene acceso (el admin ve además la gestión de usuarios). */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import {
  getSession,
  canAccess,
  roleLabel,
  MODULES,
  type SessionUser,
} from "../lib/auth";

function spotlight(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const HOURS: [number, string][] = [
  [6, "Buenos días"],
  [12, "Buenas tardes"],
  [19, "Buenas noches"],
];

function greeting(): string {
  const h = new Date().getHours();
  let g = "Buenas noches";
  for (const [from, label] of HOURS) if (h >= from) g = label;
  return g;
}

export function HubView() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  if (!user) return null;

  const accessible = MODULES.filter((m) => canAccess(user, m.key));
  const today = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      {/* Saludo */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative"
      >
        <p className="section-number">/ {today}</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">
          {greeting()},{" "}
          <span className="text-shimmer">{user.first_name || user.dni}</span>.
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fog">
          {roleLabel(user)}
          {user.area_name && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-steel px-3 py-1 text-xs">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-esmeralda" />
              Área de {user.area_name}
            </span>
          )}
        </p>
        <div className="hairline-crimson mt-8" />
      </motion.section>

      {/* Módulos */}
      <section className="mt-10">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-fog">
          Tus módulos
        </p>

        {accessible.length === 0 && !user.is_admin ? (
          <div className="rounded-2xl border border-edge bg-carbon/70 p-10 text-center">
            <Icon name="shield" className="mx-auto h-10 w-10 text-ash" />
            <p className="mt-4 font-display text-lg font-semibold">
              Aún no tienes módulos asignados
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-fog">
              El administrador de la plataforma debe activarte el acceso.
              Mientras tanto puedes completar tu perfil.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {accessible.map((m, i) => (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + i * 0.09 }}
              >
                <Link
                  href={m.href}
                  onMouseMove={spotlight}
                  className="spotlight-card hud-corners group block h-full rounded-2xl border border-edge bg-carbon/70 p-7 transition-colors hover:border-snow/20"
                >
                  <Icon name={m.icon} className={`h-8 w-8 ${m.accent}`} />
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    {m.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">
                    {m.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fog transition-colors group-hover:text-snow">
                    Abrir gestor
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </motion.div>
            ))}

            {user.is_admin && (
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + accessible.length * 0.09 }}
              >
                <Link
                  href="/usuarios"
                  onMouseMove={spotlight}
                  className="spotlight-card hud-corners group block h-full rounded-2xl border border-gold/25 bg-carbon/70 p-7 transition-colors hover:border-gold/50"
                >
                  <Icon name="shield" className="h-8 w-8 text-gold" />
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    Usuarios
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">
                    Cuentas del equipo, áreas, roles y acceso a módulos. Solo
                    administración.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-soft">
                    Abrir gestor
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
