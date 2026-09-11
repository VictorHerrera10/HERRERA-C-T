"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { FloatingIcons } from "@/modules/shared/components/FloatingIcons";
import { useToast } from "@/modules/shared/components/Toast";
import {
  loginClient,
  registerClient,
  loadClientSession,
  requestClientPasswordReset,
} from "../lib/auth";

const ease = [0.21, 0.6, 0.35, 1] as const;

const PERKS = [
  {
    icon: "chart",
    accent: "text-esmeralda",
    ring: "border-esmeralda/25 bg-esmeralda/10",
    title: "Sigue cada etapa",
    body: "De requisitos a entrega, mira en qué punto exacto está tu proyecto.",
  },
  {
    icon: "rocket",
    accent: "text-gold-soft",
    ring: "border-gold/25 bg-gold/10",
    title: "Pide una cotización",
    body: "Describe lo que necesitas y recíbela sin llamadas ni idas y vueltas.",
  },
  {
    icon: "support",
    accent: "text-azul",
    ring: "border-azul/25 bg-azul/10",
    title: "Habla con tu consultor",
    body: "Un solo lugar para el historial de tu cuenta con Herrera C&T.",
  },
];

const STEPS = [
  { key: "identity", label: "Quién eres" },
  { key: "access", label: "Tu acceso" },
] as const;

