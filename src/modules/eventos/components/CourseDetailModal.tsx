"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import type { Course } from "../lib/events";
import { getLinkedTemplate, formatHoursHuman } from "../lib/events";

const emptySubscribe = () => () => {};

export function CourseDetailModal({
  course,
  isOpen,
  onClose,
  onEdit,
}: {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (course: Course) => void;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Bloquear scroll de la página de fondo mientras el modal de detalle esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !course || !isClient) return null;

  const linkedTemplate = getLinkedTemplate(course);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-void/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative z-10 w-full max-w-3xl h-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] sm:h-[88vh] md:max-h-[780px] flex flex-col rounded-2xl border border-edge bg-carbon shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between gap-3 border-b border-edge px-4 sm:px-6 py-3.5 bg-steel/40">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-crimson-bright">
                  {course.code}
                </span>
                <Badge
                  tone={
                    course.status === "in_progress"
                      ? "azul"
                      : course.status === "completed"
                      ? "esmeralda"
                      : course.status === "scheduled"
                      ? "gold"
                      : "neutral"
                  }
                >
                  {course.status === "in_progress"
                    ? "En curso"
                    : course.status === "completed"
                    ? "Finalizado"
                    : course.status === "scheduled"
                    ? "Programado"
                    : course.status === "cancelled"
                    ? "Cancelado"
                    : "Borrador"}
                </Badge>
                <span className="text-xs font-mono text-fog uppercase">
                  {course.type.toUpperCase()}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg sm:text-xl font-bold text-snow line-clamp-2">
                {course.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/60 text-fog hover:text-snow hover:border-crimson/50 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
            {/* Descripción e Instructor */}
            <div className="space-y-3">
              <p className="text-sm text-snow/90 leading-relaxed">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-fog bg-steel/30 p-3 rounded-xl border border-edge/60">
                <div className="flex items-center gap-2">
                  <Icon name="user" className="h-4 w-4 text-crimson-bright shrink-0" />
                  <span>
                    <strong className="text-snow">Facilitador:</strong> {course.instructor}
                    {course.instructor_role ? ` (${course.instructor_role})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="tag" className="h-4 w-4 text-azul shrink-0" />
                  <span>
                    <strong className="text-snow">Categoría:</strong> {course.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadatos en Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-edge bg-carbon/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-fog">
                  <Icon name="clock" className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="text-[11px] font-medium">Horas académicas</span>
                </div>
                <p className="font-mono text-base font-bold text-snow">
                  {course.academic_hours} hrs ({course.sessions_count} sesiones)
                </p>
              </div>

              <div className="rounded-xl border border-edge bg-carbon/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-fog">
                  <Icon name="globe" className="h-3.5 w-3.5 text-azul shrink-0" />
                  <span className="text-[11px] font-medium">Modalidad</span>
                </div>
                <p className="text-base font-semibold text-snow capitalize">
                  {course.modality}
                </p>
              </div>

              <div className="rounded-xl border border-edge bg-carbon/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-fog">
                  <Icon name="users" className="h-3.5 w-3.5 text-esmeralda shrink-0" />
                  <span className="text-[11px] font-medium">Capacidad</span>
                </div>
                <p className="font-mono text-base font-bold text-snow">
                  {course.unlimited_capacity ? "Ilimitada" : `${course.max_capacity} cupos`}
                </p>
              </div>
            </div>

            {/* Fechas y Horarios */}
            <div className="rounded-xl border border-edge bg-steel/20 p-4 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-crimson-bright font-bold">
                Calendario de ejecución
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-ash block text-[11px]">Periodo:</span>
                  <p className="text-snow font-mono text-xs font-semibold">
                    {course.start_date || "Por definir"} al {course.end_date || "Por definir"}
                  </p>
                </div>
                <div>
                  <span className="text-ash block text-[11px]">Horario y frecuencia:</span>
                  <p className="text-snow text-xs font-medium">
                    {course.schedule_summary || "Horario flexible / por coordinar"}
                  </p>
                </div>
              </div>

              {/* Sesiones detalladas si existen */}
              {course.sessions && course.sessions.length > 0 && (
                <div className="pt-2 border-t border-edge/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-snow">
                      Cronograma de clases ({course.sessions.length} sesiones):
                    </span>
                    <Badge tone="azul">
                      {formatHoursHuman(course.academic_hours)} totales
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {course.sessions.map((s, i) => (
                      <div
                        key={s.date}
                        className="p-2 rounded-lg bg-carbon/60 border border-edge/60 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-snow">Clase #{i + 1}</span>
                            {s.is_custom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-azul/20 text-azul-bright border border-azul/30 font-semibold">
                                Excepción
                              </span>
                            )}
                          </div>
                          <span className="text-gold font-mono font-medium">
                            {formatHoursHuman(s.duration)}
                          </span>
                        </div>
                        <p className="text-fog font-mono">{s.date}</p>
                        <p className="text-ash text-[10px]">{s.start_time} - {s.end_time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ubicación / Plataforma según modalidad */}
            {(course.location || course.platform_link) && (
              <div className="rounded-xl border border-edge bg-steel/20 p-4 space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-azul font-bold">
                  Acceso y Entorno
                </span>
                {course.location && (
                  <p className="text-snow text-xs">
                    <strong className="text-fog">Sede / Aula:</strong> {course.location}
                  </p>
                )}
                {course.platform_link && (
                  <p className="text-snow text-xs truncate">
                    <strong className="text-fog">Enlace o plataforma:</strong>{" "}
                    <a
                      href={course.platform_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-azul hover:underline"
                    >
                      {course.platform_link}
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Objetivos de Aprendizaje */}
            {course.learning_objectives.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-snow font-bold">
                  Objetivos de aprendizaje ({course.learning_objectives.length})
                </span>
                <ul className="space-y-1.5 pl-1">
                  {course.learning_objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-fog">
                      <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requisitos de Asistencia y Evaluación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-1.5">
                <span className="font-mono text-[11px] text-fog uppercase font-bold block">
                  Asistencia
                </span>
                <p className="text-snow text-xs font-medium">
                  {course.attendance_mandatory
                    ? `Obligatoria (mínimo ${course.min_attendance_percentage}%)`
                    : "No obligatoria"}
                </p>
              </div>

              <div className="rounded-xl border border-edge bg-carbon/60 p-4 space-y-1.5">
                <span className="font-mono text-[11px] text-fog uppercase font-bold block">
                  Evaluación
                </span>
                <p className="text-snow text-xs font-medium">
                  {course.requires_evaluation
                    ? `Examen (nota mín. ${course.min_passing_grade}/20)`
                    : "Sin examen"}
                  {course.requires_final_project ? " • Requiere proyecto" : ""}
                </p>
              </div>
            </div>

            {/* Evento de Clausura */}
            {course.closing_event?.enabled && (
              <div className="rounded-xl border border-edge bg-steel/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="calendar" className="h-4 w-4 text-crimson-bright shrink-0" />
                  <span className="font-display text-xs font-bold text-snow">
                    Evento de Clausura: {course.closing_event.title || "Ceremonia final"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-fog text-xs pt-1">
                  <div>
                    <span className="text-ash block text-[11px]">Fecha y hora:</span>
                    <strong className="text-snow">
                      {course.closing_event.date} {course.closing_event.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ash block text-[11px]">Modalidad:</span>
                    <strong className="text-snow capitalize">
                      {course.closing_event.modality}
                    </strong>
                  </div>
                  <div>
                    <span className="text-ash block text-[11px]">Asistencia:</span>
                    <strong className="text-snow">
                      {course.closing_event.mandatory_attendance ? "Obligatoria" : "Opcional"}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Certificación Oficial */}
            <div className="rounded-xl border border-edge bg-carbon/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-gold font-bold">
                  Acreditación Oficial
                </span>
                <Badge tone={course.certification?.enabled ? "esmeralda" : "neutral"}>
                  {course.certification?.enabled ? "EMITE CERTIFICADO" : "SIN CERTIFICADO"}
                </Badge>
              </div>

              {course.certification?.enabled ? (
                linkedTemplate ? (
                  <div className="rounded-xl border border-edge bg-steel/40 p-3.5 space-y-1.5 mt-2">
                    <p className="font-display font-semibold text-snow text-sm">
                      {linkedTemplate.name}
                    </p>
                    <p className="text-xs text-fog italic">
                      &quot;{linkedTemplate.diploma_text}&quot;
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ash pt-1 border-t border-edge/60">
                      <span>
                        <strong>Emisor:</strong> {linkedTemplate.issuing_entity}
                      </span>
                      <span>
                        <strong>Firmante:</strong> {linkedTemplate.signatory_name} ({linkedTemplate.signatory_role})
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gold">
                    La plantilla asociada (ID: {course.certification.template_id}) no se encuentra disponible.
                  </p>
                )
              ) : (
                <p className="text-fog text-xs leading-relaxed">
                  Esta actividad formativa no emite certificado oficial de acreditación. Los participantes completan el programa sin diploma verificado externamente.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 border-t border-edge bg-carbon px-4 sm:px-6 py-3 sm:py-3.5">
            <span className="font-mono text-[11px] text-ash">
              Creado el {new Date(course.created_at).toLocaleDateString("es-PE")}
            </span>
            <div className="flex items-center gap-2.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(course);
                  }}
                  className="rounded-xl border border-edge bg-steel/60 px-3.5 sm:px-4 py-2 text-xs font-semibold text-fog hover:text-snow hover:border-gold/50 transition-colors cursor-pointer"
                >
                  Editar curso
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-crimson px-4 sm:px-5 py-2 text-xs font-bold text-snow hover:bg-crimson-bright transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
