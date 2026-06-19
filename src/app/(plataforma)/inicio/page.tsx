import type { Metadata } from "next";
import { HubView } from "@/modules/auth/components/HubView";

export const metadata: Metadata = {
  title: "Inicio — Plataforma Herrera C&T",
  robots: { index: false, follow: false },
};

export default function InicioPage() {
  return <HubView />;
}
