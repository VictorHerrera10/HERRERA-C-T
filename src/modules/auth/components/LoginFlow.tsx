"use client";

/* Login del trabajador: DNI + contraseña (inicial = DNI).
   Primer ingreso → cambio de contraseña obligatorio → bienvenida en 3 actos. */

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";
import {
  login,
  changePassword,
  saveSession,
  getSession,
  type SessionUser,
} from "../lib/auth";
import { WelcomeSequence } from "./WelcomeSequence";
import { SessionCurtain } from "./SessionCurtain";

type Step = "login" | "change" | "welcome" | "enter";

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
};

export function LoginFlow() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("login");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Sesión activa → directo al inicio
  useEffect(() => {
    const s = getSession();
    if (s && !s.must_change_password) router.replace("/inicio");
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{8,}$/.test(dni.trim()))
      return toast.warning("DNI inválido", "Debe tener al menos 8 dígitos.");
    setBusy(true);
    try {
      const u = await login(dni.trim(), password);
      if (!u) {
        toast.error(
          "No pudimos ingresar",
          "DNI o contraseña incorrectos, o el usuario está inactivo."
        );
        return;
      }
      setUser(u);
      if (u.must_change_password) {
        setPassword("");
        setStep("change");
      } else {
        saveSession(u);
        setStep("enter"); // cortina animada y luego al inicio
      }
    } catch (err) {
      toast.error(
        "Error de conexión",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPass.length < 8)
      return toast.warning(
        "Contraseña muy corta",
        "Debe tener al menos 8 caracteres."
      );
    if (newPass === user.dni)
      return toast.warning("Elige otra contraseña", "No puede ser tu DNI.");
    if (newPass !== confirm)
      return toast.warning("Las contraseñas no coinciden");
    setBusy(true);
    try {
      const ok = await changePassword(user.id, user.dni, newPass);
      if (!ok) {
        toast.error("No se pudo cambiar la contraseña", "Intenta de nuevo.");
        return;
      }
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      saveSession(updated);
      setStep("welcome"); // el plus: bienvenida solo en el primer ingreso
    } catch (err) {
      toast.error(
        "Error de conexión",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setBusy(false);
    }
  }

  if (step === "welcome" && user)
    return <WelcomeSequence user={user} onDone={() => router.replace("/inicio")} />;

  if (step === "enter" && user)
    return (
      <SessionCurtain
        mode="in"
        name={user.first_name || user.dni}
        onDone={() => router.replace("/inicio")}
      />
    );

  return (
    <div className="grain relative flex min-h-screen overflow-hidden bg-void text-snow">
      <div className="tech-grid absolute inset-0 opacity-50" />
      <div className="scanline-layer" />

      {/* ── Panel de marca (desktop) ── */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-edge p-12 lg:flex">
        <FloatingIcons
          icons={[
            { name: "shield", className: "left-[8%] top-[18%] h-24 w-24 text-crimson/10", duration: 9 },
            { name: "chip", className: "right-[14%] top-[36%] h-16 w-16 text-azul/10", delay: 1.4 },
            { name: "server", className: "left-[22%] bottom-[22%] h-20 w-20 text-snow/6", delay: 2.2, duration: 10 },
            { name: "code", className: "right-[10%] bottom-[12%] h-24 w-24 text-crimson/8", delay: 0.8 },
          ]}
        />
        <div className="relative flex items-center gap-3">
          <div className="logo-badge h-11 w-11 p-2">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold">Herrera C&amp;T</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-gold-soft">
              Plataforma interna
            </p>
          </div>
        </div>

        <div className="relative">
          <p className="section-number mb-5">/ acceso del equipo</p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] xl:text-6xl">
            El trabajo
            <br />
            <span className="text-stroke">excelente</span>
            <br />
            empieza <span className="text-shimmer">aquí.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-fog">
            Un solo acceso para todos los módulos de la consultora: página
            web, cotizaciones, mesa de ayuda y los que vienen.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-ash">
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-esmeralda" />
          Plataforma operativa · uso exclusivo del equipo Herrera C&amp;T
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="relative flex w-full items-center justify-center px-6 py-14 lg:w-[480px] lg:shrink-0 xl:w-[560px]">
        <div className="w-full max-w-sm">
          {/* Logo en móvil */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="logo-badge h-10 w-10 p-1.5">
              <div className="relative h-full w-full">
                <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
              </div>
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Herrera C&amp;T</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-gold-soft">
                Plataforma interna
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.form
                key="login"
                {...slide}
                transition={{ duration: 0.45, ease: "easeOut" }}
                onSubmit={handleLogin}
                className="hud-corners rounded-2xl border border-edge bg-carbon/80 p-8 backdrop-blur"
              >
                <p className="section-number mb-2">/ ingreso</p>
                <h2 className="font-display text-2xl font-bold">Hola de nuevo.</h2>
                <p className="mt-2 text-sm text-fog">
                  Ingresa con tu DNI. Si es tu primera vez, tu contraseña es tu
                  mismo DNI.
                </p>

                <label className="mt-7 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                  DNI
                </label>
                <input
                  className="field-dark mt-2 font-mono tracking-widest"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  inputMode="numeric"
                  maxLength={12}
                  autoFocus
                />

                <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                  Contraseña
                </label>
                <input
                  className="field-dark mt-2"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <button
                  disabled={busy}
                  className="mt-7 w-full rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)] disabled:opacity-50"
                >
                  {busy ? "Verificando…" : "Ingresar"}
                </button>

                <p className="mt-5 text-center text-[11px] leading-relaxed text-ash">
                  ¿Sin acceso? El administrador de la plataforma crea las
                  cuentas del equipo.
                </p>
              </motion.form>
            )}

            {step === "change" && user && (
              <motion.form
                key="change"
                {...slide}
                transition={{ duration: 0.45, ease: "easeOut" }}
                onSubmit={handleChange}
                className="hud-corners rounded-2xl border border-edge bg-carbon/80 p-8 backdrop-blur"
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-gold-soft">
                  <Icon name="shield" className="h-3.5 w-3.5" />
                  Primer ingreso
                </div>
                <h2 className="font-display text-2xl font-bold">
                  Hola, {user.first_name || user.dni}.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fog">
                  Antes de continuar, crea tu contraseña personal. Dejarás de
                  usar tu DNI como clave.
                </p>

                <label className="mt-7 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                  Nueva contraseña
                </label>
                <input
                  className="field-dark mt-2"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />

                <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-fog">
                  Repítela
                </label>
                <input
                  className="field-dark mt-2"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Una vez más, para estar seguros"
                />

                <button
                  disabled={busy}
                  className="mt-7 w-full rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)] disabled:opacity-50"
                >
                  {busy ? "Guardando…" : "Crear contraseña y continuar"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
