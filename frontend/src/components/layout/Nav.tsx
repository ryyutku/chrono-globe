// src/components/layout/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navConfig } from "@/lib/config/nav";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="w-full px-6 sm:px-10 pt-6 pb-4">
      <div className="flex items-center justify-between">
        {/* Brand with Circular Radial Clock Logo */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <svg className="h-6 w-6 text-[#050505]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2.5" />
            <path d="M12 6.5v5.5l3.5 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-xl font-black tracking-tight text-[#050505]">
            {navConfig.brand}
          </span>
        </Link>

        {/* Center Nav Links with Orange Outlined Active Pill */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
          {navConfig.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1 text-xs sm:text-sm font-semibold tracking-tight transition-all duration-150 rounded-full select-none ${
                  isActive
                    ? "border-2 border-[#F04B0B] text-[#050505] font-bold"
                    : "text-[#555555] hover:text-[#050505] border-2 border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Far Right: ● UTC Ready ● */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#050505] select-none">
          <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
          <span>UTC Ready</span>
          <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
        </div>
      </div>
    </header>
  );
}