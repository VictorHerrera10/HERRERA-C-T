import type { Metadata } from "next";
import { PortalGateway } from "@/modules/website/components/PortalGateway";

export const metadata: Metadata = {
  title: "Portal de acceso — Herrera C&T",
};

export default function PortalPage() {
  return <PortalGateway />;
}
