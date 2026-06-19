import type { Metadata } from "next";
import { Unbounded, Archivo, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/modules/shared/components/Toast";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Herrera Consulting & Technology — Consultoría y Tecnología",
  description:
    "Diseñamos, construimos y operamos la infraestructura digital de empresas que no pueden permitirse fallar. Software a medida, soporte TI continuo y consultoría estratégica.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${unbounded.variable} ${archivo.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
