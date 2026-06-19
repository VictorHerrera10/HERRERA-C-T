"use client";

/* Transición de entrada del contenido al navegar entre páginas.
   Se remonta con cada cambio de ruta (key = pathname): el contenido
   sube con desvanecimiento y desenfoque en vez de aparecer de golpe. */

import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 22, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
