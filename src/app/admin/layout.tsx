import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebar } from "@/modules/website/admin/Sidebar";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PageTransition } from "@/modules/shared/components/PageTransition";

export const metadata: Metadata = {
  title: "Gestor del sitio — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="website">
    <div className="flex min-h-screen bg-ivory">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra móvil */}
        <div className="flex items-center justify-between border-b border-ink/8 bg-white px-5 py-3 lg:hidden">
          <p className="font-display text-base font-semibold text-burgundy">
            Herrera C&amp;T — Gestor
          </p>
          <nav className="flex gap-3 text-xs font-medium text-ink-soft">
            <Link href="/admin">Resumen</Link>
            <Link href="/admin/contenido">Contenido</Link>
            <Link href="/admin/servicios">Servicios</Link>
            <Link href="/admin/proyectos">Proyectos</Link>
            <Link href="/admin/mensajes">Mensajes</Link>
          </nav>
        </div>
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 lg:px-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
