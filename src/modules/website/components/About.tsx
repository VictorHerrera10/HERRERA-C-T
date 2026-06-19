"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { AboutContent } from "@/modules/website/lib/content";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

export function About({ content }: { content: AboutContent }) {
  return (
    <section
      id="nosotros"
      className="grain relative scroll-mt-20 overflow-hidden border-y border-edge bg-carbon py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[-20%] h-96 w-96 rounded-full bg-crimson/10 blur-[140px]" />
        <div className="absolute bottom-[-25%] left-[5%] h-80 w-80 rounded-full bg-azul/8 blur-[120px]" />
      </div>
      <FloatingIcons
        icons={[
          { name: "chip", className: "right-[5%] top-[12%] h-28 w-28 text-crimson/10", duration: 10 },
          { name: "wrench", className: "right-[14%] bottom-[10%] h-22 w-22 text-snow/5", delay: 2, duration: 9 },
          { name: "cloud", className: "left-[40%] top-[8%] h-20 w-20 text-snow/5", delay: 4, duration: 11 },
        ]}
      />

      {/* Logo de fondo girando lento */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.05 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="pointer-events-none absolute left-[-8%] top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 lg:block"
      >
        <div className="animate-spin-slow relative h-full w-full">
          <Image src="/logo.png" alt="" fill className="object-contain" />
        </div>
      </motion.div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-8">
        <div>
          <Reveal>
            <p className="section-number mb-4">[ 02 / {content.eyebrow} ]</p>
            <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight text-snow sm:text-5xl">
              {content.title}
            </h2>
          </Reveal>
          {content.paragraphs.map((p, i) => (
            <Reveal key={i} delay={0.12 + i * 0.08}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fog">{p}</p>
            </Reveal>
          ))}
        </div>

        <div className="flex flex-col justify-center">
          {content.bullets.map((b, i) => (
            <Reveal key={i} delay={0.15 + i * 0.1}>
              <motion.div
                whileHover={{ x: 8 }}
                transition={{ duration: 0.25 }}
                className="group flex items-start gap-5 border-b border-edge py-6 first:border-t"
              >
                <span className="font-mono mt-1 text-sm text-crimson">
                  {String(i + 1).padStart(2, "0")}
                  <span className="text-ash">//</span>
                </span>
                <p className="text-[15px] font-medium leading-relaxed text-snow/80 transition-colors group-hover:text-snow">
                  {b}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
