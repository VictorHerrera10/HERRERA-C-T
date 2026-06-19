"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import type { Service } from "@/modules/website/lib/content";
import { Icon } from "@/modules/shared/components/Icon";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

const accentStyles: Record<string, { text: string; bg: string; line: string }> = {
  burgundy: { text: "text-crimson-bright", bg: "bg-crimson/10", line: "bg-crimson" },
  azul: { text: "text-azul", bg: "bg-azul/10", line: "bg-azul" },
  gold: { text: "text-gold", bg: "bg-gold/10", line: "bg-gold" },
  esmeralda: { text: "text-esmeralda", bg: "bg-esmeralda/10", line: "bg-esmeralda" },
};

function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current!.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current!.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight-card ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function Services({ services }: { services: Service[] }) {
  return (
    <section id="servicios" className="relative scroll-mt-20 overflow-hidden py-28 lg:py-36">
      <div className="tech-grid absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-[-15%] top-1/3 h-96 w-96 rounded-full bg-blood/20 blur-[140px]" />
      <FloatingIcons
        icons={[
          { name: "code", className: "left-[3%] top-[10%] h-28 w-28 text-crimson/10", duration: 9 },
          { name: "server", className: "right-[4%] top-[22%] h-24 w-24 text-snow/5", delay: 1.5, duration: 11 },
          { name: "shield", className: "left-[8%] bottom-[8%] h-32 w-32 text-snow/5", delay: 3, duration: 10 },
          { name: "chart", className: "right-[10%] bottom-[14%] h-20 w-20 text-crimson/10", delay: 4.5, duration: 8 },
        ]}
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <div className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="section-number mb-4">[ 01 / Servicios ]</p>
              <h2 className="font-display max-w-2xl text-3xl font-bold uppercase leading-tight tracking-tight text-snow sm:text-5xl">
                Todo lo que tu operación necesita,{" "}
                <span className="text-stroke-crimson">en una sola mesa</span>
              </h2>
            </div>
            <div className="hairline-crimson hidden flex-1 lg:block" />
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {services.map((s, i) => {
            const accent = accentStyles[s.accent] ?? accentStyles.burgundy;
            return (
              <Reveal key={s.id} delay={(i % 3) * 0.1}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  <SpotlightCard className="hud-corners group h-full rounded-lg border border-edge bg-steel/60 p-7 backdrop-blur-sm transition-colors duration-300 hover:border-crimson/40">
                    <span
                      className={`absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 transition-transform duration-400 group-hover:scale-y-100 ${accent.line}`}
                    />
                    <div className="mb-6 flex items-center justify-between">
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${accent.bg} ${accent.text} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon name={s.icon} className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-xs text-ash transition-colors group-hover:text-crimson">
                        /{String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="font-display mb-3 text-base font-bold uppercase tracking-wide text-snow">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-fog">{s.description}</p>
                  </SpotlightCard>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
