"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import type { ContactContent } from "@/modules/website/lib/content";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";
import { useToast } from "@/modules/shared/components/Toast";

type Status = "idle" | "sending";

export function Contact({ content }: { content: ContactContent }) {
  const [status, setStatus] = useState<Status>("idle");
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    const { error } = await supabase.from("leads").insert({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    setStatus("idle");
    if (error) {
      toast.error(
        "Hubo un problema al enviar",
        "Intenta de nuevo o escríbenos directo al correo."
      );
    } else {
      toast.success(
        "Mensaje recibido",
        "Gracias por escribirnos. Te contactaremos a la brevedad."
      );
      form.reset();
    }
  }

  return (
    <section
      id="contacto"
      className="grain relative scroll-mt-20 overflow-hidden py-28 lg:py-36"
    >
      <div className="tech-grid absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-25%] h-96 w-96 rounded-full bg-crimson/12 blur-[140px]" />
        <div className="absolute bottom-[-30%] right-[-5%] h-96 w-96 rounded-full bg-blood/25 blur-[130px]" />
      </div>
      <FloatingIcons
        icons={[
          { name: "support", className: "right-[6%] top-[10%] h-24 w-24 text-crimson/10", duration: 9 },
          { name: "cloud", className: "left-[4%] bottom-[14%] h-28 w-28 text-snow/5", delay: 2, duration: 11 },
          { name: "server", className: "left-[12%] top-[14%] h-20 w-20 text-snow/5", delay: 3.8, duration: 8 },
        ]}
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-8">
        <div>
          <Reveal>
            <p className="section-number mb-4">[ 06 / {content.eyebrow} ]</p>
            <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight text-snow sm:text-5xl">
              {content.title}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-fog">
              {content.subtitle}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <dl className="mt-12 space-y-5 border-t border-edge pt-8 text-sm">
              {content.email && (
                <div className="flex gap-4">
                  <dt className="font-mono w-28 shrink-0 text-[10px] uppercase tracking-[0.22em] text-crimson-bright">
                    Correo
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${content.email}`}
                      className="text-snow/85 underline-offset-4 transition-colors hover:text-crimson-bright hover:underline"
                    >
                      {content.email}
                    </a>
                  </dd>
                </div>
              )}
              {content.phone && (
                <div className="flex gap-4">
                  <dt className="font-mono w-28 shrink-0 text-[10px] uppercase tracking-[0.22em] text-crimson-bright">
                    Teléfono
                  </dt>
                  <dd className="text-snow/85">{content.phone}</dd>
                </div>
              )}
              {content.whatsapp && (
                <div className="flex gap-4">
                  <dt className="font-mono w-28 shrink-0 text-[10px] uppercase tracking-[0.22em] text-crimson-bright">
                    WhatsApp
                  </dt>
                  <dd>
                    <a
                      href={`https://wa.me/${content.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-esmeralda transition-colors hover:text-snow"
                    >
                      {content.whatsapp}
                    </a>
                  </dd>
                </div>
              )}
              {content.location && (
                <div className="flex gap-4">
                  <dt className="font-mono w-28 shrink-0 text-[10px] uppercase tracking-[0.22em] text-crimson-bright">
                    Ubicación
                  </dt>
                  <dd className="text-snow/85">{content.location}</dd>
                </div>
              )}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="hud-corners rounded-lg border border-edge bg-steel/60 p-7 backdrop-blur-md lg:p-9"
          >
            <p className="font-mono mb-7 text-[10px] uppercase tracking-[0.28em] text-ash">
              &gt; iniciar_conversación<span className="animate-blink text-crimson">_</span>
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.18em] text-fog">
                  Nombre *
                </span>
                <input name="name" required className="field-dark" placeholder="Tu nombre" />
              </label>
              <label className="block">
                <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.18em] text-fog">
                  Correo *
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="field-dark"
                  placeholder="tu@empresa.com"
                />
              </label>
            </div>
            <label className="mt-5 block">
              <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.18em] text-fog">
                Empresa
              </span>
              <input
                name="company"
                className="field-dark"
                placeholder="Nombre de tu empresa"
              />
            </label>
            <label className="mt-5 block">
              <span className="font-mono mb-2 block text-[10px] uppercase tracking-[0.18em] text-fog">
                ¿Qué necesitas? *
              </span>
              <textarea
                name="message"
                required
                rows={4}
                className="field-dark resize-none"
                placeholder="Cuéntanos brevemente tu proyecto o problema…"
              />
            </label>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={status === "sending"}
              className="group relative mt-8 w-full overflow-hidden rounded-lg bg-crimson px-6 py-4 text-sm font-bold uppercase tracking-wider text-snow shadow-[0_8px_28px_rgba(216,17,43,0.4)] transition-shadow hover:shadow-[0_12px_40px_rgba(216,17,43,0.6)] disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {status === "sending" ? "Enviando…" : "Enviar mensaje →"}
              </span>
            </motion.button>

          </form>
        </Reveal>
      </div>
    </section>
  );
}
