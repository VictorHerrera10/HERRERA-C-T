"use client";

import { motion } from "motion/react";
import type { Testimonial } from "@/modules/website/lib/content";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (!testimonials.length) return null;
  return (
    <section className="relative overflow-hidden border-y border-edge bg-carbon py-28">
      <div className="pointer-events-none absolute left-1/2 top-[-40%] h-96 w-[40rem] -translate-x-1/2 rounded-full bg-crimson/8 blur-[140px]" />
      <FloatingIcons
        icons={[
          { name: "support", className: "left-[4%] top-[16%] h-26 w-26 text-crimson/10", duration: 9 },
          { name: "globe", className: "right-[5%] bottom-[12%] h-24 w-24 text-snow/5", delay: 2.5, duration: 10 },
        ]}
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <p className="section-number mb-14 text-center">
            [ 05 / Lo que dicen nuestros clientes ]
          </p>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.12}>
              <motion.figure
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="hud-corners relative h-full rounded-lg border border-edge bg-steel/60 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-crimson/40 lg:p-10"
              >
                <span className="font-display pointer-events-none absolute -top-1 left-6 text-7xl font-bold leading-none text-crimson/20">
                  “
                </span>
                <blockquote className="relative text-lg font-light leading-relaxed text-snow/90 lg:text-xl">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-edge pt-6">
                  <span className="font-display flex h-11 w-11 items-center justify-center rounded-lg bg-crimson/15 text-base font-bold text-crimson-bright">
                    {t.author.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-snow">{t.author}</p>
                    {t.role && (
                      <p className="font-mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ash">
                        {t.role}
                      </p>
                    )}
                  </div>
                </figcaption>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
