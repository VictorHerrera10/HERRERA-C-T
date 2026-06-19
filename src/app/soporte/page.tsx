import type { Metadata } from "next";
import { ClientPortal } from "@/modules/helpdesk/components/ClientPortal";

export const metadata: Metadata = {
  title: "Centro de soporte — Herrera Consulting & Technology",
  description:
    "Crea y da seguimiento a tus tickets de soporte, incidentes y solicitudes con Herrera C&T.",
};

export default function SoportePage() {
  return <ClientPortal />;
}
