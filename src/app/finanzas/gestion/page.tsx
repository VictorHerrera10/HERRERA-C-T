"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { StatCard } from "@/modules/shared/components/StatCard";
import { EmptyState } from "@/modules/shared/components/EmptyState";
import { type ProjectIncome, type IncomeSummaryRow, money } from "@/modules/finanzas/lib/finanzas";

const ease = [0.21, 0.6, 0.35, 1] as const;

export default function FinanzasGestionPage() {
  const toast = useToast();
  const [income, setIncome] = useState<ProjectIncome[]>([]);
  const [summary, setSummary] = useState<IncomeSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    async function load() {
      const [i, s] = await Promise.all([
        supabase.rpc("hct_list_project_income"),
        supabase.rpc("hct_project_income_summary"),
      ]);
      if (i.error) {
        setLoadFailed(true);
        toast.error(
          "No se pudo cargar Finanzas",
          `${i.error.message} — ejecuta supabase/migration-finanzas-fase4.sql si falta.`
        );
      } else {
        setIncome((i.data as ProjectIncome[]) ?? []);
      }
      setSummary((s.data as IncomeSummaryRow[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = useMemo(() => income.length, [income]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <p className="section-number">/ ingresos</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-snow">Finanzas</h1>
        <p className="mt-1 text-sm text-fog">
          Ingresos registrados automáticamente al cerrar cada proyecto.
        </p>
      </motion.div>

      {/* Totales por moneda */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summary.map((s, i) => (
          <StatCard
            key={s.currency}
            label={`${s.count} ${s.count === 1 ? "proyecto" : "proyectos"} · ${s.currency}`}
            value={money(s.total, s.currency)}
            accent="text-esmeralda"
            delay={i * 0.08}
          />
        ))}
        {!loading && !summary.length && (
          <div className="col-span-2 lg:col-span-4">
            <EmptyState title="Aún no hay ingresos registrados." />
          </div>
        )}
      </div>

      {/* Lista de ingresos */}
      <div className="mt-8 space-y-2.5">
        <AnimatePresence initial={false}>
          {income.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.03, ease } }}
              className="flex items-center gap-4 rounded-lg border border-edge bg-carbon/70 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-snow">
                  {row.reference || "Ingreso de proyecto"}
                </p>
                <p className="mt-0.5 text-xs text-fog">
                  {new Date(row.income_date + "T00:00:00").toLocaleDateString("es", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="font-display shrink-0 text-lg font-semibold text-esmeralda">
                {money(row.amount, row.currency)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && !totalCount && !loadFailed && (
          <EmptyState
            icon="banknote"
            title="Aún no hay ingresos"
            description="Se registran automáticamente cuando un cliente firma la conformidad final de su proyecto."
          />
        )}
      </div>
    </div>
  );
}
