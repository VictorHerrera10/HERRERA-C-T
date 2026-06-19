"use client";

/* Notificaciones emergentes de toda la plataforma (trabajadores y clientes).
   Montado una sola vez en el layout raíz; cualquier componente cliente usa:

     const toast = useToast();
     toast.success("Perfil actualizado");
     toast.error("No se pudo guardar", "detalle opcional");

   Diseño oscuro tipo vidrio que funciona sobre los temas claro y oscuro. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "./Icon";

type Kind = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  kind: Kind;
  title: string;
  description?: string;
  duration: number;
};

type ToastApi = {
  push: (kind: Kind, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
};

const STYLE: Record<
  Kind,
  { icon: string; chip: string; bar: string; glow: string }
> = {
  success: {
    icon: "check",
    chip: "bg-esmeralda/15 text-esmeralda border-esmeralda/30",
    bar: "bg-esmeralda",
    glow: "0 8px 32px rgba(31,206,140,0.18)",
  },
  error: {
    icon: "x",
    chip: "bg-crimson/15 text-[#ff8195] border-crimson/40",
    bar: "bg-crimson-bright",
    glow: "0 8px 32px rgba(216,17,43,0.22)",
  },
  info: {
    icon: "info",
    chip: "bg-azul/15 text-azul border-azul/30",
    bar: "bg-azul",
    glow: "0 8px 32px rgba(59,130,246,0.18)",
  },
  warning: {
    icon: "alert",
    chip: "bg-gold/15 text-gold-soft border-gold/30",
    bar: "bg-gold",
    glow: "0 8px 32px rgba(232,179,60,0.18)",
  },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requiere <ToastProvider> en el layout raíz");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, title: string, description?: string) => {
      const id = nextId.current++;
      const duration = kind === "error" ? 7000 : 4500;
      setItems((list) => [...list.slice(-4), { id, kind, title, description, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
      warning: (t, d) => push("warning", t, d),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Pila de toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[370px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 sm:right-5 sm:top-5">
        <AnimatePresence mode="popLayout">
          {items.map((t) => {
            const s = STYLE[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 72, scale: 0.94, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 56, scale: 0.94, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="pointer-events-auto relative overflow-hidden rounded-xl border border-snow/12 bg-carbon/92 backdrop-blur-md"
                style={{ boxShadow: s.glow }}
              >
                <div className="flex items-start gap-3 px-4 py-3.5 pr-10">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${s.chip}`}
                  >
                    <Icon name={s.icon} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-snow">
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="mt-1 text-xs leading-relaxed text-fog">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Cerrar"
                  className="absolute right-2 top-2 rounded-md p-1.5 text-ash transition-colors hover:bg-snow/8 hover:text-snow"
                >
                  <Icon name="x" className="h-3 w-3" />
                </button>

                {/* Barra de vida */}
                <motion.span
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-[2px] ${s.bar} opacity-70`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
