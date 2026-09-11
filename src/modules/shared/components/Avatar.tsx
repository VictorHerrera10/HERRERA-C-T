import { defaultAvatarUrl } from "../lib/avatar";

type AvatarProps = {
  /** Foto propia del usuario (avatar_url), si la subió. */
  src?: string | null;
  /** Nombre completo o identificador único — semilla del avatar por defecto. */
  seed: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  xs: "h-7 w-7 rounded-lg",
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-xl",
  lg: "h-16 w-16 rounded-2xl",
  xl: "h-24 w-24 rounded-2xl",
};

/* Foto de perfil con respaldo automático: si el usuario no subió su
   propia foto, se genera un avatar ilustrado estable (mismo seed →
   mismo avatar siempre) en vez de solo iniciales. Usar en cualquier
   lugar que muestre a un trabajador o cliente por nombre. */
export function Avatar({ src, seed, size = "md", className = "" }: AvatarProps) {
  const url = src || defaultAvatarUrl(seed);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`shrink-0 overflow-hidden border border-edge bg-steel object-cover ${SIZES[size]} ${className}`}
    />
  );
}
