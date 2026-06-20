"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CodexMessage } from "./codex-brain";
import { QUICK_CHIPS } from "./codex-brain";

/* ── Renderizador de texto con negrita y saltos de línea ── */
function RichText({ text }: { text: string }) {
  return (
    <span className="block">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <span key={i} className="block h-2" />;
        return (
          <span key={i} className="block leading-[1.65]">
            {line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="font-bold" style={{ color: "#f4f4f6" }}>
                  {p.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{p}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

type Props = {
  messages: CodexMessage[];
  isTyping: boolean;
  showChips: boolean;
  onChip: (query: string) => void;
  onSend: (text: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onClose: () => void;
};

export function CodexChat({
  messages, isTyping, showChips,
  onChip, onSend, inputValue, onInputChange, onClose,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.93 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit  ={{ opacity: 0, y: 20,  scale: 0.94 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className="flex flex-col overflow-hidden w-full"
      style={{
        height: "min(520px, calc(100dvh - 120px))",
        borderRadius: 20,
        background: "linear-gradient(170deg,#0e0f14 0%,#080a0d 100%)",
        border: "1px solid rgba(216,17,43,0.4)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.05)",
          "0 28px 72px rgba(0,0,0,0.8)",
          "0 0 48px rgba(216,17,43,0.14)",
          "inset 0 1px 0 rgba(255,255,255,0.06)",
        ].join(", "),
      }}
    >
      {/* Retícula de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow carmesí arriba */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0"
        style={{
          height: 120,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%,rgba(216,17,43,0.28) 0%,transparent 70%)",
        }}
      />

      {/* ══ HEADER ══ */}
      <div
        className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Avatar cuadrado redondeado */}
        <div className="relative shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center text-xl"
            style={{
              borderRadius: 11,
              background: "linear-gradient(145deg,#e8142e 0%,#42060e 100%)",
              border: "1px solid rgba(255,39,66,0.5)",
              boxShadow: "0 0 16px rgba(216,17,43,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            🤖
          </div>
          {/* Badge online */}
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full"
            style={{ background: "#08090c", padding: 2 }}
          >
            <span
              className="block h-full w-full rounded-full bg-esmeralda"
              style={{ boxShadow: "0 0 5px #1fce8c" }}
            />
          </span>
        </div>

        {/* Nombre + subtítulo */}
        <div className="min-w-0 flex-1">
          <p
            className="font-display font-extrabold uppercase text-snow"
            style={{ fontSize: 15, letterSpacing: "0.14em" }}
          >
            Codex
          </p>
          <p
            className="font-mono uppercase text-fog"
            style={{ fontSize: 9, letterSpacing: "0.2em" }}
          >
            Asistente · Herrera C&amp;T
          </p>
        </div>

        {/* Cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar chat"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ash transition-colors hover:bg-white/10 hover:text-snow"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
            <line x1="18" y1="6"  x2="6"  y2="18" />
            <line x1="6"  y1="6"  x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ══ MENSAJES ══ */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 py-4"
        style={{ scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 14, overflowAnchor: "none" }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex",
                flexDirection: msg.from === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              {/* Avatar Codex */}
              {msg.from === "codex" && (
                <div
                  className="flex items-center justify-center text-base"
                  style={{
                    width: 28, height: 28, minWidth: 28, borderRadius: 8, alignSelf: "flex-start", marginTop: 2,
                    background: "linear-gradient(145deg,#c01026 0%,#3a060b 100%)",
                    border: "1px solid rgba(216,17,43,0.45)",
                  }}
                >
                  🤖
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0, maxWidth: msg.from === "user" ? "78%" : "calc(100% - 36px)", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Burbuja */}
                <div
                  style={
                    msg.from === "user"
                      ? {
                          background: "linear-gradient(135deg,#d8112b 0%,#7a0c1a 100%)",
                          border: "1px solid rgba(255,39,66,0.45)",
                          borderRadius: "15px 15px 3px 15px",
                          padding: "10px 14px",
                          fontSize: 13.5,
                          color: "#f4f4f6",
                          boxShadow: "0 4px 18px rgba(216,17,43,0.3)",
                        }
                      : {
                          background: "rgba(255,255,255,0.055)",
                          border: "1px solid rgba(255,255,255,0.11)",
                          borderRadius: "15px 15px 15px 3px",
                          padding: "10px 14px",
                          fontSize: 13.5,
                          color: "#c8cdd6",
                          lineHeight: 1.6,
                        }
                  }
                >
                  <RichText text={msg.text} />
                </div>

                {/* CTAs */}
                {(msg.ctaLabel || msg.ctaLabel2) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingLeft: 2 }}>
                    {msg.ctaLabel && msg.ctaHref && (
                      <a
                        href={msg.ctaHref}
                        className="transition-all hover:scale-105 hover:brightness-110"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: "rgba(216,17,43,0.18)",
                          border: "1px solid rgba(216,17,43,0.5)",
                          color: "#ff2742",
                          textDecoration: "none",
                        }}
                      >
                        {msg.ctaLabel} →
                      </a>
                    )}
                    {msg.ctaLabel2 && msg.ctaHref2 && (
                      <a
                        href={msg.ctaHref2}
                        className="transition-all hover:scale-105"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          color: "#9ba0aa",
                          textDecoration: "none",
                        }}
                      >
                        {msg.ctaLabel2} →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing dots */}
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
            >
              <div
                className="flex items-center justify-center text-base"
                style={{
                  width: 28, height: 28, minWidth: 28, borderRadius: 8, alignSelf: "flex-start",
                  background: "linear-gradient(145deg,#c01026 0%,#3a060b 100%)",
                  border: "1px solid rgba(216,17,43,0.45)",
                }}
              >
                🤖
              </div>
              <div
                className="flex items-center gap-1.5"
                style={{
                  padding: "10px 16px", borderRadius: "15px 15px 15px 3px",
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.11)",
                }}
              >
                {[0, 0.18, 0.36].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.62, repeat: Infinity, delay }}
                    style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "rgba(216,17,43,0.75)" }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick chips en grid 2×2 */}
        <AnimatePresence>
          {showChips && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: 0.28 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, paddingTop: 4 }}
            >
              {QUICK_CHIPS.map((chip, i) => (
                <motion.button
                  key={chip.query}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.06 }}
                  onClick={() => onChip(chip.query)}
                  className="text-left transition-all hover:scale-[1.03]"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: "#9ba0aa",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(216,17,43,0.13)";
                    b.style.borderColor = "rgba(216,17,43,0.42)";
                    b.style.color = "#f4f4f6";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(255,255,255,0.04)";
                    b.style.borderColor = "rgba(255,255,255,0.09)";
                    b.style.color = "#9ba0aa";
                  }}
                >
                  {chip.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ══ INPUT ══ */}
      <div
        className="relative z-10 shrink-0 px-3 pb-3 pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-4 transition-all focus-within:border-crimson/50 focus-within:shadow-[0_0_0_1px_rgba(216,17,43,0.4)]"
          style={{
            padding: "8px 8px 8px 14px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
          }}
        >
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && inputValue.trim() && onSend(inputValue.trim())}
            placeholder="Escríbeme algo…"
            className="flex-1 bg-transparent text-snow outline-none"
            style={{ fontSize: 13.5 }}
          />
          <style>{`input::placeholder { color: #5c616c; }`}</style>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => inputValue.trim() && onSend(inputValue.trim())}
            disabled={!inputValue.trim()}
            aria-label="Enviar"
            className="flex shrink-0 items-center justify-center transition-all disabled:opacity-20"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: inputValue.trim()
                ? "linear-gradient(135deg,#d8112b 0%,#8a0f1e 100%)"
                : "rgba(255,255,255,0.07)",
              boxShadow: inputValue.trim() ? "0 4px 12px rgba(216,17,43,0.45)" : "none",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>

        <p
          className="mt-2 text-center font-mono uppercase text-ash"
          style={{ fontSize: 9, letterSpacing: "0.22em", opacity: 0.55 }}
        >
          Codex · Herrera C&amp;T
        </p>
      </div>
    </motion.div>
  );
}
