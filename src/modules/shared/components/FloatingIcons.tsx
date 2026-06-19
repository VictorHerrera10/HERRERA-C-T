import { Icon } from "./Icon";

export type FloatingIconSpec = {
  name: string;
  /** Posición, tamaño y color con clases (ej. "left-[5%] top-[15%] h-28 w-28 text-crimson/10") */
  className: string;
  delay?: number;
  duration?: number;
};

/* Íconos temáticos flotando con transparencia en el fondo de una sección */
export function FloatingIcons({ icons }: { icons: FloatingIconSpec[] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`animate-float absolute ${ic.className}`}
          style={{
            animationDelay: `${ic.delay ?? 0}s`,
            animationDuration: `${ic.duration ?? 8}s`,
          }}
        >
          <Icon name={ic.name} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
