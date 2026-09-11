"use client";

import { motion } from "motion/react";
import { Icon } from "./Icon";

export function StatCard({
  label,
  value,
  accent = "text-crimson-bright",
  icon,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] }}
      whileHover={{ y: -4 }}
      className="rounded-lg border border-edge bg-carbon/70 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-shadow hover:shadow-[0_10px_26px_rgba(0,0,0,0.3)]"
    >
      {icon && (
        <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/70">
          <Icon name={icon} className={`h-4 w-4 ${accent}`} />
        </span>
      )}
      <p className={`font-display text-4xl font-medium ${accent}`}>{value}</p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
        {label}
      </p>
    </motion.div>
  );
}
