type Tone = "neutral" | "crimson" | "gold" | "azul" | "esmeralda";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-steel text-fog", dot: "bg-ash" },
  crimson: { badge: "bg-crimson/10 text-[#ff8195]", dot: "bg-crimson" },
  gold: { badge: "bg-gold/15 text-gold-soft", dot: "bg-gold" },
  azul: { badge: "bg-azul/10 text-azul", dot: "bg-azul" },
  esmeralda: { badge: "bg-esmeralda/10 text-esmeralda", dot: "bg-esmeralda" },
};

export function Badge({
  children,
  tone = "neutral",
  pulse = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  pulse?: boolean;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${c.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${pulse ? "animate-pulse-dot" : ""}`} />
      {children}
    </span>
  );
}
