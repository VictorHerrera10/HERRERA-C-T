"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/modules/shared/components/Icon";
import { Badge } from "@/modules/shared/components/Badge";
import { StatCard } from "@/modules/shared/components/StatCard";
import { EmptyState } from "@/modules/shared/components/EmptyState";
import { useToast } from "@/modules/shared/components/Toast";
import { getSession, type SessionUser } from "@/modules/auth/lib/auth";

import {
  loadTemplatesFromStorage,
  updateTemplateStatus,
  calculateTemplateStats,
  type CertificateTemplate,
  type CertificateStatus,
} from "../lib/templates";

import {
  resolveCertificatePermissions,
  type CertificatePermissions,
} from "../lib/permissions";

import { CertificatePreviewModal } from "./CertificatePreviewModal";
import { TemplateFormModal } from "./TemplateFormModal";

export function CertificadosAdminView() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modales
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);
  const [formTemplate, setFormTemplate] = useState<CertificateTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Carga inicial
  useEffect(() => {
    setCurrentUser(getSession());
    setTemplates(loadTemplatesFromStorage());
  }, []);

  // Permisos según el usuario en sesión
  const permissions: CertificatePermissions = useMemo(() => {
    return resolveCertificatePermissions(currentUser);
  }, [currentUser]);

  // Estadísticas calculadas dinámicamente
  const stats = useMemo(() => {
    return calculateTemplateStats(templates);
  }, [templates]);

  // Lista de categorías únicas para el filtro
  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category));
    return Array.from(set).filter(Boolean);
  }, [templates]);

  // Plantillas filtradas
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.issuing_entity.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === "all" || tpl.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || tpl.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [templates, searchQuery, categoryFilter, statusFilter]);

  // Cambiar estado (Activar / Desactivar)
  function handleToggleStatus(tpl: CertificateTemplate) {
    if (!permissions.manage_status) {
      toast.warning("Acceso restringido", "Tu rol no tiene permisos para cambiar el estado.");
      return;
    }

    const nextStatus: CertificateStatus =
      tpl.status === "active" ? "inactive" : "active";

    const updated = updateTemplateStatus(tpl.id, nextStatus);
    if (updated) {
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? updated : t)));
      toast.info(
        `Estado actualizado`,
        `"${tpl.name}" ahora figura como ${
          nextStatus === "active" ? "Activa" : "Inactiva"
        }.`
      );
    }
  }

  // Guardado exitoso de formulario
  function handleSaveSuccess(saved: CertificateTemplate, isNew: boolean) {
    if (isNew) {
      setTemplates((prev) => [saved, ...prev]);
    } else {
      setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Encabezado y Contexto ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="section-number">/ certificados / gestión</p>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-snow">
            Gestión de certificados
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fog">
            Administra las plantillas oficiales de certificados de Horizen TI y configura sus parámetros de emisión para cursos y programas formativos.
          </p>
        </div>

        {/* Acciones principales del encabezado */}
        <div className="flex flex-wrap items-center gap-2.5">
          {permissions.create && (
            <button
              type="button"
              onClick={() => {
                setFormTemplate(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-snow shadow-[0_4px_18px_rgba(216,17,43,0.45)] hover:bg-crimson-bright transition-all cursor-pointer"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span>+ Nueva plantilla</span>
            </button>
          )}

          <Link
            href="/certificados"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge px-3 py-2.5 text-xs text-ash hover:text-snow hover:border-fog/40 transition-colors"
            title="Ir al portal público de verificación de certificados"
          >
            <Icon name="globe" className="h-4 w-4" />
            <span className="hidden sm:inline">Verificador público</span>
          </Link>
        </div>
      </div>

      {/* ── Indicadores Resumidos ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total de plantillas"
          value={stats.total}
          icon="certificate"
          accent="text-crimson-bright"
          delay={0.05}
        />
        <StatCard
          label="Plantillas activas"
          value={stats.active}
          icon="check"
          accent="text-esmeralda"
          delay={0.1}
        />
        <StatCard
          label="En borrador"
          value={stats.draft}
          icon="chart"
          accent="text-gold"
          delay={0.15}
        />
        <StatCard
          label="Inactivas / Archivadas"
          value={stats.inactive}
          icon="wrench"
          accent="text-fog"
          delay={0.2}
        />
      </div>

      {/* ── Barra de Herramientas y Filtros ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, entidad o descripción..."
              className="field-dark py-2 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-ash hover:text-snow"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Categoría */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="field-dark py-2 text-xs w-auto sm:max-w-[180px]"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-dark py-2 text-xs w-auto sm:max-w-[160px]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="draft">Borrador</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs text-ash">
            Mostrando {filteredTemplates.length} de {templates.length} plantilla(s)
          </span>
        </div>
      </div>

      {/* ── Tabla de Plantillas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hud-corners rounded-2xl border border-edge bg-carbon/80 shadow-xl overflow-hidden"
      >
        {filteredTemplates.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="certificate"
              title="No se encontraron plantillas"
              description={
                templates.length === 0
                  ? "Aún no hay plantillas registradas en el sistema. Puedes crear una nueva plantilla oficial."
                  : "No hay plantillas que coincidan con los filtros de búsqueda aplicados."
              }
              action={
                permissions.create ? (
                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormTemplate(null);
                        setIsFormOpen(true);
                      }}
                      className="rounded-xl bg-crimson px-4 py-2 text-xs font-semibold text-snow hover:bg-crimson-bright cursor-pointer"
                    >
                      + Nueva plantilla
                    </button>
                  </div>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-edge bg-steel/50 text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
                  <th className="py-3.5 px-5">Nombre de la plantilla</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-center">Versión</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4">Última modificación</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/70">
                {filteredTemplates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="group hover:bg-steel/30 transition-colors"
                  >
                    {/* Nombre y descripción */}
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-edge bg-steel/80 text-crimson-bright">
                          <Icon name="certificate" className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-display font-semibold text-snow group-hover:text-crimson-bright transition-colors">
                            {tpl.name}
                          </p>
                          <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-fog">
                            {tpl.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex rounded-md border border-edge bg-steel/60 px-2.5 py-1 font-mono text-[11px] text-fog">
                        {tpl.category}
                      </span>
                    </td>

                    {/* Versión */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-mono text-xs text-snow font-semibold">
                        v{tpl.version}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <Badge
                        tone={
                          tpl.status === "active"
                            ? "esmeralda"
                            : tpl.status === "draft"
                            ? "gold"
                            : "neutral"
                        }
                      >
                        {tpl.status === "active"
                          ? "Activa"
                          : tpl.status === "draft"
                          ? "Borrador"
                          : "Inactiva"}
                      </Badge>
                    </td>

                    {/* Última modificación */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-fog font-mono">
                      {new Date(tpl.updated_at).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Ver Vista Previa */}
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tpl)}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-steel/60 px-2.5 text-xs text-fog hover:text-snow hover:border-crimson/50 hover:bg-steel transition-colors cursor-pointer"
                          title="Ver detalle y vista previa del diploma"
                        >
                          <Icon name="eye" className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>

                        {/* Editar */}
                        {permissions.edit && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormTemplate(tpl);
                              setIsFormOpen(true);
                            }}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-steel/60 px-2.5 text-xs text-fog hover:text-snow hover:border-gold/50 hover:bg-steel transition-colors cursor-pointer"
                            title="Editar plantilla"
                          >
                            <Icon name="edit" className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}

                        {/* Activar / Desactivar */}
                        {permissions.manage_status && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tpl)}
                            className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                              tpl.status === "active"
                                ? "border-edge text-fog hover:border-crimson/50 hover:text-crimson-bright hover:bg-steel"
                                : "border-edge text-esmeralda hover:border-esmeralda/60 hover:bg-esmeralda/10"
                            }`}
                            title={
                              tpl.status === "active"
                                ? "Desactivar plantilla"
                                : "Activar plantilla"
                            }
                          >
                            <span>{tpl.status === "active" ? "Desactivar" : "Activar"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Modales ── */}
      <CertificatePreviewModal
        template={previewTemplate}
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        onEdit={(tpl) => {
          setPreviewTemplate(null);
          setFormTemplate(tpl);
          setIsFormOpen(true);
        }}
        canEdit={permissions.edit}
      />

      <TemplateFormModal
        isOpen={isFormOpen}
        initialTemplate={formTemplate}
        onClose={() => {
          setIsFormOpen(false);
          setFormTemplate(null);
        }}
        onSave={handleSaveSuccess}
      />
    </div>
  );
}
