import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Mesa de ayuda · Gestión — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="helpdesk">
      <PlatformShell maxWidth="5xl">{children}</PlatformShell>
    </AuthGuard>
  );
}
