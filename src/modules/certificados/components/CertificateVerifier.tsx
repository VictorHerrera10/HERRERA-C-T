"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck,
  BadgeX,
  UserRound,
  GraduationCap,
  CalendarDays,
  Fingerprint,
  Building2,
  Loader2,
  RotateCw,
  WifiOff,
  X,
} from "lucide-react";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";

type CertificateData = {
  code: string;
  participantName?: string;
  trainingName?: string;
  issuingEntity?: string;
  issueDate?: string;
};

type VerificationResult =
  | {
      status: "valid";
      data: CertificateData;
    }
  | {
      status: "invalid";
      data: CertificateData;
    }
  | null;

type ActiveModalType = "invalid" | null;

export function CertificateVerifier() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement | null>(null);

  function triggerScrollToResults() {
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);
  }

  // Verifica automáticamente si el código viene en la URL (?codigo=... o ?c=...)
  useEffect(() => {
    const queryCode = searchParams.get("codigo") || searchParams.get("c");
    if (queryCode && queryCode.trim()) {
      const sanitized = queryCode.trim();
      setCode(sanitized);
      handleVerify(sanitized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Manejo de la tecla Escape y control de scroll de fondo para los modales
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && activeModal) {
        setActiveModal(null);
      }
    }
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeModal]);

  function handleVerify(rawCode?: string) {
    const targetCode = (typeof rawCode === "string" ? rawCode : code).trim();

    if (!targetCode) {
      setValidationError("Por favor ingresa un código de verificación.");
      setResult(null);
      setActiveModal(null);
      return;
    }

    setValidationError(null);
    setConnectionError(null);
    setIsLoading(true);

    // Simulación de respuesta asíncrona para feedback visual y prevención de solicitudes duplicadas
    setTimeout(() => {
      const normalized = targetCode.toUpperCase().replace(/\s+/g, "");

      // ── Caso 3: Error de Red o Conexión (Aviso discreto, sin modal invasivo) ──
      if (
        normalized === "HZ-ERROR-RED" ||
        normalized === "ERROR-TECNICO" ||
        normalized === "HZ-ERROR-CONEXION"
      ) {
        setConnectionError(
          "¡Ups! No logramos conectarnos con el servicio de validación. Comprueba tu conexión e inténtalo nuevamente."
        );
        setResult(null);
        setActiveModal(null);
        setIsLoading(false);
        return;
      }

      // Si la consulta responde con éxito, retiramos cualquier aviso de error previo
      setConnectionError(null);

      // ── Caso 1: Certificado Válido (SIN MODAL, desplazamiento suave directo) ──
      if (normalized === "HZ-DEMO-VALIDO") {
        setResult({
          status: "valid",
          data: {
            code: "HZ-DEMO-VALIDO",
            participantName: "Juan Pérez García",
            trainingName: "Fundamentos de Desarrollo de Software",
            issuingEntity: "Horizen Tecnología e Información",
            issueDate: "15 de marzo de 2026",
          },
        });
        setActiveModal(null);
        setIsLoading(false);
        triggerScrollToResults();
        return;
      }

      if (normalized.startsWith("HZ-SIM-")) {
        // Soporte para credenciales emitidas conceptualmente en la sesión
        setResult({
          status: "valid",
          data: {
            code: normalized,
            participantName: "Sofía Mendoza Morales",
            trainingName: "Arquitectura Cloud & DevOps",
            issuingEntity: "Horizen Tecnología e Información",
            issueDate: new Date().toLocaleDateString("es-PE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          },
        });
        setActiveModal(null);
        setIsLoading(false);
        triggerScrollToResults();
        return;
      }

      // ── Caso 2: Certificado Inválido (Modal de CERTIFICADO INVÁLIDO) ──
      // Unifica HZ-DEMO-ANULADO, HZ-NO-EXISTE y cualquier código no registrado
      setResult({
        status: "invalid",
        data: {
          code: targetCode,
        },
      });
      setActiveModal("invalid");
      setIsLoading(false);
    }, 550);
  }

  function handleReset() {
    setCode("");
    setValidationError(null);
    setConnectionError(null);
    setResult(null);
    setActiveModal(null);
    setIsLoading(false);
  }

  function handleCopyCode(textToCopy: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      toast.success("Código copiado al portapapeles", textToCopy);
    }
  }

  return (
    <div className="relative isolate overflow-hidden pt-24 pb-20 sm:pt-28 md:pt-36 md:pb-28">
      {/* ── Resplandores y rejilla tecnológica de fondo ── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-crimson/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-72 w-72 rounded-full bg-azul/5 blur-[100px]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Cabecera de la sección ── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-carbon/80 px-3.5 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse-dot" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-fog">
              Validación de Credenciales
            </span>
          </div>

          <h1 className="font-display mt-5 text-2xl font-black uppercase tracking-tight text-snow sm:text-4xl md:text-5xl">
            Verificación de{" "}
            <span className="text-shimmer">certificados</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fog sm:text-base">
            Comprueba la información y el estado de un certificado emitido por{" "}
            <span className="text-snow font-medium">Horizen</span> mediante su código de verificación.
          </p>
        </div>

        {/* ── Tarjeta del formulario de consulta ── */}
        <div className="hud-corners relative mt-8 sm:mt-10 rounded-2xl border border-edge bg-carbon/90 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="verification-code-input"
                className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-snow"
              >
                Código de verificación <span className="text-crimson">*</span>
              </label>

              <div className="relative flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ash">
                    <Icon name="shield" className="h-5 w-5" />
                  </div>
                  <input
                    id="verification-code-input"
                    type="text"
                    value={code}
                    disabled={isLoading}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Ingresa el código de tu certificado"
                    className={`font-mono w-full min-h-[48px] rounded-xl border bg-steel/90 py-3 pr-10 pl-11 text-sm tracking-wider text-snow placeholder:text-ash focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      validationError
                        ? "border-crimson focus:ring-crimson/50"
                        : "border-edge focus:border-crimson/60 focus:ring-crimson/30"
                    }`}
                    aria-describedby="code-help-text code-error-text code-connection-error"
                    aria-invalid={Boolean(validationError || connectionError)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {code && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setCode("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ash hover:text-snow"
                      title="Borrar texto"
                      aria-label="Borrar texto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Botón Principal: Transición adaptativa (VERIFICAR CERTIFICADO ↔ VOLVER A INTENTAR) con spinner circular */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-crimson px-6 py-3 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_22px_rgba(216,17,43,0.45)] transition-all hover:bg-crimson-bright hover:shadow-[0_6px_28px_rgba(216,17,43,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-bright active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span>Estamos verificando tu certificado…</span>
                    </>
                  ) : connectionError ? (
                    <>
                      <RotateCw className="h-4 w-4 shrink-0" />
                      <span>VOLVER A INTENTAR</span>
                    </>
                  ) : (
                    <>
                      <Icon name="shield" className="h-4 w-4 shrink-0" />
                      <span>VERIFICAR CERTIFICADO</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de error de validación de formulario (campo requerido) */}
              {validationError && (
                <p id="code-error-text" className="font-mono text-xs text-crimson-bright flex items-center gap-1.5 mt-1">
                  <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}

              {/* ── Aviso discreto de error de conexión (amigable, sin modal invasivo) ── */}
              <AnimatePresence>
                {connectionError && (
                  <motion.div
                    id="code-connection-error"
                    role="alert"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 flex items-start gap-2.5 rounded-xl border border-crimson/30 bg-crimson/10 p-3.5 text-xs text-snow/90 backdrop-blur-sm"
                  >
                    <WifiOff className="h-4 w-4 shrink-0 text-crimson-bright mt-0.5" />
                    <p className="leading-relaxed">
                      {connectionError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Texto auxiliar */}
              <p id="code-help-text" className="mt-2 text-xs text-ash flex items-center gap-1.5">
                <Icon name="info" className="h-3.5 w-3.5 shrink-0 text-fog" />
                <span>También puedes acceder automáticamente escaneando el código QR del diploma.</span>
              </p>
            </div>
          </form>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VENTANA EMERGENTE (MODAL) RESERVADA EXCLUSIVAMENTE PARA:
            - CERTIFICADO INVÁLIDO (HZ-DEMO-ANULADO / HZ-NO-EXISTE)
           ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeModal === "invalid" && result && result.status === "invalid" && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-invalido-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setActiveModal(null)}
                className="fixed inset-0 bg-void/90 backdrop-blur-md z-10"
                aria-hidden="true"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="hud-corners relative w-full max-w-md overflow-hidden rounded-2xl border border-crimson/50 bg-[#0b0c10] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] sm:p-7 z-20"
              >
                <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-crimson/20 blur-[60px]" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-crimson/15 text-crimson-bright border border-crimson/40 shadow-[0_0_20px_rgba(216,17,43,0.3)]">
                      <BadgeX className="h-7 w-7 text-crimson-bright stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-fog">
                        Resultado de verificación
                      </span>
                      <h3
                        id="modal-invalido-title"
                        className="font-display text-lg font-black uppercase tracking-wider text-crimson-bright"
                      >
                        CERTIFICADO INVÁLIDO
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg p-1.5 text-ash hover:bg-steel hover:text-snow transition-colors cursor-pointer"
                    aria-label="Cerrar ventana emergente"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-crimson/25 bg-blood/15 p-4 text-left">
                    <p className="text-sm font-medium text-snow leading-relaxed">
                      El código <span className="font-mono font-bold text-snow break-all">«{result.data.code}»</span> no corresponde a un certificado válido en Horizen TI.
                    </p>
                    <p className="mt-2 text-xs text-fog leading-relaxed">
                      La credencial consultada no cuenta con vigencia, autenticidad ni validez legal o académica por parte de la institución.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-3">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-fog flex items-center gap-1">
                        <Fingerprint className="h-3 w-3 text-crimson-bright shrink-0 stroke-[2]" />
                        <span>Código</span>
                      </span>
                      <p className="font-mono mt-1 text-xs font-bold text-snow truncate">
                        {result.data.code}
                      </p>
                    </div>

                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-3">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-fog flex items-center gap-1">
                        <BadgeX className="h-3 w-3 text-crimson-bright shrink-0 stroke-[2]" />
                        <span>Estado</span>
                      </span>
                      <p className="mt-1 flex items-center gap-1 font-bold text-crimson-bright text-xs">
                        <BadgeX className="h-3.5 w-3.5 shrink-0 stroke-[2]" />
                        <span>Inválido</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-steel border border-edge px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-snow hover:border-snow transition-all cursor-pointer"
                  >
                    <span>Entendido</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Sección de Resultados (Desplazamiento Directo para Certificado Válido) ── */}
        <section
          id="resultado-certificado"
          ref={resultsRef}
          tabIndex={-1}
          aria-live="polite"
          className="scroll-mt-24 sm:scroll-mt-28 focus:outline-none mt-8 sm:mt-10"
        >
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════
                ESTADO 1: CERTIFICADO VÁLIDO (Directo en página sin modal)
               ══════════════════════════════════════════════════════════════ */}
            {result && result.status === "valid" && (
              <motion.div
                key="valid-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hud-corners relative overflow-hidden rounded-2xl border border-esmeralda/40 bg-carbon/95 p-5 shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <div className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-esmeralda/15 blur-[90px]" />

                <div className="relative">
                  {/* Encabezado del resultado */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-edge pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-esmeralda/15 text-esmeralda border border-esmeralda/40 shadow-[0_0_25px_rgba(31,206,140,0.25)]">
                        <BadgeCheck className="h-8 w-8 sm:h-9 sm:w-9 text-esmeralda stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-esmeralda flex items-center gap-2">
                          <span>CERTIFICADO VÁLIDO</span>
                        </h2>
                        <p className="font-mono mt-0.5 text-xs text-fog flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-esmeralda shrink-0" />
                          <span>
                            Código verificado:{" "}
                            <span className="font-semibold text-snow">{result.data.code}</span>
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(result.data.code)}
                        className="rounded-lg border border-edge px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        title="Copiar código del certificado"
                      >
                        <Icon name="copy" className="h-3.5 w-3.5" />
                        <span>Copiar código</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-edge px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-colors cursor-pointer"
                      >
                        Nueva consulta
                      </button>
                    </div>
                  </div>

                  {/* ── Destacar especialmente al participante con tamaño considerablemente mayor ── */}
                  {result.data.participantName && (
                    <div className="mt-6 rounded-xl border border-esmeralda/35 bg-esmeralda/5 p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
                      <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-esmeralda/10 blur-[40px]" />
                      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-esmeralda">
                        <UserRound className="h-4 w-4 shrink-0 stroke-[2.2]" />
                        <span>Participante acreditado</span>
                      </div>
                      <p className="font-display mt-2 text-2xl font-black text-snow sm:text-3xl md:text-4xl tracking-tight break-words">
                        {result.data.participantName}
                      </p>
                    </div>
                  )}

                  {/* ── Datos disponibles del certificado con iconografía Lucide ── */}
                  <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {result.data.trainingName && (
                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-esmeralda shrink-0 stroke-[2]" />
                          <span>Capacitación / Actividad</span>
                        </span>
                        <p className="font-display mt-1.5 text-base font-bold text-snow sm:text-lg break-words">
                          {result.data.trainingName}
                        </p>
                      </div>
                    )}

                    {result.data.code && (
                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-esmeralda shrink-0 stroke-[2]" />
                          <span>Código de certificado</span>
                        </span>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <p className="font-mono text-sm font-bold text-snow tracking-wider break-all">
                            {result.data.code}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(result.data.code)}
                            className="shrink-0 rounded-lg p-1.5 text-ash hover:bg-steel hover:text-snow transition-colors cursor-pointer"
                            title="Copiar código"
                          >
                            <Icon name="copy" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {result.data.issueDate && (
                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-esmeralda shrink-0 stroke-[2]" />
                          <span>Fecha de emisión</span>
                        </span>
                        <p className="font-mono mt-1.5 text-sm font-medium text-snow">
                          {result.data.issueDate}
                        </p>
                      </div>
                    )}

                    {result.data.issuingEntity && (
                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-esmeralda shrink-0 stroke-[2]" />
                          <span>Entidad emisora</span>
                        </span>
                        <p className="mt-1.5 text-sm font-medium text-snow break-words">
                          {result.data.issuingEntity}
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 text-esmeralda shrink-0 stroke-[2]" />
                        <span>Estado de validación</span>
                      </span>
                      <div className="mt-1.5 flex items-center gap-1.5 font-bold text-esmeralda text-sm">
                        <BadgeCheck className="h-4 w-4 shrink-0 stroke-[2.2]" />
                        <span>Válido</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                ESTADO 2: CERTIFICADO INVÁLIDO (Persistente en página tras cerrar modal)
               ══════════════════════════════════════════════════════════════ */}
            {result && result.status === "invalid" && (
              <motion.div
                key="invalid-result-page"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hud-corners relative overflow-hidden rounded-2xl border border-crimson/50 bg-carbon/95 p-5 shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <div className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-crimson/15 blur-[90px]" />

                <div className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-edge pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-crimson/15 text-crimson-bright border border-crimson/40 shadow-[0_0_25px_rgba(216,17,43,0.3)]">
                        <BadgeX className="h-8 w-8 sm:h-9 sm:w-9 text-crimson-bright stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-crimson-bright">
                          CERTIFICADO INVÁLIDO
                        </h2>
                        <p className="font-mono mt-0.5 text-xs text-fog flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-crimson-bright shrink-0" />
                          <span>
                            Código consultado:{" "}
                            <span className="font-semibold text-snow">{result.data.code}</span>
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="self-start sm:self-auto rounded-lg border border-edge px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-colors cursor-pointer"
                    >
                      Nueva consulta
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-xl border border-crimson/25 bg-blood/15 p-5 text-center sm:text-left">
                      <p className="text-sm font-medium text-snow leading-relaxed">
                        El código <span className="font-mono font-bold text-snow break-all">«{result.data.code}»</span> no corresponde a un certificado válido en Horizen TI.
                      </p>
                      <p className="mt-2 text-xs text-fog leading-relaxed">
                        La credencial consultada no cuenta con vigencia, autenticidad ni validez legal o académica por parte de la institución.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-crimson-bright shrink-0 stroke-[2]" />
                          <span>Código consultado</span>
                        </span>
                        <p className="font-mono mt-1.5 text-sm font-bold text-snow tracking-wider break-all">
                          {result.data.code}
                        </p>
                      </div>

                      <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog flex items-center gap-1.5">
                          <BadgeX className="h-3.5 w-3.5 text-crimson-bright shrink-0 stroke-[2]" />
                          <span>Estado de validación</span>
                        </span>
                        <div className="mt-1.5 flex items-center gap-1.5 font-bold text-crimson-bright text-sm">
                          <BadgeX className="h-4 w-4 shrink-0 stroke-[2.2]" />
                          <span>Inválido</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-edge/60 bg-steel/40 p-4 text-xs text-ash">
                      <Icon name="info" className="h-4 w-4 shrink-0 text-fog mt-0.5" />
                      <p>
                        Recomendación: Verifica que el código coincida exactamente con el impreso en el documento (incluyendo guiones) o escanea directamente el código QR correspondiente.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Nota institucional de privacidad y seguridad ── */}
        <div className="mt-12 sm:mt-14 rounded-2xl border border-edge/60 bg-steel/40 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-steel p-2 text-crimson shrink-0">
              <Icon name="shield" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-snow">
                Políticas de Privacidad y Verificación Oficial
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-fog">
                La consulta pública de Horizen opera exclusivamente mediante el código alfanumérico o código QR
                único de cada diploma. No se solicita ni se expone DNI, fecha de nacimiento, correo electrónico u otra
                información personal privada del titular.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
