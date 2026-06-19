import type { Metadata } from "next";
import { LoginFlow } from "@/modules/auth/components/LoginFlow";

export const metadata: Metadata = {
  title: "Ingreso del equipo — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginFlow />;
}
