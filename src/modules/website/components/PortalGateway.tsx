"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

const ease = [0.21, 0.6, 0.35, 1] as const;

export function PortalGateway() {
  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-5 py-20 text-snow">
      <div className="tech-grid absolute inset-0 opacity-50" />
      <div className="scanline-layer" />
      <FloatingIcons
        icons={[
          { name: "shield", className: "left-[8%] top-[18%] h-24 w-24 text-crimson/10", duration: 9 },
          { name: "chip", className: "right-[14%] top-[36%] h-16 w-16 text-azul/10", delay: 1.4 },
          { name: "server", className: "left-[22%] bottom-[22%] h-20 w-20 text-snow/6", delay: 2.2, duration: 10 },
          { name: "code", className: "right-[10%] bottom-[12%] h-24 w-24 text-crimson/8", delay: 0.8 },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 mb-12 flex flex-col items-center text-center"
      >
        <div className="logo-badge mb-5 h-14 w-14 p-2.5">
          <div className="relative h-full w-full">
            <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
          </div>
        </div>
        <p className="section-number mb-3">/ portal de acceso</p>
        <h1 className="font-display max-w-xl text-3xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">
          ¿Cómo quieres <span className="text-shimmer">entrar?</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
          Elige tu tipo de acceso a la plataforma de Herrera C&amp;T.
        </p>
      </motion.div>

      <div className="relative z-10 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
        >
          <Link
            href="/portal/cliente"
            className="hud-corners spotlight-card group flex h-full flex-col rounded-2xl border border-edge bg-carbon/70 p-8 backdrop-blur-sm transition-colors hover:border-crimson/50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-crimson/30 bg-crimson/10">
              <Icon name="user" className="h-7 w-7 text-crimson-bright" />
            </div>
            <h2 className="font-display mt-6 text-xl font-bold uppercase tracking-tight">
              Portal de cliente
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-fog">
              Crea tu cuenta o ingresa para ver el estado de tus cotizaciones y
              proyectos, o solicita una cotización preliminar.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-crimson-bright">
              Entrar
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease }}
        >
          <Link
            href="/login"
            className="hud-corners spotlight-card group flex h-full flex-col rounded-2xl border border-edge bg-carbon/70 p-8 backdrop-blur-sm transition-colors hover:border-azul/50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-azul/30 bg-azul/10">
              <Icon name="shield" className="h-7 w-7 text-azul" />
            </div>
            <h2 className="font-display mt-6 text-xl font-bold uppercase tracking-tight">
              Portal de colaborador
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-fog">
              Acceso exclusivo para el equipo de Herrera C&amp;T con tu DNI.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-azul">
              Entrar
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 mt-10"
      >
        <Link href="/" className="text-xs text-ash transition-colors hover:text-fog">
          ← Volver al sitio
        </Link>
      </motion.div>
    </div>
  );
}
