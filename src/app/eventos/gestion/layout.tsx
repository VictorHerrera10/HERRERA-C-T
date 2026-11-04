import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Eventos y Formación — Horizen TI",
  description:
    "Administración de cursos, capacitaciones y actividades formativas vinculadas a certificados.",
  robots: { index: false, follow: false },
};

export default function EventosGestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="eventos">
      <PlatformShell maxWidth="7xl">{children}</PlatformShell>
    </AuthGuard>
  );
}

