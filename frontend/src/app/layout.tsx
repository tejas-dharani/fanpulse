import type { Metadata } from "next";
import "./globals.css";
import ClientOnly from "@/components/ClientOnly";

export const metadata: Metadata = {
  title: "FanPulse — IPL Fan Connection Platform",
  description: "Connect with fans who feel exactly what you feel, in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white">
        <ClientOnly>{children}</ClientOnly>
      </body>
    </html>
  );
}
