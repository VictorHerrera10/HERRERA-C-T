import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PlatformShell } from "@/modules/auth/components/PlatformShell";

/* Layout compartido de la plataforma del trabajador (/inicio, /perfil,
   /usuarios): el menú lateral persiste entre páginas y solo el
   contenido transiciona (PageTransition dentro de PlatformShell). */

export default function PlataformaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PlatformShell>{children}</PlatformShell>
    </AuthGuard>
  );
}
