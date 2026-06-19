import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientQuoteView } from "@/modules/quotes/components/ClientQuoteView";

export const metadata: Metadata = {
  title: "Cotizaciones — Herrera Consulting & Technology",
  description:
    "Revisa y aprueba en línea tu propuesta comercial de Herrera C&T.",
};

export default function CotizacionesPage() {
  return (
    <Suspense>
      <ClientQuoteView />
    </Suspense>
  );
}
