"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { StatCard } from "@/modules/shared/components/StatCard";
import { EmptyState } from "@/modules/shared/components/EmptyState";
import { Badge } from "@/modules/shared/components/Badge";
import {
  type ClientProject,
  type ProjectStage,
  PROJECT_STAGE,
  PROJECT_STAGE_ORDER,
  projectCode,
} from "@/modules/projects/lib/projects";

const ease = [0.21, 0.6, 0.35, 1] as const;

type Filter = "todas" | ProjectStage;

export default function ProyectosGestionPage() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todas");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("hct_list_projects");
      if (error)
        toast.error(
          "No se pudo cargar el módulo",
          `${error.message} — ejecuta supabase/migration-proyectos-fase2.sql si falta.`
        );
      else setProjects((data as ClientProject[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const byStage = (s: ProjectStage) => projects.filter((p) => p.stage === s);
    return {
      requisitos: byStage("requisitos").length,
      desarrollo: byStage("desarrollo").length,
      gerencia: byStage("gerencia").length,
      cerrados: byStage("cerrado").length,
    };
  }, [projects]);

  const visible = useMemo(() => {
    if (filter === "todas") return projects;
    return projects.filter((p) => p.stage === filter);
  }, [projects, filter]);

  const cards = [
    { label: "Requisitos", value: stats.requisitos, accent: "text-gold-soft" },
    { label: "En desarrollo", value: stats.desarrollo, accent: "text-azul" },
    { label: "En gerencia", value: stats.gerencia, accent: "text-[#a5a8fb]" },
    { label: "Cerrados", value: stats.cerrados, accent: "text-esmeralda" },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="section-number">/ ejecución</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-snow">Proyectos</h1>
        <p className="mt-1 text-sm text-fog">
          Ejecución de proyectos aprobados: requisitos, desarrollo y conformidad final.
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={loading ? "—" : c.value}
            accent={c.accent}
            delay={i * 0.08}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-8 flex flex-wrap items-center gap-2"
      >
        {(
          [{ key: "todas" as Filter, label: "Todas" }].concat(
            PROJECT_STAGE_ORDER.map((s) => ({ key: s as Filter, label: PROJECT_STAGE[s].label }))
          )
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              filter === f.key ? "text-snow" : "text-fog hover:bg-steel hover:text-snow"
            }`}
          >
            {filter === f.key && (
              <motion.span
                layoutId="pfilter-pill"
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 rounded-lg bg-crimson"
              />
            )}
            <span className="relative">{f.label}</span>
          </button>
        ))}
      </motion.div>

      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.button
              key={p.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.04, ease } }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              whileHover={{ x: 4 }}
              onClick={() => router.push(`/proyectos/gestion/${p.id}`)}
              className="group flex w-full items-center gap-4 rounded-lg border border-edge bg-carbon/70 p-4 text-left transition-colors hover:border-snow/20"
            >
              <span className="font-mono hidden shrink-0 text-xs text-fog sm:block">
                {projectCode(p.project_no)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-snow">{p.title || "Sin título"}</p>
                <p className="mt-0.5 truncate text-xs text-fog">
                  {p.client_name || "Sin cliente"}
                </p>
              </div>
              <Badge
                tone={
                  p.stage === "cerrado"
                    ? "esmeralda"
                    : p.stage === "desarrollo"
                      ? "azul"
                      : p.stage === "gerencia"
                        ? "neutral"
                        : "gold"
                }
              >
                {PROJECT_STAGE[p.stage].label}
              </Badge>
              <span className="text-ash transition-transform duration-200 group-hover:translate-x-1 group-hover:text-crimson-bright">
                →
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        {!loading && !visible.length && (
          <EmptyState
            title={
              projects.length
                ? "Ningún proyecto coincide con el filtro."
                : "Aún no hay proyectos."
            }
            description={
              !projects.length
                ? "Se crean al confirmar una cotización aprobada."
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
