// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";

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
      {/* Outer Vivid Orange Frame (#F04B0B) */}
      <body className={`${inter.className} bg-[#F04B0B] p-2 sm:p-3.5 min-h-screen flex flex-col antialiased`}>
        {/* Inner Warm Bone-Grey Canvas (#ECEBE6) */}
        <div className="bg-[#ECEBE6] text-[#050505] rounded-[24px] sm:rounded-[32px] flex flex-col flex-1 shadow-2xl overflow-x-hidden">
          <Nav />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}