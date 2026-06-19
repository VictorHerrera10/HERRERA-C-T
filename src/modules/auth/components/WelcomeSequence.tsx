"use client";

/* Bienvenida en 3 actos — se muestra UNA sola vez, justo después de que
   el trabajador cambia su contraseña en el primer login.
   Acto 1: saludo personal · Acto 2: su rol · Acto 3: mensaje motivacional */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { type SessionUser, roleLabel } from "../lib/auth";

const GREETINGS = [
  "Hola, {name}. Te estábamos esperando.",
  "Qué bueno tenerte aquí, {name}.",
  "{name}, esto recién empieza.",
  "Bienvenido a bordo, {name}.",
];

const MOTIVATION = [
  {
    title: "Bienvenido a la mejor consultora.",
    line: "Aquí los problemas difíciles son el plan del día. Vamos a hacer un trabajo excelente.",
  },
  {
    title: "Los grandes proyectos no se hacen solos.",
    line: "Se hacen con gente como tú. Este equipo acaba de volverse más fuerte.",
  },
  {
    title: "Hoy empieza algo grande.",
    line: "Cada cliente que confía en Herrera C&T ahora también cuenta contigo. Hagámoslo extraordinario.",
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const fade = {
  initial: { opacity: 0, y: 26, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -26, filter: "blur(8px)" },
};

export function WelcomeSequence({
  user,
  onDone,
}: {
  user: SessionUser;
  onDone: () => void;
}) {
  const [act, setAct] = useState<1 | 2 | 3>(1);

  const greeting = useMemo(
    () => pick(GREETINGS).replace("{name}", user.first_name || user.dni),
    [user]
  );
  const motivation = useMemo(() => pick(MOTIVATION), []);

  useEffect(() => {
    const t1 = setTimeout(() => setAct(2), 3600);
    const t2 = setTimeout(() => setAct(3), 7600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="grain fixed inset-0 z-50 overflow-hidden bg-void">
      {/* Atmósfera */}
      <div className="tech-grid absolute inset-0 opacity-60" />
      <div className="scanline-layer" />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(216,17,43,0.16), transparent 62%)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Progreso de actos */}
      <div className="absolute left-1/2 top-10 z-10 flex -translate-x-1/2 gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1 w-10 rounded-full transition-colors duration-500 ${
              act >= n ? "bg-crimson" : "bg-snow/12"
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {act === 1 && (
            <motion.div
              key="act1"
              {...fade}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="section-number mb-6"
              >
                / 01 — Hola
              </motion.p>
              <h1 className="font-display text-4xl font-bold leading-tight text-snow sm:text-6xl">
                {greeting.split(user.first_name || user.dni)[0]}
                <span className="text-shimmer">
                  {user.first_name || user.dni}
                </span>
                {greeting.split(user.first_name || user.dni)[1]}
              </h1>
            </motion.div>
          )}

          {act === 2 && (
            <motion.div
              key="act2"
              {...fade}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <p className="section-number mb-6">/ 02 — Tu rol</p>
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-fog">
                En esta consultora eres
              </p>
              <motion.h2
                initial={{ letterSpacing: "0.2em", opacity: 0 }}
                animate={{ letterSpacing: "0.02em", opacity: 1 }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
                className="font-display text-3xl font-bold text-snow sm:text-5xl"
              >
                {roleLabel(user)}
              </motion.h2>
              {user.area_name && (
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-edge bg-steel px-4 py-1.5 text-sm text-fog"
                >
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-esmeralda" />
                  Área de {user.area_name}
                </motion.span>
              )}
            </motion.div>
          )}

          {act === 3 && (
            <motion.div
              key="act3"
              {...fade}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <p className="section-number mb-6">/ 03 — A trabajar</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-snow sm:text-5xl">
                {motivation.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fog sm:text-lg">
                {motivation.line}
              </p>
              <div className="hairline-crimson mx-auto mt-8 w-48" />
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={onDone}
                className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-crimson px-8 py-4 font-display text-sm font-semibold uppercase tracking-wider text-snow transition-all hover:bg-crimson-bright hover:shadow-[0_0_36px_rgba(216,17,43,0.45)]"
              >
                Entrar a la plataforma
                <Icon
                  name="rocket"
                  className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
