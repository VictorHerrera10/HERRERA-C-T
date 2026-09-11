"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  /** Si se da, se muestra el avatar de la persona (foto propia o
   *  ilustración por defecto) junto al nombre, en la lista y en el valor elegido. */
  avatarSeed?: string;
  avatarSrc?: string | null;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Estilo compacto para usarse en línea junto a botones (listas de acción rápida). */
  compact?: boolean;
};

/* Reemplazo del <select> nativo: el popup de <option> de un <select>
   sigue el color-scheme del sistema operativo, no nuestro CSS, así que
   en muchos equipos se ve blanco/básico sin importar el tema de la
   plataforma. Este componente dibuja su propio menú, con el mismo
   lenguaje visual que el resto (hud-corners, crimson, motion). */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  disabled,
  className = "",
  compact = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      const idx = Math.max(
        0,
        options.findIndex((o) => o.value === value)
      );
      setHighlight(idx);
    }
  }, [open, value, options]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${compact ? "w-auto" : "w-full"} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`field-dark flex items-center justify-between gap-2 text-left transition-colors ${
          compact ? "!w-auto !py-2 pr-3 text-xs" : ""
        } ${open ? "!border-crimson" : ""} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.avatarSeed && (
            <Avatar src={selected.avatarSrc} seed={selected.avatarSeed} size="xs" className="!h-5 !w-5 !rounded-md" />
          )}
          <span className={`truncate ${selected ? "text-snow" : "text-ash"}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <Icon
          name="chevron-down"
          className={`h-3.5 w-3.5 shrink-0 text-fog transition-transform duration-200 ${open ? "rotate-180 text-crimson-bright" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.21, 0.6, 0.35, 1] }}
            role="listbox"
            className="hud-corners absolute left-0 top-[calc(100%+6px)] z-50 max-h-64 w-full min-w-[12rem] overflow-y-auto rounded-xl border border-edge bg-carbon/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-md"
          >
            {options.length === 0 && (
              <li className="px-3 py-2.5 text-xs text-ash">Sin opciones</li>
            )}
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value || `__empty_${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    i === highlight ? "bg-crimson/15 text-snow" : "text-fog"
                  } ${isSelected ? "font-semibold text-snow" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {opt.avatarSeed && (
                      <Avatar src={opt.avatarSrc} seed={opt.avatarSeed} size="xs" className="!h-6 !w-6 !rounded-md" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-crimson-bright" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
