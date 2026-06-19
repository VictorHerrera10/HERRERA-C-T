"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";

const links = [
  { href: "#servicios", label: "Servicios" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#metodo", label: "Método" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "/ventas", label: "Tienda" },
  { href: "#contacto", label: "Contacto" },
  { href: "/soporte", label: "Soporte" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.21, 0.6, 0.35, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-edge bg-void/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 lg:px-8">
        <a href="#" className="group flex items-center gap-3">
          <div className="logo-badge h-10 w-10 p-1.5 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <div className="leading-tight">
            <span className="font-display block text-sm font-bold uppercase tracking-wide text-snow">
              Herrera
            </span>
            <span className="font-mono block text-[9px] uppercase tracking-[0.28em] text-fog">
              Consulting &amp; Tech
            </span>
          </div>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono group relative text-xs font-medium uppercase tracking-[0.18em] text-fog transition-colors hover:text-snow"
            >
              <span className="mr-1 text-crimson opacity-0 transition-opacity group-hover:opacity-100">
                /{String(i + 1).padStart(2, "0")}
              </span>
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-crimson transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#contacto"
            className="rounded-lg bg-crimson px-4 py-2 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.4)] transition-all hover:-translate-y-0.5 hover:bg-crimson-bright"
          >
            Cotizar
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-snow md:hidden"
          aria-label="Abrir menú"
        >
          <span
            className={`block h-0.5 w-6 bg-current transition-transform ${open ? "translate-y-1 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-transform ${open ? "-translate-y-1 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-edge bg-void/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3 sm:px-5 sm:py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-mono rounded-lg px-3 py-2.5 text-sm uppercase tracking-[0.14em] text-fog hover:bg-steel hover:text-snow"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-crimson px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-snow"
              >
                Cotizar proyecto
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
