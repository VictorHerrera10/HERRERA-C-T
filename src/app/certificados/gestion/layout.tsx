import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Gestión de Certificados — Horizen TI",
  description:
    "Administración de plantillas de certificados y simulación de emisión.",
  robots: { index: false, follow: false },
};

export default function CertificadosGestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="certificados">
      <PlatformShell maxWidth="7xl">{children}</PlatformShell>
    </AuthGuard>
  );
}
