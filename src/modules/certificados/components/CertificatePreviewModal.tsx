"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import type { CertificateTemplate } from "../lib/templates";
import { DiplomaPreview } from "./DiplomaPreview";

export function CertificatePreviewModal({
  template,
  isOpen,
  onClose,
  onEdit,
  canEdit = false,
}: {
  template: CertificateTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (tpl: CertificateTemplate) => void;
  canEdit?: boolean;
}) {
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

  if (!isOpen || !template) return null;

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

        {/* Contenedor del Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden my-8"
        >
          {/* Cabecera del modal */}
          <div className="flex items-center justify-between border-b border-edge px-6 py-4 bg-steel/40">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-carbon">
                <Icon name="certificate" className="h-4 w-4 text-crimson-bright" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-snow">
                    {template.name}
                  </h3>
                  <Badge
                    tone={
                      template.status === "active"
                        ? "esmeralda"
                        : template.status === "draft"
                        ? "gold"
                        : "neutral"
                    }
                  >
                    {template.status === "active"
                      ? "Activa"
                      : template.status === "draft"
                      ? "Borrador"
                      : "Inactiva"}
                  </Badge>
                  <span className="font-mono text-[10px] text-fog">
                    v{template.version}
                  </span>
                </div>
                <p className="text-xs text-ash">
                  Categoría: {template.category} • Vista previa del diseño de diploma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(template);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-steel/80 px-3 py-1.5 text-xs font-semibold text-snow hover:border-crimson/50 hover:bg-steel transition-colors cursor-pointer"
                >
                  <Icon name="edit" className="h-3.5 w-3.5 text-fog" />
                  <span>Editar plantilla</span>
                </button>
              )}
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

          {/* Cuerpo: Representación visual del diploma */}
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <DiplomaPreview template={template} />

            {/* Ficha técnica resumida de la plantilla */}
            <div className="mt-6 rounded-xl border border-edge bg-steel/40 p-4">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-snow mb-3">
                Parámetros de configuración
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ash block">Entidad emisora:</span>
                  <span className="text-fog font-medium">{template.issuing_entity}</span>
                </div>
                <div>
                  <span className="text-ash block">Firmante asignado:</span>
                  <span className="text-fog font-medium">
                    {template.signatory_name} ({template.signatory_role})
                  </span>
                </div>
                <div>
                  <span className="text-ash block">Descripción interna:</span>
                  <span className="text-fog">{template.description}</span>
                </div>
                <div>
                  <span className="text-ash block">Última actualización:</span>
                  <span className="text-fog font-mono">
                    {new Date(template.updated_at).toLocaleString("es-PE")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de modal */}
          <div className="flex items-center justify-between border-t border-edge px-6 py-3.5 bg-steel/20 text-xs text-ash">
            <span>
              Vista previa para prototipo. Los datos en diploma corresponden a una muestra de demostración.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-edge px-4 py-1.5 text-xs text-snow hover:bg-steel transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
