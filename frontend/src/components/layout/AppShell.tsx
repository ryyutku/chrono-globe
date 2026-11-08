// src/components/layout/AppShell.tsx
"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/layout/Nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isZonesPage = pathname === "/zones";

  return (
    <div
      className={`flex flex-col flex-1 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl transition-colors duration-300 ${
        isZonesPage
          ? "bg-[#050505] text-white" // Pure space black on /zones (no beige!)
          : "bg-[#ECEBE6] text-[#050505]" // Warm bone-grey on other pages
      }`}
    >
      <Nav />
      <div className="flex-1 relative flex flex-col">{children}</div>
    </div>
  );
}