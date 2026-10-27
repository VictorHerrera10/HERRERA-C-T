"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { useToast } from "@/modules/shared/components/Toast";
import type { CertificateTemplate, CertificateStatus } from "../lib/templates";
import { DiplomaPreview } from "./DiplomaPreview";

type TemplateFormDraft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  issuing_entity: string;
  diploma_title: string;
  diploma_text: string;
  signatory_name: string;
  signatory_role: string;
  status: CertificateStatus;
  version: string;
  created_at?: string;
};

const DEFAULT_BLANK_DRAFT: TemplateFormDraft = {
  name: "",
  description: "",
  category: "Tecnología",
  issuing_entity: "Horizen Tecnología e Información",
  diploma_title: "Certificado de Aprobación",
  diploma_text:
    "Por haber completado y acreditado satisfactoriamente los requisitos académicos y prácticos del programa.",
  signatory_name: "Ing. Víctor Herrera",
  signatory_role: "Director de Tecnología — Horizen TI",
  status: "draft",
  version: "1.0",
};

const CATEGORIES = [
  "Tecnología",
  "Gestión",
  "Ciberseguridad",
  "Transformación Digital",
  "Cloud & DevOps",
  "Inteligencia Artificial",
];

export function TemplateFormModal({
  isOpen,
  initialTemplate,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initialTemplate: CertificateTemplate | null;
  onClose: () => void;
  onSave: (saved: CertificateTemplate, isNew: boolean) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<TemplateFormDraft>(DEFAULT_BLANK_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTemplate) {
      setDraft({
        id: initialTemplate.id,
        name: initialTemplate.name,
        description: initialTemplate.description,
        category: initialTemplate.category,
        issuing_entity: initialTemplate.issuing_entity,
        diploma_title: initialTemplate.diploma_title,
        diploma_text: initialTemplate.diploma_text,
        signatory_name: initialTemplate.signatory_name,
        signatory_role: initialTemplate.signatory_role,
        status: initialTemplate.status,
        version: initialTemplate.version,
        created_at: initialTemplate.created_at,
      });
    } else {
      setDraft(DEFAULT_BLANK_DRAFT);
    }
    setActiveTab("form");
    setErrors({});
    setIsSubmitting(false);
  }, [initialTemplate, isOpen]);

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

  const isEditing = Boolean(draft.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      newErrors.name = "El nombre de la plantilla es obligatorio.";
    }

    if (!draft.version.trim()) {
      newErrors.version = "La versión es obligatoria (ej. 1.0).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.warning("Faltan datos obligatorios", "Por favor revisa los campos señalados.");
      setActiveTab("form");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Simulación de guardado en el servicio local
      const { saveTemplate } = await import("../lib/templates");
      const { template, isNew } = saveTemplate({
        ...draft,
        name: trimmedName,
        description: draft.description.trim(),
        issuing_entity: draft.issuing_entity.trim() || "Horizen Tecnología e Información",
        diploma_title: draft.diploma_title.trim() || "Certificado de Aprobación",
        diploma_text: draft.diploma_text.trim(),
        signatory_name: draft.signatory_name.trim(),
        signatory_role: draft.signatory_role.trim(),
        version: draft.version.trim(),
      });

      toast.success(
        isNew ? "Plantilla creada" : "Plantilla actualizada",
        `"${template.name}" se guardó correctamente en el almacenamiento local.`
      );

      onSave(template, isNew);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al guardar la plantilla";
      toast.error("Error al guardar", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Objeto de plantilla simulado para la previsualización en vivo
  const livePreviewTemplate: CertificateTemplate = {
    id: draft.id || "preview-id",
    name: draft.name || "Nombre del Programa o Certificación",
    description: draft.description,
    category: draft.category,
    issuing_entity: draft.issuing_entity || "Horizen Tecnología e Información",
    diploma_title: draft.diploma_title || "Certificado de Aprobación",
    diploma_text: draft.diploma_text,
    signatory_name: draft.signatory_name,
    signatory_role: draft.signatory_role,
    status: draft.status,
    version: draft.version || "1.0",
    created_at: draft.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Fondo oscuro */}
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
          className="relative z-10 w-full max-w-3xl rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden my-8"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-edge px-6 py-4 bg-steel/40">
            <div>
              <h3 className="font-display text-lg font-bold text-snow">
                {isEditing ? "Editar plantilla de certificado" : "Nueva plantilla de certificado"}
              </h3>
              <p className="text-xs text-fog">
                {isEditing
                  ? "Modifica los parámetros visuales y de texto del diploma."
                  : "Configura una nueva plantilla para futuras emisiones de certificados."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector de pestañas formulario / vista previa */}
              <div className="inline-flex rounded-lg border border-edge bg-steel/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "form"
                      ? "bg-crimson text-snow"
                      : "text-fog hover:text-snow"
                  }`}
                >
                  Formulario
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-crimson text-snow"
                      : "text-fog hover:text-snow"
                  }`}
                >
                  Vista previa en vivo
                </button>
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
          </div>

          {/* Contenido del Modal */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[72vh] overflow-y-auto">
              {activeTab === "preview" ? (
                <div>
                  <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold-soft flex items-center gap-2">
                    <Icon name="info" className="h-4 w-4 shrink-0 text-gold" />
                    <span>
                      Esta es la previsualización en tiempo real con los valores ingresados en el formulario.
                    </span>
                  </div>
                  <DiplomaPreview template={livePreviewTemplate} />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Nombre y Versión */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3">
                      <label
                        htmlFor="tpl-name"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Nombre de la plantilla <span className="text-crimson">*</span>
                      </label>
                      <input
                        id="tpl-name"
                        type="text"
                        value={draft.name}
                        onChange={(e) => {
                          setDraft({ ...draft, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        placeholder="Ej. Fundamentos de Desarrollo de Software"
                        className={`field-dark mt-2 ${errors.name ? "border-crimson focus:ring-crimson" : ""}`}
                        required
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-crimson-bright font-mono">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="tpl-version"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Versión <span className="text-crimson">*</span>
                      </label>
                      <input
                        id="tpl-version"
                        type="text"
                        value={draft.version}
                        onChange={(e) => setDraft({ ...draft, version: e.target.value })}
                        placeholder="1.0"
                        className="field-dark mt-2 font-mono text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* Categoría y Estado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="tpl-category"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Categoría
                      </label>
                      <select
                        id="tpl-category"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                        className="field-dark mt-2"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="tpl-status"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Estado del ciclo de vida
                      </label>
                      <select
                        id="tpl-status"
                        value={draft.status}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            status: e.target.value as CertificateStatus,
                          })
                        }
                        className="field-dark mt-2"
                      >
                        <option value="draft">Borrador (en configuración)</option>
                        <option value="active">Activa (lista para emisión)</option>
                        <option value="inactive">Inactiva (archivada)</option>
                      </select>
                    </div>
                  </div>

                  {/* Descripción interna */}
                  <div>
                    <label
                      htmlFor="tpl-desc"
                      className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                    >
                      Descripción interna
                    </label>
                    <textarea
                      id="tpl-desc"
                      rows={2}
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      placeholder="Propósito del certificado, público objetivo o notas internas..."
                      className="field-dark mt-2"
                    />
                  </div>

                  {/* Contenido en diploma */}
                  <div className="rounded-xl border border-edge bg-steel/30 p-4 space-y-4">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-snow flex items-center gap-2">
                      <Icon name="certificate" className="h-4 w-4 text-crimson-bright" />
                      Configuración del diploma visual
                    </p>

                    <div>
                      <label
                        htmlFor="tpl-issuing"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Entidad emisora
                      </label>
                      <input
                        id="tpl-issuing"
                        type="text"
                        value={draft.issuing_entity}
                        onChange={(e) =>
                          setDraft({ ...draft, issuing_entity: e.target.value })
                        }
                        className="field-dark mt-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="tpl-diploma-title"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Título en el diploma
                      </label>
                      <input
                        id="tpl-diploma-title"
                        type="text"
                        value={draft.diploma_title}
                        onChange={(e) =>
                          setDraft({ ...draft, diploma_title: e.target.value })
                        }
                        placeholder="Ej. Certificado de Aprobación"
                        className="field-dark mt-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="tpl-diploma-text"
                        className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                      >
                        Texto descriptivo de la acreditación
                      </label>
                      <textarea
                        id="tpl-diploma-text"
                        rows={3}
                        value={draft.diploma_text}
                        onChange={(e) =>
                          setDraft({ ...draft, diploma_text: e.target.value })
                        }
                        placeholder="Por haber completado satisfactoriamente los requisitos..."
                        className="field-dark mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="tpl-signatory-name"
                          className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                        >
                          Nombre del firmante (opcional)
                        </label>
                        <input
                          id="tpl-signatory-name"
                          type="text"
                          value={draft.signatory_name}
                          onChange={(e) =>
                            setDraft({ ...draft, signatory_name: e.target.value })
                          }
                          placeholder="Ej. Ing. Víctor Herrera"
                          className="field-dark mt-2"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="tpl-signatory-role"
                          className="block text-xs font-semibold uppercase tracking-[0.16em] text-fog"
                        >
                          Cargo del firmante (opcional)
                        </label>
                        <input
                          id="tpl-signatory-role"
                          type="text"
                          value={draft.signatory_role}
                          onChange={(e) =>
                            setDraft({ ...draft, signatory_role: e.target.value })
                          }
                          placeholder="Ej. Director de Tecnología"
                          className="field-dark mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de formulario con botones de acción */}
            <div className="flex items-center justify-between border-t border-edge px-6 py-4 bg-steel/30">
              <span className="text-xs text-ash">
                * El nombre es obligatorio. Los cambios se guardan localmente.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-edge px-4 py-2.5 text-xs font-semibold text-fog hover:text-snow hover:bg-steel/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.45)] hover:bg-crimson-bright transition-all cursor-pointer disabled:opacity-50"
                >
                  <Icon name="check" className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? "Guardando..."
                      : isEditing
                      ? "Guardar cambios"
                      : "Crear plantilla"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
