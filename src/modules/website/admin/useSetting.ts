"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import type { SaveState } from "./ui";

/** Carga y guarda una sección de contenido (fila de site_settings). */
export function useSetting<T>(key: string, fallback: T) {
  const toast = useToast();
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          if (data?.value) setValue(data.value as T);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  async function save() {
    setState("saving");
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    setState("idle");
    if (error)
      toast.error(
        "No se pudo guardar",
        `${error.message} — ¿Ejecutaste el SQL en Supabase?`
      );
    else toast.success("Cambios guardados");
  }

  return { value, setValue, loading, state, save };
}
