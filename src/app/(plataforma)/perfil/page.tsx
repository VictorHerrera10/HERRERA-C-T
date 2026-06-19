import type { Metadata } from "next";
import { ProfileView } from "@/modules/auth/components/ProfileView";

export const metadata: Metadata = {
  title: "Mi perfil — Plataforma Herrera C&T",
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <ProfileView />;
}
