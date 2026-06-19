import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { PageTransition } from "@/modules/shared/components/PageTransition";

export const metadata: Metadata = {
  title: "Ventas · Gestión — Herrera C&T",
  robots: { index: false, follow: false },
};

export default function VentasGestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard module="ventas">
      <div className="min-h-screen bg-ivory">
        <header className="border-b border-ink/8 bg-burgundy-deep text-ivory">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
            <Link href="/ventas/gestion" className="flex items-center gap-3">
              <div className="logo-badge h-9 w-9 p-1.5">
                <div className="relative h-full w-full">
                  <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
                </div>
              </div>
              <div className="leading-tight">
                <p className="font-display text-sm font-semibold">Ventas</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-soft">
                  Gestión · Herrera C&amp;T
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-xs font-medium">
              <Link href="/inicio" className="text-ivory/70 transition-colors hover:text-ivory">
                Inicio
              </Link>
              <a
                href="/ventas"
                target="_blank"
                className="text-ivory/70 transition-colors hover:text-ivory"
              >
                Ver tienda ↗
              </a>
              <Link href="/cotizaciones/gestion" className="text-ivory/70 transition-colors hover:text-ivory">
                Cotizaciones
              </Link>
              <Link
                href="/admin"
                className="rounded-lg border border-ivory/20 px-3 py-1.5 text-ivory/80 transition-colors hover:border-ivory/40 hover:text-ivory"
              >
                Gestor del sitio
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </AuthGuard>
  );
}
