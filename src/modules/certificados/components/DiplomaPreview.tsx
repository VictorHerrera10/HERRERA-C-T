"use client";

import Image from "next/image";
import { Icon } from "@/modules/shared/components/Icon";
import type { CertificateTemplate } from "../lib/templates";

export function DiplomaPreview({
  template,
  participantName = "[NOMBRE Y APELLIDOS DEL PARTICIPANTE]",
  sampleCode = "[HZ-2026-DEMO-XXXX]",
  sampleDate = "26 de octubre de 2026",
  isSimulatedInstance = false,
}: {
  template: CertificateTemplate;
  participantName?: string;
  sampleCode?: string;
  sampleDate?: string;
  isSimulatedInstance?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-edge/80 bg-gradient-to-b from-void via-carbon to-void p-6 text-snow shadow-2xl sm:p-10">
      {/* Marco decorativo de lujo */}
      <div className="pointer-events-none absolute inset-3 rounded-xl border border-gold/25" />
      <div className="pointer-events-none absolute inset-4 rounded-lg border border-edge/40" />

      {/* Esquinas HUD estilizadas */}
      <div className="pointer-events-none absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-gold/70" />
      <div className="pointer-events-none absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-gold/70" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-gold/70" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-gold/70" />

      {/* Marca de agua de demostración */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] select-none">
        <p className="rotate-[-28deg] font-display text-5xl font-black uppercase tracking-widest text-snow sm:text-7xl">
          DEMOSTRACIÓN
        </p>
      </div>

      {/* Encabezado institucional */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-gold-soft">
          <Icon name="sparkles" className="h-3 w-3 text-gold" />
          {isSimulatedInstance ? "EMISIÓN CONCEPTUAL SIMULADA" : "VISTA PREVIA DE PLANTILLA"}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="logo-badge h-11 w-11 shrink-0 p-1.5">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Horizen" fill className="object-contain" />
            </div>
          </div>
          <div className="text-left">
            <p className="font-display text-base font-bold tracking-tight text-snow">
              {template.issuing_entity || "Horizen Tecnología e Información"}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-fog">
              División de Consultoría &amp; Certificaciones Tech
            </p>
          </div>
        </div>

        {/* Título del diploma */}
        <div className="mt-8">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-gold-soft sm:text-3xl">
            {template.diploma_title || "Certificado de Aprobación"}
          </h2>
          <p className="mt-2 text-xs font-mono tracking-widest text-ash uppercase">
            Otorga el presente reconocimiento y constancia a:
          </p>
        </div>

        {/* Nombre del participante */}
        <div className="my-6 border-b border-crimson/50 px-8 py-2">
          <p className="font-display text-xl font-bold uppercase tracking-wide text-snow sm:text-2xl">
            {participantName}
          </p>
        </div>

        {/* Detalle de la capacitación */}
        <div className="max-w-xl text-center">
          <p className="text-xs text-fog leading-relaxed">
            {template.diploma_text ||
              "Por haber completado y acreditado satisfactoriamente los requisitos del programa de especialización."}
          </p>

          <div className="mt-3 inline-block rounded-lg border border-edge bg-steel/60 px-4 py-1.5 font-display text-sm font-semibold text-snow">
            Programa: <span className="text-crimson-bright">{template.name}</span>
          </div>
        </div>

        {/* Pie de certificación: Firmas, fecha y código de validación */}
        <div className="mt-10 grid w-full max-w-2xl grid-cols-1 items-end gap-6 border-t border-edge/70 pt-6 sm:grid-cols-3">
          {/* QR Simulado */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-edge bg-steel/80 text-ash shadow-inner">
              <div className="flex flex-col items-center">
                <Icon name="shield" className="h-6 w-6 text-crimson-bright/70" />
                <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-ash">
                  QR SIM
                </span>
              </div>
            </div>
            <p className="mt-2 font-mono text-[9px] text-ash uppercase">
              Verificable en línea
            </p>
          </div>

          {/* Código y Fecha */}
          <div className="text-center">
            <p className="font-mono text-[10px] text-fog uppercase tracking-wider">
              Código de verificación
            </p>
            <p className="font-mono text-xs font-bold tracking-wider text-snow mt-0.5">
              {sampleCode}
            </p>
            <p className="mt-2 text-[10px] text-ash font-mono uppercase">
              Fecha de emisión: {sampleDate}
            </p>
          </div>

          {/* Firma */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
            <div className="h-10 w-36 border-b border-edge/90 flex items-center justify-center">
              <span className="font-serif italic text-xs text-fog/80 select-none">
                {template.signatory_name ? "~ Víctor Herrera ~" : "—"}
              </span>
            </div>
            <p className="mt-1 font-display text-xs font-semibold text-snow">
              {template.signatory_name || "Dirección de Tecnología"}
            </p>
            <p className="text-[10px] text-fog">
              {template.signatory_role || "Horizen TI"}
            </p>
          </div>
        </div>

        {/* Nota legal / Prototipo */}
        <div className="mt-8 border-t border-edge/40 pt-3 text-center">
          <p className="font-mono text-[9px] text-ash uppercase tracking-wider">
            Documento de demostración • Plantilla v{template.version || "1.0"} • Horizen TI
          </p>
        </div>
      </div>
    </div>
  );
}
