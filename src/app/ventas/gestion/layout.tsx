import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

export const metadata: Metadata = {
  title: "Ventas · Gestión — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function VentasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="ventas">
      <PlatformShell maxWidth="7xl">{children}</PlatformShell>
    </AuthGuard>
  );
}
