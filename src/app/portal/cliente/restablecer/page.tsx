import type { Metadata } from "next";
import { ClientPasswordReset } from "@/modules/portal-cliente/components/ClientPasswordReset";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function PortalClienteRestablecerPage() {
  return <ClientPasswordReset />;
}
