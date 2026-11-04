import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/modules/website/components/Navbar";
import { Footer } from "@/modules/website/components/Footer";
import { getSiteContent } from "@/modules/website/lib/content";
import { CertificateVerifier } from "@/modules/certificados/components/CertificateVerifier";

export const metadata: Metadata = {
  title: "Verificación de Certificados — Horizen Tecnología & Información",
  description:
    "Comprueba la información y el estado de un certificado emitido por Horizen mediante su código de verificación.",
};

export const dynamic = "force-dynamic";

export default async function CertificadosPage() {
  const content = await getSiteContent();

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-[calc(100vh-200px)]">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center pt-32 text-xs font-mono uppercase tracking-widest text-fog">
              Cargando verificador...
            </div>
          }
        >
          <CertificateVerifier />
        </Suspense>
      </main>
      <Footer content={content.footer} />
    </>
  );
}
