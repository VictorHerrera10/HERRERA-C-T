import { createAvatar } from "@dicebear/core";
import { micah } from "@dicebear/collection";

/* Paleta de marca para el fondo del avatar por defecto — el mismo color
   siempre sale para el mismo seed, así cada persona tiene un avatar
   estable en toda la plataforma. */
const BRAND_BACKGROUNDS = ["D8112B", "3b82f6", "e8b33c", "1fce8c"];

const cache = new Map<string, string>();

/* Avatar ilustrado por defecto (estilo "micah" de DiceBear, generado
   localmente sin llamadas de red) para cuando el trabajador o cliente
   no subió su propia foto. Determinístico: el mismo nombre siempre
   produce el mismo avatar. */
export function defaultAvatarUrl(seed: string): string {
  const key = seed || "herrera";
  const cached = cache.get(key);
  if (cached) return cached;

  const svg = createAvatar(micah, {
    seed: key,
    backgroundColor: BRAND_BACKGROUNDS,
    radius: 16,
  }).toString();

  const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}
