import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";
import { AdminTabs } from "@/modules/website/admin/AdminTabs";

export const metadata: Metadata = {
  title: "Gestor del sitio — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="website">
      <PlatformShell maxWidth="4xl">
        <AdminTabs />
        {children}
      </PlatformShell>
    </AuthGuard>
  );
}
