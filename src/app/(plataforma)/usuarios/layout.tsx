import type { Metadata } from "next";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { UsersNav } from "@/modules/auth/components/UsersNav";

export const metadata: Metadata = {
  title: "Usuarios — Plataforma Herrera C&T",
  robots: { index: false, follow: false },
};

/* El shell (menú lateral) lo pone el layout del grupo (plataforma);
   aquí solo se exige rol admin y se agregan las pestañas. */
export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard adminOnly inline>
      <UsersNav />
      {children}
    </AuthGuard>
  );
}
