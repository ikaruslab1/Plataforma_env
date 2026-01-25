import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sistema de Registro y Visualización Académica",
  description: "Sistema de Registro y Visualización Académica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
