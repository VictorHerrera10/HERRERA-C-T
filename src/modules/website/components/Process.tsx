"use client";

import { motion } from "motion/react";
import type { ProcessContent } from "@/modules/website/lib/content";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

export function Process({ content }: { content: ProcessContent }) {
  return (
    <section id="metodo" className="relative scroll-mt-20 overflow-hidden py-28 lg:py-36">
      <div className="pointer-events-none absolute right-[-10%] bottom-[-30%] h-96 w-96 rounded-full bg-blood/20 blur-[140px]" />
      <FloatingIcons
        icons={[
          { name: "rocket", className: "left-[4%] bottom-[12%] h-30 w-30 text-crimson/10", duration: 9 },
          { name: "wrench", className: "right-[5%] top-[14%] h-24 w-24 text-snow/5", delay: 1.8, duration: 10 },
          { name: "chart", className: "left-[10%] top-[10%] h-20 w-20 text-snow/5", delay: 3.6, duration: 8 },
        ]}
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <div className="mb-20 flex items-end justify-between gap-6">
            <div>
              <p className="section-number mb-4">[ 03 / {content.eyebrow} ]</p>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-snow sm:text-5xl">
                {content.title}
              </h2>
            </div>
            <div className="hairline-crimson hidden flex-1 lg:block" />
          </div>
        </Reveal>

        <div className="relative grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Línea conectora animada */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: [0.21, 0.6, 0.35, 1] }}
            className="absolute left-0 top-7 hidden h-px w-full origin-left bg-gradient-to-r from-crimson via-crimson/40 to-transparent lg:block"
          />

          {content.steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.14}>
              <div className="group relative">
                <div className="relative mb-7 flex items-center">
                  <motion.span
                    whileHover={{ scale: 1.15, rotate: 45 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex h-14 w-14 rotate-0 items-center justify-center border border-crimson/40 bg-void transition-colors duration-300 group-hover:border-crimson group-hover:shadow-[0_0_30px_rgba(216,17,43,0.4)]"
                  >
                    <span className="font-display text-lg font-bold text-crimson-bright transition-transform duration-300 group-hover:-rotate-45">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </motion.span>
                </div>
                <h3 className="font-display mb-3 text-base font-bold uppercase tracking-wide text-snow">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
