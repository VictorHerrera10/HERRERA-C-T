import type { Metadata } from "next";
import { ClientLogin } from "@/modules/portal-cliente/components/ClientLogin";

export const metadata: Metadata = {
  title: "Portal de cliente — Herrera C&T",
};

export default function PortalClientePage() {
  return <ClientLogin />;
}
