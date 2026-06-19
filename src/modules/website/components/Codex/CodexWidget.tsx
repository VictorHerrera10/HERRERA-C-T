"use client";

import { useState, useCallback, useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CodexChat } from "./CodexChat";
import { CODEX_GREETING, getCodexResponse, type CodexMessage } from "./codex-brain";

export function CodexWidget() {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CodexMessage[]>([
    { id: `${baseId}-0`, ...CODEX_GREETING },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [msgCount, setMsgCount] = useState(1);

  const showChips = messages.length <= 1 && !isTyping;

  const pushUserAndRespond = useCallback(
    (text: string) => {
      const uid = msgCount;
      setMessages((prev) => [
        ...prev,
        { id: `${baseId}-u-${uid}`, from: "user", text },
      ]);
      setInputValue("");
      setMsgCount((c) => c + 1);
      setIsTyping(true);

      const delay = 650 + Math.random() * 380;
      setTimeout(() => {
        const response = getCodexResponse(text);
        setMessages((prev) => [
          ...prev,
          { id: `${baseId}-c-${uid}`, ...response },
        ]);
        setIsTyping(false);
        setMsgCount((c) => c + 1);
      }, delay);
    },
    [baseId, msgCount]
  );

  return (
    <div
      className="fixed z-50"
      style={{ bottom: 24, right: 24 }}
    >
      {/* ── Panel del chat — abre hacia arriba sobre el botón ── */}
      <AnimatePresence>
        {open && (
          <div style={{ position: "absolute", bottom: 72, right: 0 }}>
            <CodexChat
              messages={messages}
              isTyping={isTyping}
              showChips={showChips}
              onChip={pushUserAndRespond}
              onSend={pushUserAndRespond}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Label flotante "Codex · en línea" — visible cuando cerrado ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ delay: 1.4, duration: 0.35 }}
            className="pointer-events-none absolute right-16 top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5"
            style={{
              background: "rgba(8,9,12,0.92)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-esmeralda shadow-[0_0_6px_#1fce8c]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
              Codex · en línea
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón principal ── */}
      <div className="relative">
        {/* Anillos de pulso cuando cerrado */}
        {!open && (
          <>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                animation: "ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
                background: "rgba(216,17,43,0.35)",
              }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{
                animation: "ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite",
                animationDelay: "0.7s",
                background: "rgba(216,17,43,0.18)",
              }}
            />
          </>
        )}

        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          aria-label={open ? "Cerrar chat Codex" : "Abrir chat Codex"}
          className="relative flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: open
              ? "linear-gradient(135deg, #3d0510 0%, #d8112b 100%)"
              : "linear-gradient(135deg, #d8112b 0%, #6b0f1c 100%)",
            boxShadow: open
              ? "0 8px 32px rgba(216,17,43,0.35)"
              : "0 8px 36px rgba(216,17,43,0.55), 0 0 0 1px rgba(255,39,66,0.25)",
            transition: "box-shadow 0.3s ease, background 0.3s ease",
          }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.svg
                key="close"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </motion.svg>
            ) : (
              <motion.span
                key="robot"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-2xl"
                role="img"
                aria-hidden
              >
                🤖
              </motion.span>
            )}
          </AnimatePresence>

          {/* Punto online */}
          <span
            className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
            style={{
              background: "#08090c",
              border: "2px solid #08090c",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-esmeralda shadow-[0_0_6px_#1fce8c]" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
