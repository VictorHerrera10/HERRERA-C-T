"use client";

/* eslint-disable @next/next/no-img-element */

import { motion } from "motion/react";
import type { Project } from "@/modules/website/lib/content";
import { Reveal } from "@/modules/shared/components/Reveal";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";

/* Placeholder técnico cuando el proyecto no tiene imagen */
function Placeholder({ title, index }: { title: string; index: number }) {
  return (
    <div className="tech-grid relative flex h-full w-full items-center justify-center overflow-hidden bg-carbon">
      <span className="font-display text-stroke-crimson select-none text-[7rem] font-extrabold uppercase leading-none opacity-60">
        {title.charAt(0)}
      </span>
      <span className="font-mono absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.3em] text-ash">
        PRJ.{String(index + 1).padStart(3, "0")}
      </span>
      <div className="absolute left-[-20%] top-[-30%] h-48 w-48 rounded-full bg-crimson/15 blur-[70px]" />
    </div>
  );
}

function ProjectCard({
  project,
  index,
  featured = false,
}: {
  project: Project;
  index: number;
  featured?: boolean;
}) {
  const Wrapper = project.link ? "a" : "div";
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Wrapper
        {...(project.link
          ? { href: project.link, target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="hud-corners group flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-steel/60 backdrop-blur-sm transition-colors duration-300 hover:border-crimson/40"
      >
        {/* Imagen */}
        <div
          className={`relative w-full overflow-hidden ${
            featured ? "aspect-[21/9]" : "aspect-video"
          }`}
        >
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <Placeholder title={project.title} index={index} />
          )}
          {/* Velo degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
          {/* Categoría */}
          {project.category && (
            <span className="font-mono absolute left-4 top-4 rounded-md border border-crimson/40 bg-void/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-crimson-bright backdrop-blur-sm">
              {project.category}
            </span>
          )}
        </div>

        {/* Texto */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h3
              className={`font-display font-bold uppercase tracking-wide text-snow ${
                featured ? "text-xl" : "text-base"
              }`}
            >
              {project.title}
            </h3>
            <span className="font-mono shrink-0 text-xs text-ash transition-colors group-hover:text-crimson">
              /{String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-fog">{project.description}</p>
          {project.link && (
            <span className="font-mono mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-crimson-bright">
              Ver proyecto
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </span>
          )}
        </div>
      </Wrapper>
    </motion.div>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  const [first, ...rest] = projects;

  return (
    <section
      id="proyectos"
      className="relative scroll-mt-20 overflow-hidden border-t border-edge bg-carbon py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute right-[-12%] top-[-20%] h-96 w-96 rounded-full bg-crimson/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-25%] left-[-10%] h-80 w-80 rounded-full bg-blood/20 blur-[130px]" />
      <FloatingIcons
        icons={[
          { name: "globe", className: "right-[4%] top-[8%] h-28 w-28 text-crimson/10", duration: 10 },
          { name: "code", className: "left-[3%] top-[30%] h-24 w-24 text-snow/5", delay: 2.2, duration: 9 },
          { name: "rocket", className: "right-[8%] bottom-[6%] h-26 w-26 text-snow/5", delay: 4, duration: 11 },
        ]}
      />

      <div className="relative mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal>
          <div className="mb-16 flex items-end justify-between gap-6">
            <div>
              <p className="section-number mb-4">[ 04 / Proyectos ]</p>
              <h2 className="font-display max-w-2xl text-3xl font-bold uppercase leading-tight tracking-tight text-snow sm:text-5xl">
                Trabajo que <span className="text-stroke-crimson">habla por nosotros</span>
              </h2>
            </div>
            <div className="hairline-crimson hidden flex-1 lg:block" />
          </div>
        </Reveal>

        <div className="grid gap-6">
          {/* Proyecto destacado a ancho completo */}
          <Reveal>
            <ProjectCard project={first} index={0} featured />
          </Reveal>

          {/* Resto en rejilla */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((p, i) => (
                <Reveal key={p.id} delay={(i % 2) * 0.1}>
                  <ProjectCard project={p} index={i + 1} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
