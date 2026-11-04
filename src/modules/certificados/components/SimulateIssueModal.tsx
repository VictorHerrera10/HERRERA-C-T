"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import { useToast } from "@/modules/shared/components/Toast";
import type { CertificateTemplate } from "../lib/templates";
import { DiplomaPreview } from "./DiplomaPreview";

export function SimulateIssueModal({
  isOpen,
  templates,
  onClose,
}: {
  isOpen: boolean;
  templates: CertificateTemplate[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [participantName, setParticipantName] = useState("Sofía Mendoza Morales");
  const [issuedResult, setIssuedResult] = useState<{
    simulatedCode: string;
    issueDate: string;
    template: CertificateTemplate;
    participant: string;
  } | null>(null);

  // Seleccionar la primera plantilla activa por defecto
  useEffect(() => {
    if (templates.length > 0) {
      const activeOne = templates.find((t) => t.status === "active") || templates[0];
      setSelectedTemplateId(activeOne.id);
    }
    setIssuedResult(null);
    setParticipantName("Sofía Mendoza Morales");
  }, [isOpen, templates]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentTemplate) {
      toast.warning("Selecciona una plantilla para continuar");
      return;
    }
    const name = participantName.trim() || "Sofía Mendoza Morales";

    // Generar código simulado único de sesión
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const simulatedCode = `HZ-SIM-${randomHex}`;
    const today = new Date().toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    setIssuedResult({
      simulatedCode,
      issueDate: today,
      template: currentTemplate,
      participant: name,
    });

    toast.info(
      "Emisión conceptual generada",
      `Se generó la credencial simulada con código ${simulatedCode}.`
    );
  }

  function handleCopyCode() {
    if (!issuedResult) return;
    navigator.clipboard.writeText(issuedResult.simulatedCode);
    toast.success("Código copiado al portapapeles", issuedResult.simulatedCode);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Fondo oscurecido con desenfoque */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-void/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden my-8"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-edge px-6 py-4 bg-steel/40">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-carbon">
                <Icon name="sparkles" className="h-4 w-4 text-gold" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-snow">
                  Simulación conceptual de emisión
                </h3>
                <p className="text-xs text-fog">
                  Prueba el flujo de asignación de plantilla, generación de código y vista previa emitida.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-fog hover:text-snow hover:bg-steel/60 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {/* Aviso de entorno de demostración */}
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs text-gold-soft">
              <div className="flex items-start gap-2.5">
                <Icon name="info" className="h-4 w-4 shrink-0 text-gold mt-0.5" />
                <div>
                  <p className="font-semibold text-snow">
                    Demostración conceptual exclusiva de frontend
                  </p>
                  <p className="mt-1 leading-relaxed text-fog">
                    Esta acción es un prototipo interactivo para validar la experiencia de usuario. No almacena registros oficiales, no utiliza datos personales reales ni emite certificados legales.
                  </p>
                </div>
              </div>
            </div>

            {!issuedResult ? (
              /* Formulario de simulación */
              <form onSubmit={handleSimulate} className="space-y-5">
                <div>
                  <label
                    htmlFor="sim-template"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                  >
                    Selecciona una plantilla de certificado
                  </label>
                  <select
                    id="sim-template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="field-dark mt-2"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.status === "active" ? "Activa" : tpl.status === "draft" ? "Borrador" : "Inactiva"}) — v{tpl.version}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-participant"
                    className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                  >
                    Nombre ficticio de participante (demostración)
                  </label>
                  <input
                    id="sim-participant"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Ej. Sofía Mendoza Morales"
                    className="field-dark mt-2"
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-ash">
                    No solicite ni ingrese datos personales reales (sin DNI, teléfono ni correo).
                  </p>
                </div>

                {currentTemplate && (
                  <div className="rounded-xl border border-edge bg-steel/30 p-4 text-xs space-y-2">
                    <p className="font-mono uppercase text-ash tracking-wider">
                      Resumen de la plantilla seleccionada:
                    </p>
                    <p className="text-snow font-semibold">{currentTemplate.name}</p>
                    <p className="text-fog">{currentTemplate.diploma_text}</p>
                    <div className="flex gap-4 pt-1 text-ash text-[11px]">
                      <span>Categoría: {currentTemplate.category}</span>
                      <span>Firmante: {currentTemplate.signatory_name}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.45)] hover:bg-crimson-bright transition-all cursor-pointer"
                  >
                    <Icon name="sparkles" className="h-4 w-4" />
                    <span>Generar emisión de prueba</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Ficha de resultado de emisión simulada */
              <div className="space-y-6">
                <div className="rounded-xl border border-esmeralda/40 bg-esmeralda/10 p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone="esmeralda">Simulación generada</Badge>
                        <span className="font-mono text-xs text-ash">
                          {issuedResult.issueDate}
                        </span>
                      </div>
                      <h4 className="mt-2 font-display text-lg font-bold text-snow">
                        {issuedResult.participant}
                      </h4>
                      <p className="text-xs text-fog">
                        Programa: {issuedResult.template.name} • {issuedResult.template.category}
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ash">
                        Código simulado:
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-lg border border-edge bg-steel/90 px-3 py-1 font-mono text-sm font-bold text-snow">
                          {issuedResult.simulatedCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/70 text-fog hover:text-snow hover:bg-steel transition-colors cursor-pointer"
                          title="Copiar código"
                          aria-label="Copiar código"
                        >
                          <Icon name="copy" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-edge/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-fog">
                      ¿Quieres comprobar cómo responde el portal público con códigos de demostración?
                    </span>
                    <Link
                      href="/certificados?codigo=HZ-DEMO-VALIDO"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 font-semibold text-crimson-bright hover:underline"
                    >
                      <span>Abrir verificador público</span>
                      <Icon name="shield" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Vista previa del diploma generado */}
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-fog mb-3">
                    Representación visual del diploma emitido:
                  </p>
                  <DiplomaPreview
                    template={issuedResult.template}
                    participantName={issuedResult.participant}
                    sampleCode={issuedResult.simulatedCode}
                    sampleDate={issuedResult.issueDate}
                    isSimulatedInstance
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIssuedResult(null)}
                    className="inline-flex items-center gap-2 rounded-xl border border-edge px-4 py-2 text-xs font-semibold text-fog hover:text-snow hover:bg-steel/60 transition-colors cursor-pointer"
                  >
                    <span>← Realizar otra simulación</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-steel/80 px-4 py-2 text-xs font-semibold text-snow hover:bg-steel transition-colors cursor-pointer"
                  >
                    Finalizar revisión
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
