"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from "motion/react";
import type { HeroContent } from "@/modules/website/lib/content";
import { Icon } from "@/modules/shared/components/Icon";

const ease = [0.21, 0.6, 0.35, 1] as const;

/* Título animado letra por letra con efecto de caída */
function AnimatedTitle({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  let letterIndex = 0;
  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split("").map((char, ci) => {
            const i = letterIndex++;
            return (
              <motion.span
                key={ci}
                initial={{ opacity: 0, y: 60, rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.35 + i * 0.035, ease }}
                className="inline-block origin-bottom"
              >
                {char}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/* Glitch que se dispara solo cada cierto tiempo */
function GlitchAccent({ text }: { text: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 420);
    }, 4200);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 1.15 }}
      data-text={text}
      className={`glitch text-shimmer ${active ? "glitch-active" : ""}`}
    >
      {text}
    </motion.span>
  );
}

export function Hero({ content }: { content: HeroContent }) {
  const sectionRef = useRef<HTMLElement>(null);

  /* Parallax con el mouse */
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(620px circle at ${x} ${y}, rgba(216,17,43,0.16), transparent 60%)`
  );
  const logoX = useTransform(sx, [0, 1], [28, -28]);
  const logoY = useTransform(sy, [0, 1], [18, -18]);

  /* Parallax con el scroll */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  function handleMouse(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouse}
      className="grain relative min-h-screen overflow-hidden bg-void"
    >
      {/* Retícula técnica */}
      <div className="tech-grid absolute inset-0 opacity-60" />

      {/* Glow carmesí que sigue al mouse */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: glowBackground }}
      />

      {/* Resplandores fijos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-15%] h-[36rem] w-[36rem] rounded-full bg-crimson/12 blur-[160px]" />
        <div className="absolute bottom-[-25%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-blood/25 blur-[140px]" />
      </div>

      {/* Línea de escaneo */}
      <div className="scanline-layer" />

      {/* Sistema orbital tecnológico con parallax */}
      <motion.div
        style={{ x: logoX, y: logoY }}
        className="pointer-events-none absolute right-[5%] top-1/2 hidden -translate-y-1/2 select-none lg:block xl:right-[7%]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.5, ease }}
          className="relative h-[30rem] w-[30rem]"
        >
          {/* Anillo exterior */}
          <div className="animate-spin-slow absolute inset-0">
            <svg viewBox="0 0 400 400" className="h-full w-full">
              <circle
                cx="200" cy="200" r="192"
                fill="none" stroke="rgba(216,17,43,0.3)"
                strokeWidth="1" strokeDasharray="3 14"
              />
              <circle cx="392" cy="200" r="5" fill="#ff2742" />
              <circle cx="200" cy="8" r="3" fill="rgba(244,244,246,0.5)" />
            </svg>
          </div>
          {/* Anillo medio (sentido contrario) */}
          <div className="animate-spin-reverse absolute inset-12">
            <svg viewBox="0 0 400 400" className="h-full w-full">
              <circle
                cx="200" cy="200" r="190"
                fill="none" stroke="rgba(244,244,246,0.14)"
                strokeWidth="1" strokeDasharray="40 22"
              />
              <circle cx="10" cy="200" r="4" fill="#3b82f6" />
              <circle cx="200" cy="390" r="4" fill="#e8b33c" />
            </svg>
          </div>
          {/* Anillo interior */}
          <div className="animate-spin-slow absolute inset-28">
            <svg viewBox="0 0 400 400" className="h-full w-full">
              <circle
                cx="200" cy="200" r="186"
                fill="none" stroke="rgba(216,17,43,0.45)"
                strokeWidth="1.5" strokeDasharray="2 10"
              />
              <circle cx="386" cy="200" r="6" fill="#1fce8c" />
            </svg>
          </div>

          {/* Núcleo: chip central */}
          <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-crimson/50 bg-carbon shadow-[0_0_60px_rgba(216,17,43,0.45)]">
            <Icon name="chip" className="h-12 w-12 text-crimson-bright" />
            <span className="animate-pulse-dot absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-esmeralda" />
          </div>

          {/* Chips de telemetría flotantes */}
          <div className="animate-float absolute left-[-8%] top-[18%] flex items-center gap-2 rounded-lg border border-edge bg-steel/85 px-3.5 py-2.5 backdrop-blur-md">
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-esmeralda" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
              Uptime <span className="text-esmeralda">99.98%</span>
            </span>
          </div>
          <div
            className="animate-float absolute right-[-4%] top-[58%] flex items-center gap-2 rounded-lg border border-edge bg-steel/85 px-3.5 py-2.5 backdrop-blur-md"
            style={{ animationDelay: "1.4s" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
              Deploy <span className="text-azul">▲ OK</span>
            </span>
          </div>
          <div
            className="animate-float absolute bottom-[6%] left-[14%] flex items-center gap-2 rounded-lg border border-edge bg-steel/85 px-3.5 py-2.5 backdrop-blur-md"
            style={{ animationDelay: "2.6s" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
              Seguridad <span className="text-crimson-bright">ACTIVA</span>
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Marcas HUD en las esquinas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="pointer-events-none absolute inset-6 hidden lg:block"
      >
        <span className="absolute left-0 top-16 h-10 w-10 border-l-2 border-t-2 border-crimson/50" />
        <span className="absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 border-crimson/50" />
        <span className="font-mono absolute bottom-2 left-0 text-[10px] uppercase tracking-[0.3em] text-ash">
          HCT // SYS.ONLINE
        </span>
        <span className="font-mono absolute right-0 top-16 text-[10px] uppercase tracking-[0.3em] text-ash">
          LAT.READY_
        </span>
      </motion.div>

      {/* Contenido */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 pb-12 pt-20 sm:pb-24 sm:pt-32 lg:px-8"
      >
        {/* Eyebrow terminal */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="font-mono mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-crimson-bright"
        >
          <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-crimson" />
          {content.eyebrow}
          <span className="animate-blink text-snow">_</span>
        </motion.p>

        {/* Titular brutal */}
        <h1
          className="font-display max-w-5xl text-4xl font-extrabold uppercase leading-[1.06] tracking-tight text-snow sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ perspective: "800px" }}
        >
          <AnimatedTitle text={content.title} />
          <br />
          <GlitchAccent text={content.titleAccent} />
        </h1>

        {/* Subrayado que se expande */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, delay: 1.4, ease }}
          className="mt-8 h-[3px] w-44 origin-left bg-gradient-to-r from-crimson via-crimson-bright to-transparent"
        />

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5, ease }}
          className="mt-7 max-w-2xl text-sm leading-relaxed text-fog sm:text-base lg:text-lg"
        >
          {content.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.7, ease }}
          className="mt-8 flex flex-wrap gap-2 sm:mt-11 sm:gap-4"
        >
          <motion.a
            href="#contacto"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden rounded-lg bg-crimson px-7 py-4 text-sm font-bold uppercase tracking-wider text-snow shadow-[0_8px_32px_rgba(216,17,43,0.45)] transition-shadow hover:shadow-[0_12px_44px_rgba(216,17,43,0.65)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">
              {content.ctaPrimary} <span className="ml-1">→</span>
            </span>
          </motion.a>
          <motion.a
            href="#servicios"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="hud-corners rounded-lg border border-edge bg-steel/40 px-7 py-4 text-sm font-bold uppercase tracking-wider text-snow backdrop-blur-sm transition-colors hover:border-crimson/60 hover:text-crimson-bright"
          >
            {content.ctaSecondary}
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="pointer-events-none absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 lg:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-edge p-1.5"
        >
          <div className="h-2 w-1 rounded-full bg-crimson-bright" />
        </motion.div>
      </motion.div>
    </section>
  );
}
