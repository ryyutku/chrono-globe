// src/components/layout/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navConfig } from "@/lib/config/nav";

export function Nav() {
  const pathname = usePathname();
  const isZonesPage = pathname === "/zones";

  return (
    <header
      className={`w-full z-50 transition-all duration-300 ${
        isZonesPage
          ? "absolute top-0 inset-x-0 bg-transparent border-none py-6"
          : "sticky top-0 bg-[#ECEBE6] border-b border-[#DCDAD5] py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <svg
            className={`h-6 w-6 transition-colors ${
              isZonesPage ? "text-white" : "text-[#050505]"
            }`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2.5" />
            <path d="M12 6.5v5.5l3.5 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span
            className={`text-xl font-black tracking-tight transition-colors ${
              isZonesPage ? "text-white" : "text-[#050505]"
            }`}
          >
            {navConfig.brand}
          </span>
        </Link>

        {/* Navigation Tabs (Liquid Glass on /zones, Clean White on other pages) */}
        <nav
          aria-label="Main Navigation"
          className={`flex items-center gap-1 sm:gap-2 rounded-full p-1 transition-all ${
            isZonesPage
              ? "bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-2xl"
              : "bg-[#FFFFFF] border border-[#DCDAD5] shadow-sm"
          }`}
        >
          {navConfig.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const activeClass = isZonesPage
              ? "border-2 border-[#F04B0B] text-white font-bold bg-white/10"
              : "border-2 border-[#F04B0B] text-[#050505] font-bold";

            const inactiveClass = isZonesPage
              ? "text-zinc-300 hover:text-white border-2 border-transparent"
              : "text-[#555555] hover:text-[#050505] border-2 border-transparent";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1 text-xs sm:text-sm font-semibold tracking-tight transition-all duration-150 rounded-full select-none ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold select-none rounded-full px-3.5 py-1 ${
            isZonesPage
              ? "bg-white/[0.08] backdrop-blur-xl border border-white/15 text-white"
              : "text-[#050505]"
          }`}
        >
          {/* <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
          <span>UTC Ready</span>
          <span className="h-2 w-2 rounded-full bg-[#F04B0B]" /> */}
        </div>

      </div>
    </header>
  );
}