"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/modules/shared/components/Badge";
import { Icon } from "@/modules/shared/components/Icon";

type VerificationResult =
  | {
      status: "valid";
      code: string;
      participantName: string;
      trainingName: string;
      issuingEntity: string;
      issueDate: string;
    }
  | {
      status: "revoked";
      code: string;
      participantName: string;
      trainingName: string;
      issuingEntity: string;
      issueDate: string;
      revocationReason: string;
    }
  | {
      status: "not_found";
      code: string;
    }
  | null;

const DEMO_PRESETS = [
  { code: "HZ-DEMO-VALIDO", label: "Demo Válido", tone: "esmeralda" as const },
  { code: "HZ-DEMO-ANULADO", label: "Demo Anulado", tone: "crimson" as const },
  { code: "HZ-NO-EXISTE", label: "No encontrado", tone: "neutral" as const },
];

export function CertificateVerifier() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult>(null);
  const [isPending, startTransition] = useTransition();

  // Permite verificar automáticamente si el código viene en la URL (?codigo=... o ?c=...)
  useEffect(() => {
    const queryCode = searchParams.get("codigo") || searchParams.get("c");
    if (queryCode && queryCode.trim()) {
      const sanitized = queryCode.trim();
      setCode(sanitized);
      handleVerify(sanitized);
    }
  }, [searchParams]);

  function handleVerify(rawCode?: string) {
    const targetCode = (typeof rawCode === "string" ? rawCode : code).trim();

    if (!targetCode) {
      setValidationError("Por favor ingresa un código de verificación.");
      setResult(null);
      return;
    }

    setValidationError(null);

    startTransition(() => {
      const normalized = targetCode.toUpperCase().replace(/\s+/g, "");

      if (normalized === "HZ-DEMO-VALIDO") {
        setResult({
          status: "valid",
          code: "HZ-DEMO-VALIDO",
          participantName: "Juan Pérez García",
          trainingName: "Fundamentos de Desarrollo de Software",
          issuingEntity: "Horizen Tecnología e Información",
          issueDate: "15 de marzo de 2026",
        });
      } else if (normalized === "HZ-DEMO-ANULADO") {
        setResult({
          status: "revoked",
          code: "HZ-DEMO-ANULADO",
          participantName: "Juan Pérez García",
          trainingName: "Fundamentos de Desarrollo de Software",
          issuingEntity: "Horizen Tecnología e Información",
          issueDate: "15 de marzo de 2026",
          revocationReason:
            "El certificado con este código figura con estado anulado en esta demostración. La revocación es ilustrativa y demuestra cómo se visualizan credenciales dadas de baja.",
        });
      } else {
        setResult({
          status: "not_found",
          code: targetCode,
        });
      }
    });
  }

  function handleQuickFill(sampleCode: string) {
    setCode(sampleCode);
    setValidationError(null);
    handleVerify(sampleCode);
  }

  function handleReset() {
    setCode("");
    setValidationError(null);
    setResult(null);
  }

  return (
    <div className="relative isolate overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* ── Resplandores y rejilla tecnológica de fondo ── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-crimson/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-72 w-72 rounded-full bg-azul/5 blur-[100px]" />

      <div className="mx-auto max-w-4xl px-5 lg:px-8">
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
        <div className="hud-corners relative mt-10 rounded-2xl border border-edge bg-carbon/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
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
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Ej. HZ-2026-A7K9-M2PX"
                    className={`font-mono w-full rounded-xl border bg-steel/90 py-3.5 pr-4 pl-11 text-sm tracking-wider text-snow placeholder:text-ash focus:outline-none focus:ring-2 transition-all ${
                      validationError
                        ? "border-crimson focus:ring-crimson/50"
                        : "border-edge focus:border-crimson/60 focus:ring-crimson/30"
                    }`}
                    aria-describedby="code-help-text code-error-text"
                    aria-invalid={Boolean(validationError)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {code && (
                    <button
                      type="button"
                      onClick={() => setCode("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ash hover:text-snow"
                      title="Borrar texto"
                      aria-label="Borrar texto"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-crimson px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_22px_rgba(216,17,43,0.45)] transition-all hover:bg-crimson-bright hover:shadow-[0_6px_28px_rgba(216,17,43,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-bright active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <Icon name="shield" className="h-4 w-4" />
                  <span>{isPending ? "Consultando..." : "Verificar certificado"}</span>
                </button>
              </div>

              {/* Mensaje de error de validación */}
              {validationError && (
                <p id="code-error-text" className="font-mono text-xs text-crimson-bright flex items-center gap-1.5 mt-1">
                  <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                  {validationError}
                </p>
              )}

              {/* Texto auxiliar requerido */}
              <p id="code-help-text" className="mt-2 text-xs text-ash flex items-center gap-1.5">
                <Icon name="info" className="h-3.5 w-3.5 shrink-0 text-fog" />
                También puedes acceder desde el código QR incluido en el diploma.
              </p>
            </div>
          </form>

          {/* ── Acceso rápido a códigos de prueba ── */}
          <div className="mt-6 border-t border-edge/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-fog">
                Códigos de prueba (demostración):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleQuickFill(preset.code)}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-edge bg-steel/80 px-2.5 py-1 text-[11px] font-mono text-fog transition-all hover:border-crimson/50 hover:bg-steel hover:text-snow cursor-pointer"
                    title={`Cargar código ${preset.code}`}
                  >
                    <span className="font-semibold text-snow">{preset.code}</span>
                    <span className="text-[10px] text-ash group-hover:text-fog">({preset.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Zona de Resultados Simulados (3 Estados) ── */}
        <div aria-live="polite" className="mt-8">
          <AnimatePresence mode="wait">
            {/* Estado A: Certificado Válido */}
            {result && result.status === "valid" && (
              <motion.div
                key="valid-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hud-corners relative overflow-hidden rounded-2xl border border-esmeralda/30 bg-carbon/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <div className="pointer-events-none absolute top-0 right-0 h-44 w-44 rounded-full bg-esmeralda/10 blur-[80px]" />

                <div className="relative">
                  {/* Encabezado del resultado */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-edge pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-esmeralda/15 text-esmeralda border border-esmeralda/30">
                        <Icon name="check" className="h-6 w-6" />
                      </div>
                      <div>
                        <Badge tone="esmeralda" pulse>
                          Certificado válido (demostración)
                        </Badge>
                        <p className="font-mono mt-1 text-[11px] text-fog">
                          Código consultado: <span className="font-semibold text-snow">{result.code}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="self-start sm:self-auto rounded-lg border border-edge px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-colors cursor-pointer"
                    >
                      Nueva consulta
                    </button>
                  </div>

                  {/* Campos del certificado */}
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Participante
                      </span>
                      <p className="font-display mt-1 text-base font-bold text-snow sm:text-lg">
                        {result.participantName}
                      </p>
                    </div>

                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Capacitación / Programa
                      </span>
                      <p className="font-display mt-1 text-base font-bold text-snow sm:text-lg">
                        {result.trainingName}
                      </p>
                    </div>

                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Entidad emisora
                      </span>
                      <p className="mt-1 text-sm font-medium text-snow">
                        {result.issuingEntity}
                      </p>
                    </div>

                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Fecha de emisión
                      </span>
                      <p className="font-mono mt-1 text-sm font-medium text-snow">
                        {result.issueDate}
                      </p>
                    </div>
                  </div>

                  {/* Nota aclaratoria de demostración */}
                  <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-edge/60 bg-steel/40 p-3.5 text-xs text-ash">
                    <Icon name="info" className="h-4 w-4 shrink-0 text-fog mt-0.5" />
                    <span>
                      <strong className="text-fog">Aviso ilustrativo:</strong> Este resultado corresponde a una
                      demostración de interfaz con datos simulados. No representa un registro en base de datos de producción.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Estado B: Certificado Anulado */}
            {result && result.status === "revoked" && (
              <motion.div
                key="revoked-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hud-corners relative overflow-hidden rounded-2xl border border-crimson/40 bg-carbon/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <div className="pointer-events-none absolute top-0 right-0 h-44 w-44 rounded-full bg-crimson/15 blur-[80px]" />

                <div className="relative">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-edge pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-crimson/15 text-crimson-bright border border-crimson/30">
                        <Icon name="alert" className="h-6 w-6" />
                      </div>
                      <div>
                        <Badge tone="crimson" pulse>
                          Certificado anulado (demostración)
                        </Badge>
                        <p className="font-mono mt-1 text-[11px] text-fog">
                          Código consultado: <span className="font-semibold text-snow">{result.code}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="self-start sm:self-auto rounded-lg border border-edge px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-colors cursor-pointer"
                    >
                      Nueva consulta
                    </button>
                  </div>

                  {/* Explicación y detalles del estado anulado */}
                  <div className="mt-5 rounded-xl border border-crimson/20 bg-blood/20 p-4 text-xs text-snow/90 leading-relaxed">
                    <p className="font-semibold text-crimson-bright mb-1 uppercase tracking-wide font-mono text-[11px]">
                      Aviso de revocación demostrativa:
                    </p>
                    <p>{result.revocationReason}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Entidad emisora
                      </span>
                      <p className="mt-1 text-sm font-medium text-snow">
                        {result.issuingEntity}
                      </p>
                    </div>
                    <div className="rounded-xl border border-edge/60 bg-steel/60 p-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">
                        Fecha de registro ilustrativa
                      </span>
                      <p className="font-mono mt-1 text-sm font-medium text-snow">
                        {result.issueDate}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Estado C: Código no encontrado */}
            {result && result.status === "not_found" && (
              <motion.div
                key="not-found-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="hud-corners relative overflow-hidden rounded-2xl border border-edge bg-carbon/95 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-edge bg-steel text-fog">
                  <Icon name="x" className="h-7 w-7 text-crimson-bright" />
                </div>

                <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-tight text-snow sm:text-xl">
                  No se encontró un certificado para el código ingresado en esta demostración
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-fog sm:text-sm">
                  El código <span className="font-mono font-semibold text-snow">"{result.code}"</span> no coincide con ninguno
                  de los registros de prueba configurados para esta maqueta interactiva.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("HZ-DEMO-VALIDO")}
                    className="rounded-lg bg-crimson px-4 py-2 text-xs font-bold uppercase tracking-wider text-snow hover:bg-crimson-bright transition-all cursor-pointer"
                  >
                    Probar con HZ-DEMO-VALIDO
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-edge px-4 py-2 text-xs font-mono uppercase tracking-wider text-fog hover:border-snow hover:text-snow transition-all cursor-pointer"
                  >
                    Intentar con otro código
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nota de arquitectura y privacidad futura ── */}
        <div className="mt-14 rounded-2xl border border-edge/60 bg-steel/40 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-steel p-2 text-crimson">
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
