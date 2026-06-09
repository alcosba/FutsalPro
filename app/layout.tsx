import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shared/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Futsal Coach - Gestor Táctico",
  description: "Aplicación profesional para entrenadores de futsal. Pizarra táctica, calendario, estadísticas y análisis.",
  keywords: "futsal, entrenador, táctica, calendario, estadísticas",
  openGraph: {
    title: "Futsal Coach",
    description: "Gestor integral para entrenadores de futsal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-900">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
