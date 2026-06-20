import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/modules/website/components/Navbar";
import { CatalogoView } from "@/modules/ventas/components/CatalogoView";

export const metadata: Metadata = {
  title: "Tienda — Herrera C&T",
  description: "Tecnología y librería para tu empresa. Equipos, periféricos y útiles de oficina.",
};

export default function VentasPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <CatalogoView />
      </Suspense>
    </>
  );
}
