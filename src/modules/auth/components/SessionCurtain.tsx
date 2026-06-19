"use client";

/* Cortina de transición de sesión: animación a pantalla completa
   al INICIAR sesión (mode="in") y al CERRARLA (mode="out").
   Barrido carmesí + logo con ondas + mensaje, luego llama onDone. */

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";

const COPY = {
  in: {
    eyebrow: "/ acceso concedido",
    title: "Hola de nuevo,",
    sub: "Preparando tu espacio de trabajo…",
  },
  out: {
    eyebrow: "/ sesión cerrada",
    title: "Hasta pronto,",
    sub: "Cerrando tu sesión de forma segura…",
  },
} as const;

export function SessionCurtain({
  mode,
  name,
  onDone,
}: {
  mode: "in" | "out";
  name: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  const copy = COPY[mode];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="grain fixed inset-0 z-[90] overflow-hidden bg-void text-snow"
    >
      <div className="tech-grid absolute inset-0 opacity-50" />
      <div className="scanline-layer" />

      {/* Barrido carmesí inclinado que cruza la pantalla */}
      <motion.div
        aria-hidden
        initial={{ x: "-130%" }}
        animate={{ x: "130%" }}
        transition={{ duration: 1.15, ease: [0.7, 0, 0.3, 1], delay: 0.1 }}
        className="absolute inset-y-[-20%] left-0 w-[140%] -skew-x-12 bg-gradient-to-r from-transparent via-crimson to-transparent opacity-90"
      />
      {/* Segundo barrido más tenue, a contratiempo */}
      <motion.div
        aria-hidden
        initial={{ x: "130%" }}
        animate={{ x: "-130%" }}
        transition={{ duration: 1.3, ease: [0.7, 0, 0.3, 1], delay: 0.35 }}
        className="absolute inset-y-[-20%] left-0 w-[140%] -skew-x-12 bg-gradient-to-r from-transparent via-blood/60 to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Logo con ondas expansivas */}
        <div className="relative">
          {[0, 0.5, 1].map((d) => (
            <motion.span
              key={d}
              aria-hidden
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{
                duration: 1.8,
                delay: 0.4 + d,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-2xl border border-crimson"
            />
          ))}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.25 }}
            className="logo-badge relative h-20 w-20 p-3.5"
          >
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="section-number mt-9"
        >
          {copy.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, delay: 0.85, ease: "easeOut" }}
          className="mt-4 font-display text-3xl font-bold sm:text-5xl"
        >
          {copy.title} <span className="text-shimmer">{name}</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 text-sm text-fog"
        >
          {copy.sub}
        </motion.p>

        {/* Barra de progreso */}
        <div className="mt-9 h-[2px] w-56 overflow-hidden rounded-full bg-snow/10">
          <motion.span
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.2, ease: [0.3, 0.8, 0.4, 1], delay: 0.25 }}
            className="block h-full bg-crimson"
          />
        </div>
      </div>
    </motion.div>
  );
}