export function ClientLogin() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [step, setStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadClientSession().then((c) => {
      if (!cancelled && c) router.replace("/portal/cliente/panel");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setStep(0);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.warning("Escribe tu correo primero");
    setBusy(true);
    try {
      const result = await requestClientPasswordReset(email.trim().toLowerCase());
      if (!result.ok) {
        toast.error("No se pudo enviar el correo", result.error);
        return;
      }
      setResetSent(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const client = await loginClient(email.trim().toLowerCase(), password);
      if (!client) {
        toast.error("No pudimos ingresar", "Correo o contraseña incorrectos.");
        return;
      }
      router.push("/portal/cliente/panel");
    } finally {
      setBusy(false);
    }
  }

  function goToAccessStep(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return toast.warning("Falta tu nombre");
    setStep(1);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8)
      return toast.warning("Contraseña muy corta", "Mínimo 8 caracteres.");
    setBusy(true);
    try {
      const result = await registerClient(
        email.trim().toLowerCase(),
        password,
        firstName.trim(),
        lastName.trim(),
        company.trim(),
        phone.trim()
      );
      if (!result.ok) {
        toast.error("No se pudo crear tu cuenta", result.error);
        return;
      }
      toast.success("¡Cuenta creada!", "Bienvenido a tu portal de cliente.");
      router.push("/portal/cliente/panel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-void text-snow lg:flex">
      <div className="tech-grid absolute inset-0 opacity-40" />
      <div className="scanline-layer" />

      <Link
        href="/login"
        className="group absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-edge bg-carbon/80 py-1.5 pl-1.5 pr-4 text-xs font-semibold text-fog backdrop-blur-md transition-colors hover:border-azul/40 hover:text-snow sm:right-6 sm:top-6"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-azul/15 text-azul transition-colors group-hover:bg-azul/25">
          <Icon name="shield" className="h-3.5 w-3.5" />
        </span>
        Soy del equipo
      </Link>

      {/* Panel narrativo */}
      <div className="relative z-10 hidden w-[44%] flex-col justify-between overflow-hidden border-r border-edge px-14 py-16 lg:flex xl:px-16">
        <FloatingIcons
          icons={[
            { name: "chip", className: "right-[-8%] top-[8%] h-40 w-40 text-crimson/8", duration: 11 },
            { name: "code", className: "right-[6%] bottom-[6%] h-16 w-16 text-azul/8", delay: 1.6, duration: 9 },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative flex items-center gap-3"
        >
          <div className="logo-badge h-11 w-11 p-2">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Herrera C&amp;T</p>
            <p className="text-[10px] font-medium text-gold-soft">Portal de cliente</p>
          </div>
        </motion.div>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="font-display max-w-md text-[2.6rem] font-extrabold leading-[1.05] tracking-tight xl:text-5xl"
          >
            Tu proyecto,
            <br />
            <span className="relative inline-block">
              siempre a la vista.
              <svg
                viewBox="0 0 300 10"
                className="absolute -bottom-1.5 left-0 h-2 w-[88%] text-crimson"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 6.5C70 2 160 2 298 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-6 max-w-sm text-[15px] leading-relaxed text-fog"
          >
            Un espacio propio para seguir tus cotizaciones y proyectos con
            Herrera C&amp;T, sin depender de correos ni llamadas.
          </motion.p>

          <div className="mt-10 flex flex-col gap-3">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.32 + i * 0.09, ease }}
                className="flex items-start gap-3.5 rounded-xl border border-edge/70 bg-carbon/40 px-4 py-3.5 backdrop-blur-sm"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${p.ring}`}
                >
                  <Icon name={p.icon} className={`h-4.5 w-4.5 ${p.accent}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-snow">{p.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-fog">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="relative flex items-center gap-2 text-xs text-ash"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-esmeralda shadow-[0_0_8px_rgba(31,206,140,0.7)]" />
          Consultora TI activa · nuevas cuentas se activan al instante
        </motion.div>
      </div>

      {/* Panel de formulario */}
      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
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

          {/* Selector deslizante */}
          <div className="relative mb-6 flex rounded-full border border-edge bg-carbon/70 p-1">
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-crimson shadow-[0_2px_14px_rgba(216,17,43,0.45)]"
              style={{ left: mode !== "register" ? 4 : "calc(50% + 0px)" }}
            />
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                mode === "login" ? "text-snow" : "text-fog hover:text-snow"
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                mode === "register" ? "text-snow" : "text-fog hover:text-snow"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <div className="hud-corners rounded-2xl border border-edge bg-carbon/80 p-8 backdrop-blur">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease }}
                  onSubmit={handleLogin}
                >
                  <h1 className="font-display text-2xl font-bold">Hola de nuevo</h1>
                  <p className="mt-1.5 text-sm text-fog">
                    Ingresa con el correo de tu cuenta.
                  </p>

                  <label className="mt-6 block text-xs font-semibold text-fog">
                    Correo
                  </label>
                  <input
                    className="field-dark mt-2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    autoFocus
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-fog">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setResetSent(false);
                      }}
                      className="text-xs text-fog transition-colors hover:text-crimson-bright"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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
                    {busy ? "Ingresando…" : "Ingresar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="mt-4 w-full text-center text-xs text-fog transition-colors hover:text-snow"
                  >
                    ¿Primera vez? <span className="text-crimson-bright">Crea tu cuenta</span>
                  </button>
                </motion.form>
              ) : mode === "forgot" ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease }}
                >
                  {resetSent ? (
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-esmeralda/30 bg-esmeralda/10">
                        <Icon name="check" className="h-5 w-5 text-esmeralda" />
                      </div>
                      <h1 className="font-display mt-4 text-2xl font-bold">Revisa tu correo</h1>
                      <p className="mt-1.5 text-sm text-fog">
                        Te enviamos un enlace a <span className="text-snow">{email}</span> para
                        crear una contraseña nueva.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="mt-7 w-full rounded-xl border border-edge py-3.5 text-sm font-semibold text-fog transition-colors hover:border-snow/25 hover:text-snow"
                      >
                        Volver a ingresar
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword}>
                      <h1 className="font-display text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
                      <p className="mt-1.5 text-sm text-fog">
                        Escribe tu correo y te mandamos un enlace para crear una nueva.
                      </p>

                      <label className="mt-6 block text-xs font-semibold text-fog">
                        Correo
                      </label>
                      <input
                        className="field-dark mt-2"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@empresa.com"
                        autoFocus
                      />

                      <button
                        disabled={busy}
                        className="mt-7 w-full rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)] disabled:opacity-50"
                      >
                        {busy ? "Enviando…" : "Enviar enlace"}
                      </button>

                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="mt-4 w-full text-center text-xs text-fog transition-colors hover:text-snow"
                      >
                        ← Volver a ingresar
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <div className="mb-6 flex items-center gap-2">
                    {STEPS.map((s, i) => (
                      <div key={s.key} className="flex flex-1 items-center gap-2">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                            i < step
                              ? "border-esmeralda bg-esmeralda/15 text-esmeralda"
                              : i === step
                                ? "border-crimson bg-crimson/15 text-crimson-bright"
                                : "border-edge text-ash"
                          }`}
                        >
                          {i < step ? <Icon name="check" className="h-3 w-3" /> : i + 1}
                        </div>
                        <span
                          className={`text-[11px] font-medium ${i === step ? "text-snow" : "text-ash"}`}
                        >
                          {s.label}
                        </span>
                        {i === 0 && (
                          <span className="mx-1 h-px flex-1 bg-edge" aria-hidden />
                        )}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 0 ? (
                      <motion.form
                        key="identity"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, ease }}
                        onSubmit={goToAccessStep}
                      >
                        <h1 className="font-display text-2xl font-bold">Cuéntanos de ti</h1>
                        <p className="mt-1.5 text-sm text-fog">Un par de datos para empezar.</p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-fog">
                              Nombres *
                            </label>
                            <input
                              className="field-dark mt-2"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-fog">
                              Apellidos
                            </label>
                            <input
                              className="field-dark mt-2"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>
                        <label className="mt-4 block text-xs font-semibold text-fog">
                          Empresa
                        </label>
                        <input
                          className="field-dark mt-2"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Opcional"
                        />
                        <label className="mt-4 block text-xs font-semibold text-fog">
                          Teléfono
                        </label>
                        <input
                          className="field-dark mt-2"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Opcional"
                        />

                        <button className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)]">
                          Continuar
                          <span aria-hidden>→</span>
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="access"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3, ease }}
                        onSubmit={handleRegister}
                      >
                        <h1 className="font-display text-2xl font-bold">Crea tu acceso</h1>
                        <p className="mt-1.5 text-sm text-fog">
                          Con esto entrarás la próxima vez.
                        </p>

                        <label className="mt-5 block text-xs font-semibold text-fog">
                          Correo *
                        </label>
                        <input
                          className="field-dark mt-2"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoFocus
                        />
                        <label className="mt-4 block text-xs font-semibold text-fog">
                          Contraseña *
                        </label>
                        <input
                          className="field-dark mt-2"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                        />

                        <div className="mt-7 flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setStep(0)}
                            className="rounded-xl border border-edge px-4 py-3.5 text-sm font-semibold text-fog transition-colors hover:border-ash hover:text-snow"
                          >
                            ←
                          </button>
                          <button
                            disabled={busy}
                            className="flex-1 rounded-xl bg-crimson py-3.5 font-display text-sm font-semibold uppercase tracking-wider transition-all hover:bg-crimson-bright hover:shadow-[0_0_30px_rgba(216,17,43,0.4)] disabled:opacity-50"
                          >
                            {busy ? "Creando…" : "Crear cuenta"}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="mt-4 w-full text-center text-xs text-fog transition-colors hover:text-snow"
                  >
                    ¿Ya tienes cuenta? <span className="text-crimson-bright">Ingresa</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ash transition-colors hover:text-fog"
          >
            <Icon name="x" className="h-3 w-3" />
            Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
