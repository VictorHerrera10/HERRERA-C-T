import type { MarqueeContent } from "@/modules/website/lib/content";

/* Doble cinta: banda carmesí inclinada + banda outline en sentido contrario */
export function Marquee({ content }: { content: MarqueeContent }) {
  const items = [...content.items, ...content.items, ...content.items];

  return (
    <div className="relative -my-6 overflow-hidden py-10">
      {/* Banda carmesí */}
      <div className="rotate-[-1.6deg] scale-[1.02] bg-crimson py-3.5 shadow-[0_0_60px_rgba(216,17,43,0.45)]">
        <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-snow">
                {item}
              </span>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-snow/80">
                <path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" />
              </svg>
            </span>
          ))}
        </div>
      </div>

      {/* Banda outline en dirección contraria */}
      <div className="rotate-[-1.6deg] scale-[1.02] border-b border-edge bg-void py-3">
        <div className="animate-marquee-reverse flex w-max items-center gap-12 whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="font-display text-stroke text-sm font-bold uppercase tracking-[0.14em]">
                {item}
              </span>
              <span className="font-mono text-[10px] text-crimson">///</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
