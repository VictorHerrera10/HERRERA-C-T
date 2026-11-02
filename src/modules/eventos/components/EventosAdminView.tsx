"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import { StatCard } from "@/modules/shared/components/StatCard";
import { EmptyState } from "@/modules/shared/components/EmptyState";
import { useToast } from "@/modules/shared/components/Toast";
import {
  loadCoursesFromStorage,
  deleteCourse,
  updateCourseStatus,
  calculateCourseStats,
  getLinkedTemplate,
  type Course,
  type CourseStatus,
} from "../lib/events";
import { CourseFormModal } from "./CourseFormModal";
import { CourseDetailModal } from "./CourseDetailModal";

export function EventosAdminView() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [certFilter, setCertFilter] = useState("all");

  // Modales
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<Course | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Carga inicial
  useEffect(() => {
    setCourses(loadCoursesFromStorage());
  }, []);

  // Estadísticas dinámicas
  const stats = useMemo(() => {
    return calculateCourseStats(courses);
  }, [courses]);

  // Cursos filtrados
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const matchesModality = modalityFilter === "all" || c.modality === modalityFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesCert =
        certFilter === "all" ||
        (certFilter === "with_cert" && c.certification?.enabled) ||
        (certFilter === "no_cert" && !c.certification?.enabled);

      return matchesSearch && matchesModality && matchesStatus && matchesCert;
    });
  }, [courses, searchQuery, modalityFilter, statusFilter, certFilter]);

  // Guardado exitoso desde el formulario
  function handleSaveCourse(saved: Course, isNew: boolean) {
    if (isNew) {
      setCourses((prev) => [saved, ...prev]);
    } else {
      setCourses((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    }
  }

  // Cambio rápido de estado
  function handleStatusChange(course: Course, nextStatus: CourseStatus) {
    const updated = updateCourseStatus(course.id, nextStatus);
    if (updated) {
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      toast.info(
        "Estado actualizado",
        `"${course.title}" cambió a estado ${nextStatus.toUpperCase()}.`
      );
    }
  }

  // Eliminación con confirmación
  function handleDeleteCourse(course: Course) {
    if (
      window.confirm(
        `¿Confirmas la eliminación del curso "${course.title}" (${course.code})? Esta acción no se puede deshacer.`
      )
    ) {
      const ok = deleteCourse(course.id);
      if (ok) {
        setCourses((prev) => prev.filter((c) => c.id !== course.id));
        toast.success("Curso eliminado", `Se eliminó "${course.title}".`);
      } else {
        toast.error("Error", "No se pudo eliminar el curso.");
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Encabezado y Contexto ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="section-number">/ eventos / gestión</p>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-snow">
            Eventos y Formación
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fog">
            Administra los cursos, talleres y programas de capacitación de Horizen TI, define sus modalidades y vincula los certificados oficiales de acreditación.
          </p>
        </div>

        {/* Acciones principales del encabezado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/certificados/gestion"
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-steel/80 px-4 py-2.5 text-xs font-semibold text-snow hover:border-gold/50 hover:bg-steel transition-all cursor-pointer"
          >
            <Icon name="certificate" className="h-4 w-4 text-gold" />
            <span>Plantillas de certificados</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setFormCourse(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.45)] hover:bg-crimson-bright transition-all cursor-pointer"
          >
            <Icon name="plus" className="h-4 w-4" />
            <span>+ Nuevo curso / actividad</span>
          </button>
        </div>
      </div>

      {/* ── Indicadores Resumidos Dinámicos ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total actividades"
          value={stats.total}
          icon="calendar"
          accent="text-crimson-bright"
          delay={0.05}
        />
        <StatCard
          label="En curso / progreso"
          value={stats.in_progress}
          icon="chart"
          accent="text-azul"
          delay={0.1}
        />
        <StatCard
          label="Programados"
          value={stats.scheduled}
          icon="clock"
          accent="text-gold"
          delay={0.15}
        />
        <StatCard
          label="Con certificación"
          value={stats.with_certificate}
          icon="certificate"
          accent="text-esmeralda"
          delay={0.2}
        />
      </div>

      {/* ── Barra de Búsqueda y Filtros ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 sm:items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, título, instructor..."
              className="field-dark py-2 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ash hover:text-snow cursor-pointer"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Modalidad */}
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="field-dark py-2 text-xs w-auto sm:max-w-[150px]"
          >
            <option value="all">Todas las modalidades</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="hibrida">Híbrida</option>
          </select>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-dark py-2 text-xs w-auto sm:max-w-[140px]"
          >
            <option value="all">Todos los estados</option>
            <option value="in_progress">En curso</option>
            <option value="scheduled">Programado</option>
            <option value="draft">Borrador</option>
            <option value="completed">Finalizado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Filtro por Certificación */}
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            className="field-dark py-2 text-xs w-auto sm:max-w-[160px]"
          >
            <option value="all">Certificación: Todas</option>
            <option value="with_cert">Con Certificado</option>
            <option value="no_cert">Sin Certificado</option>
          </select>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs text-ash">
            Mostrando {filteredCourses.length} de {courses.length} actividad(es)
          </span>
        </div>
      </div>

      {/* ── Tabla de Actividades Formativas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hud-corners rounded-2xl border border-edge bg-carbon/80 shadow-xl overflow-hidden"
      >
        {filteredCourses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="calendar"
              title="No se encontraron cursos o actividades"
              description={
                courses.length === 0
                  ? "Aún no hay cursos registrados en el módulo de Eventos y Formación."
                  : "Ninguna actividad coincide con los filtros aplicados."
              }
              action={
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCourse(null);
                      setIsFormOpen(true);
                    }}
                    className="rounded-xl bg-crimson px-4 py-2 text-xs font-semibold text-snow hover:bg-crimson-bright cursor-pointer"
                  >
                    + Nuevo curso / actividad
                  </button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-edge bg-steel/50 text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
                  <th className="py-3.5 px-5">Código y Título</th>
                  <th className="py-3.5 px-4">Facilitador / Área</th>
                  <th className="py-3.5 px-4 text-center">Modalidad</th>
                  <th className="py-3.5 px-4">Cronograma</th>
                  <th className="py-3.5 px-4 text-center">Certificación</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/70">
                {filteredCourses.map((c) => {
                  const linkedTpl = getLinkedTemplate(c);
                  return (
                    <tr key={c.id} className="group hover:bg-steel/30 transition-colors">
                      {/* Código y Título */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-edge bg-steel/80 text-azul">
                            <Icon name="academic" className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-crimson-bright">
                                {c.code}
                              </span>
                              <span className="inline-flex rounded border border-edge/60 bg-steel/60 px-1.5 py-0.2 text-[10px] font-mono text-fog uppercase">
                                {c.type}
                              </span>
                            </div>
                            <p className="font-display font-semibold text-snow group-hover:text-crimson-bright transition-colors line-clamp-1 max-w-sm mt-0.5">
                              {c.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Facilitador / Categoría */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-xs text-snow font-medium">{c.instructor}</p>
                        <span className="inline-block font-mono text-[11px] text-fog">
                          {c.category}
                        </span>
                      </td>

                      {/* Modalidad */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md border border-edge bg-steel/60 px-2.5 py-1 text-[11px] text-snow capitalize">
                          <Icon
                            name={
                              c.modality === "presencial"
                                ? "building"
                                : c.modality === "virtual"
                                ? "video"
                                : "globe"
                            }
                            className="h-3 w-3 text-azul"
                          />
                          <span>{c.modality}</span>
                        </span>
                      </td>

                      {/* Cronograma */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-fog">
                        <p className="text-snow font-mono font-medium">
                          {c.academic_hours} hrs ({c.sessions_count} ses.)
                        </p>
                        <p className="text-[11px] font-mono text-ash">
                          {new Date(c.start_date).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(c.end_date).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </td>

                      {/* Certificación */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {c.certification?.enabled && linkedTpl ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border border-esmeralda/50 bg-esmeralda/15 px-2.5 py-0.5 text-[11px] font-semibold text-esmeralda"
                            title={`Plantilla vinculada: ${linkedTpl.name}`}
                          >
                            <Icon name="check" className="h-3 w-3" />
                            <span className="max-w-[120px] truncate">{linkedTpl.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-steel/40 px-2 py-0.5 text-[10px] text-ash">
                            Sin certificado
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <Badge
                          tone={
                            c.status === "in_progress"
                              ? "azul"
                              : c.status === "completed"
                              ? "esmeralda"
                              : c.status === "scheduled"
                              ? "gold"
                              : "neutral"
                          }
                        >
                          {c.status === "in_progress"
                            ? "En curso"
                            : c.status === "completed"
                            ? "Finalizado"
                            : c.status === "scheduled"
                            ? "Programado"
                            : c.status === "cancelled"
                            ? "Cancelado"
                            : "Borrador"}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Ver Detalle */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourse(c);
                              setIsDetailOpen(true);
                            }}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-steel/60 px-2.5 text-xs text-fog hover:text-snow hover:border-azul hover:bg-steel transition-colors cursor-pointer"
                            title="Ver detalles del curso"
                          >
                            <Icon name="eye" className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Ver</span>
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormCourse(c);
                              setIsFormOpen(true);
                            }}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-steel/60 px-2.5 text-xs text-fog hover:text-snow hover:border-gold/50 hover:bg-steel transition-colors cursor-pointer"
                            title="Editar curso"
                          >
                            <Icon name="edit" className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {/* Selector rápido de estado */}
                          <select
                            value={c.status}
                            onChange={(e) =>
                              handleStatusChange(c, e.target.value as CourseStatus)
                            }
                            className="field-dark h-8 py-0 px-2 text-[11px] w-auto cursor-pointer"
                            title="Cambiar estado"
                          >
                            <option value="draft">Borrador</option>
                            <option value="scheduled">Programado</option>
                            <option value="in_progress">En curso</option>
                            <option value="completed">Finalizado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-steel/60 text-ash hover:text-crimson-bright hover:border-crimson/50 transition-colors cursor-pointer"
                            title="Eliminar curso"
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Modales ── */}
      <CourseFormModal
        isOpen={isFormOpen}
        initialCourse={formCourse}
        onClose={() => {
          setIsFormOpen(false);
          setFormCourse(null);
        }}
        onSave={handleSaveCourse}
      />

      <CourseDetailModal
        isOpen={isDetailOpen}
        course={selectedCourse}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCourse(null);
        }}
        onEdit={(course) => {
          setFormCourse(course);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}

