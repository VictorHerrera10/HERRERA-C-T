import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Finanzas · Gestión — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function FinanzasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="finanzas">
      <PlatformShell maxWidth="5xl">{children}</PlatformShell>
    </AuthGuard>
  );
}
