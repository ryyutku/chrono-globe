// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TimeSpot | Convert time. No timezone maths.",
  description: "A cohesive, minimal timezone utility.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F04B0B] p-2 sm:p-3.5 min-h-screen flex flex-col antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}