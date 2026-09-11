import type { Metadata } from "next";
import { ClientDashboard } from "@/modules/portal-cliente/components/ClientDashboard";

export const metadata: Metadata = {
  title: "Mi panel — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function PortalClientePanelPage() {
  return <ClientDashboard />;
}
