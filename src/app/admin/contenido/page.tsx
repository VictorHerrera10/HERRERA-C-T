"use client";

import { SectionCard } from "@/modules/website/admin/ui";
import {
  HeroForm,
  MarqueeForm,
  AboutForm,
  ProcessForm,
  ContactForm,
  FooterForm,
} from "@/modules/website/admin/ContentForms";

export default function ContenidoPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-ink">
        Contenido del sitio
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        Edita los textos de cada sección. Los cambios se publican al instante.
      </p>

      <div className="mt-8 space-y-6">
        <SectionCard
          title="Portada (Hero)"
          description="Primera pantalla que ve el visitante."
        >
          <HeroForm />
        </SectionCard>

        <SectionCard
          title="Cinta de especialidades"
          description="Texto que se desplaza bajo la portada."
        >
          <MarqueeForm />
        </SectionCard>

        <SectionCard
          title="Nosotros"
          description="Sección oscura con la historia y los puntos fuertes."
        >
          <AboutForm />
        </SectionCard>

        <SectionCard
          title="Método de trabajo"
          description="Los pasos numerados de cómo trabaja la consultora."
        >
          <ProcessForm />
        </SectionCard>

        <SectionCard
          title="Contacto"
          description="Datos de contacto y textos del formulario."
        >
          <ContactForm />
        </SectionCard>

        <SectionCard title="Pie de página">
          <FooterForm />
        </SectionCard>
      </div>
    </div>
  );
}
