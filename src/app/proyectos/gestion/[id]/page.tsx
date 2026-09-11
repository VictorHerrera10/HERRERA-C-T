"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/modules/shared/lib/supabase";
import { useToast } from "@/modules/shared/components/Toast";
import { getSession } from "@/modules/auth/lib/auth";
import { Spinner } from "@/modules/shared/components/Spinner";
import { Select } from "@/modules/shared/components/Select";
import {
  type ClientProject,
  type ProjectRequirement,
  type ProjectResource,
  type ProjectConformity,
  type DevProgressStage,
  PROJECT_STAGE,
  DEV_PROGRESS_STAGE,
  DEV_PROGRESS_ORDER,
  projectCode,
} from "@/modules/projects/lib/projects";

const ease = [0.21, 0.6, 0.35, 1] as const;

type AppUserRef = { id: string; first_name: string; last_name: string; avatar_url?: string | null };

function shortName(u: AppUserRef | undefined | null): string {
  if (!u) return "";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Sin nombre";
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const me = getSession();

  const [project, setProject] = useState<ClientProject | null>(null);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [conformities, setConformities] = useState<ProjectConformity[]>([]);
  const [devMembers, setDevMembers] = useState<AppUserRef[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  const [newReqLabel, setNewReqLabel] = useState("");
  const [newReqValue, setNewReqValue] = useState("");
  const [selectedDev, setSelectedDev] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [conformityNote, setConformityNote] = useState("");

  const load = useCallback(async () => {
    const [detail, dev] = await Promise.all([
      supabase.rpc("hct_get_project", { p_project_id: id }),
      supabase.rpc("hct_list_area_members", { p_area_name: "Desarrollo" }),
    ]);
    if (detail.error || !detail.data?.project) {
      setLoadFailed(true);
      if (detail.error) toast.error("No se pudo cargar el proyecto", detail.error.message);
      return;
    }
    setProject(detail.data.project as ClientProject);
    setRequirements((detail.data.requirements as ProjectRequirement[]) ?? []);
    setResources((detail.data.resources as ProjectResource[]) ?? []);
    setConformities((detail.data.conformities as ProjectConformity[]) ?? []);
    setDevMembers((dev.data as AppUserRef[]) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addRequirement() {
    if (!project || !newReqLabel.trim()) return;
    const { data, error } = await supabase.rpc("hct_add_project_requirement", {
      p_project_id: project.id,
      p_label: newReqLabel.trim(),
      p_value: newReqValue.trim(),
    });
    if (error) return toast.error("No se pudo agregar el requisito", error.message);
    setRequirements([...requirements, data as ProjectRequirement]);
    setNewReqLabel("");
    setNewReqValue("");
  }

  async function removeRequirement(reqId: string) {
    setRequirements((prev) => prev.filter((r) => r.id !== reqId));
    await supabase.rpc("hct_delete_project_requirement", { p_requirement_id: reqId });
  }

  async function sendToDevelopment() {
    if (!project || !selectedDev) return;
    const { data, error } = await supabase.rpc("hct_send_to_development", {
      p_project_id: project.id,
      p_dev_user_id: selectedDev,
    });
    if (error) return toast.error("No se pudo enviar a desarrollo", error.message);
    setProject(data as ClientProject);
    toast.success("Proyecto enviado a Desarrollo");
  }

  async function updateProgress(stage: DevProgressStage) {
    if (!project) return;
    const { data, error } = await supabase.rpc("hct_update_dev_progress", {
      p_project_id: project.id,
      p_stage: stage,
      p_note: progressNote.trim(),
    });
    if (error) return toast.error("No se pudo actualizar el avance", error.message);
    setProject(data as ClientProject);
    toast.success("Avance actualizado");
  }

  async function sendToManagement() {
    if (!project) return;
    const { data, error } = await supabase.rpc("hct_send_to_management", {
      p_project_id: project.id,
    });
    if (error) return toast.error("No se pudo enviar a gerencia", error.message);
    setProject(data as ClientProject);
    toast.success("Proyecto enviado a Gerencia");
  }

  async function confirm(role: "manager" | "management") {
    if (!project) return;
    const { data, error } = await supabase.rpc("hct_confirm_project", {
      p_project_id: project.id,
      p_role: role,
      p_note: conformityNote.trim(),
    });
    if (error) return toast.error("No se pudo registrar la conformidad", error.message);
    setProject(data as ClientProject);
    setConformityNote("");
    toast.success("Conformidad registrada");
    load();
  }

  if (!project) return <Spinner />;

  const isManager = !!(me && project.manager_id === me.id);
  const isDev = !!(me && project.dev_user_id === me.id);
  const isAdmin = !!me?.is_admin;
  const managerConfirmedByMe = conformities.some(
    (c) => c.role === "manager" && c.user_id === me?.id
  );
  const managementConfirmedByMe = conformities.some(
    (c) => c.role === "management" && c.user_id === me?.id
  );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <Link
          href="/proyectos/gestion"
          className="text-xs font-medium text-fog transition-colors hover:text-[#ff8195]"
        >
          ← Proyectos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-medium text-snow">
            {projectCode(project.project_no)}
          </h1>
          <span
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${PROJECT_STAGE[project.stage].badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${PROJECT_STAGE[project.stage].dot}`} />
            {PROJECT_STAGE[project.stage].label}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-fog">{project.title}</p>
        {project.project_summary && (
          <p className="mt-1 max-w-2xl text-sm text-fog">{project.project_summary}</p>
        )}
        <p className="mt-2 text-xs text-fog">
          Cliente: <span className="font-medium text-fog">{project.client_name}</span>
        </p>
      </motion.div>

      {/* Etapa Requisitos */}
      {project.stage === "requisitos" && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-6 rounded-lg border border-edge bg-carbon/70 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Requisitos del cliente
          </p>
          <p className="mt-1 text-[11px] text-ash">
            Arma la lista de información que necesitas recoger del cliente antes de enviar a desarrollo.
          </p>

          <div className="mt-4 space-y-2.5">
            <AnimatePresence initial={false}>
              {requirements.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex items-center gap-3 rounded-lg border border-edge bg-steel/60 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-snow">{r.label}</p>
                    {r.value && <p className="text-xs text-fog">{r.value}</p>}
                  </div>
                  <button
                    onClick={() => removeRequirement(r.id)}
                    className="text-fog transition-colors hover:text-[#ff8195]"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {!requirements.length && (
              <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center text-xs text-fog">
                Agrega el primer requisito.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="field-dark"
              placeholder="Ej. Logo en alta resolución"
              value={newReqLabel}
              onChange={(e) => setNewReqLabel(e.target.value)}
            />
            <input
              className="field-dark"
              placeholder="Detalle u observación (opcional)"
              value={newReqValue}
              onChange={(e) => setNewReqValue(e.target.value)}
            />
            <button
              onClick={addRequirement}
              className="rounded-lg border border-crimson/30 px-4 py-2 text-xs font-semibold text-[#ff8195] transition-colors hover:bg-crimson/10"
            >
              + Agregar
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-edge pt-5">
            <Select
              compact
              value={selectedDev}
              onChange={setSelectedDev}
              placeholder="Asignar a desarrollador…"
              options={devMembers.map((u) => ({
                value: u.id,
                label: shortName(u),
                avatarSeed: shortName(u),
                avatarSrc: u.avatar_url,
              }))}
            />
            <button
              onClick={sendToDevelopment}
              disabled={!selectedDev || !requirements.length}
              className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow transition-colors hover:bg-crimson-bright disabled:opacity-50"
            >
              Enviar a desarrollo
            </button>
            {devMembers.length === 0 && (
              <p className="text-[11px] text-ash">
                No hay usuarios activos en el área Desarrollo todavía.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Etapa Desarrollo */}
      {project.stage === "desarrollo" && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-6 rounded-lg border border-edge bg-carbon/70 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Avance de desarrollo
          </p>

          {/* Stepper de sub-etapas */}
          <div className="relative mt-5 flex items-center">
            {DEV_PROGRESS_ORDER.map((stage, i) => {
              const currentOrder = project.dev_progress_stage
                ? DEV_PROGRESS_STAGE[project.dev_progress_stage].order
                : 0;
              const reached = DEV_PROGRESS_STAGE[stage].order <= currentOrder;
              return (
                <div key={stage} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-3 w-3 rounded-full transition-colors ${
                        reached ? "bg-crimson" : "bg-edge"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        reached ? "text-snow" : "text-fog"
                      }`}
                    >
                      {DEV_PROGRESS_STAGE[stage].label}
                    </span>
                  </div>
                  {i < DEV_PROGRESS_ORDER.length - 1 && (
                    <div className="mx-2 h-[2px] flex-1 rounded-full bg-edge" />
                  )}
                </div>
              );
            })}
          </div>

          {(isDev || isAdmin) && (
            <div className="mt-6 border-t border-edge pt-5">
              <textarea
                className="field-dark resize-y"
                rows={2}
                placeholder="Nota sobre el avance…"
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {DEV_PROGRESS_ORDER.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => updateProgress(stage)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      project.dev_progress_stage === stage
                        ? "border-crimson bg-crimson/10 text-[#ff8195]"
                        : "border-edge text-fog hover:border-snow/25"
                    }`}
                  >
                    {DEV_PROGRESS_STAGE[stage].label}
                  </button>
                ))}
              </div>
              {project.dev_progress_note && (
                <p className="mt-3 text-xs text-fog">“{project.dev_progress_note}”</p>
              )}
            </div>
          )}

          {(isManager || isAdmin) && project.dev_progress_stage === "listo" && (
            <div className="mt-5 border-t border-edge pt-5">
              <button
                onClick={sendToManagement}
                className="rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-snow transition-colors hover:bg-crimson-bright"
              >
                Enviar a Gerencia
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Etapa Gerencia */}
      {project.stage === "gerencia" && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-6 rounded-lg border border-edge bg-carbon/70 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fog">
            Conformidad final antes de mostrar al cliente
          </p>
          <p className="mt-1 text-[11px] text-ash">
            Se requiere la conformidad del encargado y de un administrador (Gerencia) para
            que el proyecto quede listo para la firma del cliente.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <span
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                project.manager_conformity_at
                  ? "bg-esmeralda/10 text-esmeralda"
                  : "bg-steel text-fog"
              }`}
            >
              {project.manager_conformity_at ? "✓" : "○"} Conformidad del encargado
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                project.management_conformity_at
                  ? "bg-esmeralda/10 text-esmeralda"
                  : "bg-steel text-fog"
              }`}
            >
              {project.management_conformity_at ? "✓" : "○"} Conformidad de Gerencia
            </span>
          </div>

          {((isManager && !managerConfirmedByMe) || (isAdmin && !managementConfirmedByMe)) && (
            <div className="mt-5 border-t border-edge pt-5">
              <textarea
                className="field-dark resize-y"
                rows={2}
                placeholder="Comentario opcional…"
                value={conformityNote}
                onChange={(e) => setConformityNote(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {isManager && !managerConfirmedByMe && (
                  <button
                    onClick={() => confirm("manager")}
                    className="rounded-lg bg-esmeralda px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
                  >
                    Dar conformidad como encargado
                  </button>
                )}
                {isAdmin && !managementConfirmedByMe && (
                  <button
                    onClick={() => confirm("management")}
                    className="rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
                  >
                    Dar conformidad como Gerencia
                  </button>
                )}
              </div>
            </div>
          )}

          {project.manager_conformity_at && project.management_conformity_at && (
            <div className="mt-5 rounded-lg border border-esmeralda/30 bg-esmeralda/8 px-5 py-4 text-sm text-snow">
              El proyecto está listo. El cliente ya puede firmar su conformidad final.
            </div>
          )}
        </motion.div>
      )}

      {/* Etapa Cerrado */}
      {project.stage === "cerrado" && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mt-6 rounded-lg border border-esmeralda/30 bg-esmeralda/8 p-6 text-sm text-snow"
        >
          <strong>✓ Proyecto cerrado</strong>
          {project.closed_at &&
            ` · ${new Date(project.closed_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}`}
          <p className="mt-1 text-fog">
            El cliente firmó su conformidad final. El ingreso quedó registrado en Finanzas.
          </p>
        </motion.div>
      )}
    </div>
  );
}
