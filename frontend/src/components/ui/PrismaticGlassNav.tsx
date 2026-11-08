// src/components/ui/PrismaticGlassNav.tsx
// src/components/ui/PrismaticGlassNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PrismaticGlassNavProps {
  label?: string;
  showLinks?: boolean;
}

export function PrismaticGlassNav({
  label = "Home",
  showLinks = true,
}: PrismaticGlassNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main Navigation" className="relative inline-flex items-center">
      {/* Outer Smoked-Glass Pill Housing */}
      <div className="liquid-glass-l1 relative flex items-center gap-4 rounded-full p-1.5 pr-6 sm:pr-8">
        
        {/* Left: Signature Circular Button Assembly */}
        <Link
          href="/"
          aria-label="Navigate to Home"
          className="group relative block select-none"
        >
          {/* Outer Concentric Well */}
          <div className="prismatic-well">
            {/* Ambient Caustic Light Bloom */}
            <div
              className="prismatic-bloom group-hover:opacity-85 transition-opacity"
              aria-hidden="true"
            />

            {/* The Sharp Prismatic Rainbow Ring */}
            <div
              className="prismatic-ring group-hover:scale-[1.02] transition-transform"
              aria-hidden="true"
            />

            {/* Specular Lens Flare Hotspot */}
            <div className="prismatic-flare" aria-hidden="true" />

            {/* Smoked Convex Glass Core Button */}
            <div className="prismatic-core group-hover:scale-[1.03] active:scale-[0.97]">
              {/* Silver/White Metallic House Icon */}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-105"
                fill="none"
              >
                <defs>
                  <linearGradient id="homeIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#D4D7E1" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 3.2L2.5 11.2C2.1 11.5 2.4 12.2 2.9 12.2H5V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V12.2H21.1C21.6 12.2 21.9 11.5 21.5 11.2L12 3.2Z"
                  fill="url(#homeIconGrad)"
                />
                <path
                  d="M10 21V14C10 13.4 10.4 13 11 13H13C13.6 13 14 13.4 14 14V21H10Z"
                  fill="#0E0F14"
                  opacity="0.95"
                />
              </svg>
            </div>
          </div>
        </Link>

        {/* Large Home Title */}
        <Link
          href="/"
          className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-[#F4F5F8] hover:text-white transition-colors select-none"
        >
          {label}
        </Link>

        {/* Navigation Items with Smooth Active Glass Highlights */}
        {showLinks && (
          <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 pl-3 border-l border-white/[0.10]">
            <Link
              href="/clocks"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                pathname === "/clocks"
                  ? "liquid-glass-l3 text-white border-white/25 shadow-inner"
                  : "text-[#A0A2AC] hover:text-[#F4F5F8] hover:bg-white/[0.06]"
              }`}
            >
              World Clocks
            </Link>
            <Link
              href="/planner"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                pathname === "/planner"
                  ? "liquid-glass-l3 text-white border-white/25 shadow-inner"
                  : "text-[#A0A2AC] hover:text-[#F4F5F8] hover:bg-white/[0.06]"
              }`}
            >
              Meeting Planner
            </Link>
            <Link
              href="/zones"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                pathname === "/zones" || pathname === "/globe"
                  ? "liquid-glass-l3 text-white border-white/25 shadow-inner"
                  : "text-[#A0A2AC] hover:text-[#F4F5F8] hover:bg-white/[0.06]"
              }`}
            >
              Timezones
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}