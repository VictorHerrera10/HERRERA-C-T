"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";
import { completeClientPasswordReset } from "../lib/auth";

const ease = [0.21, 0.6, 0.35, 1] as const;

/* Pantalla donde aterriza el enlace del correo de "olvidé mi
   contraseña". Supabase abre una sesión temporal solo válida para
   cambiar la contraseña (evento PASSWORD_RECOVERY); sin esa sesión no
   se puede definir la nueva. */
export function ClientPasswordReset() {
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8)
      return toast.warning("Contraseña muy corta", "Mínimo 8 caracteres.");
    if (password !== confirm)
      return toast.warning("Las contraseñas no coinciden");
    setBusy(true);
    try {
      const result = await completeClientPasswordReset(password);
      if (!result.ok) {
        toast.error("No se pudo actualizar", result.error);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/portal/cliente/panel"), 1800);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-5 py-16 text-snow">
      <div className="tech-grid absolute inset-0 opacity-40" />
      <div className="scanline-layer" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="logo-badge h-10 w-10 p-1.5">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Herrera C&amp;T</p>
            <p className="text-[9px] font-medium text-gold-soft">Portal de cliente</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="hud-corners rounded-2xl border border-edge bg-carbon/80 p-8 backdrop-blur"
        >
          {!ready ? (
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold">Enlace no válido</h1>
              <p className="mt-2 text-sm text-fog">
                Este enlace venció o ya se usó. Pide uno nuevo desde el ingreso.
              </p>
              <button
                onClick={() => router.push("/portal/cliente")}
                className="mt-7 w-full rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright"
              >
                Ir al ingreso
              </button>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-esmeralda/30 bg-esmeralda/10">
                <Icon name="check" className="h-5 w-5 text-esmeralda" />
              </div>
              <h1 className="font-display mt-4 text-2xl font-bold">Contraseña actualizada</h1>
              <p className="mt-1.5 text-sm text-fog">Entrando a tu panel…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 className="font-display text-2xl font-bold">Crea tu nueva contraseña</h1>
              <p className="mt-1.5 text-sm text-fog">Con esto entrarás la próxima vez.</p>

              <label className="mt-6 block text-xs font-semibold text-fog">
                Contraseña nueva
              </label>
              <input
                className="field-dark mt-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoFocus
              />
              <label className="mt-4 block text-xs font-semibold text-fog">
                Repítela
              </label>
              <input
                className="field-dark mt-2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />

              <button
                disabled={busy}
                className="mt-7 w-full rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)] disabled:opacity-50"
              >
                {busy ? "Guardando…" : "Guardar y entrar"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
