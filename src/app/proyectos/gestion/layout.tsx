import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Proyectos · Gestión — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function ProyectosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="projects">
      <PlatformShell maxWidth="5xl">{children}</PlatformShell>
    </AuthGuard>
  );
}
