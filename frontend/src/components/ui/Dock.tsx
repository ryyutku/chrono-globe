// src/components/ui/Dock.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface DockItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

interface DockProps {
  items: DockItem[];
  className?: string;
}

export function Dock({ items, className }: DockProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Floating Dock Navigation"
      className={cn("flex items-center justify-center w-full", className)}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full",
          "bg-[#FFFFFF]/90 border border-[#DCDAD5] shadow-lg backdrop-blur-xl"
        )}
      >
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center select-none group"
            >
              {/* Tooltip on hover */}
              <div
                className="absolute -top-10 px-3 py-1 rounded-full bg-[#050505] text-[#ECEBE6] text-[11px] font-semibold tracking-wide shadow-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              >
                {item.label}
              </div>

              {/* Icon Button */}
              <div
                className={cn(
                  "relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-2xl transition-all duration-200",
                  "group-hover:-translate-y-0.5 group-hover:scale-105",
                  isActive
                    ? "bg-[#F4F3EE] border border-[#F04B0B]/30 shadow-inner"
                    : "bg-transparent border border-transparent hover:bg-[#F4F3EE] hover:border-[#DCDAD5]"
                )}
              >
                {/* Icon */}
                <item.icon
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200",
                    isActive
                      ? "text-[#F04B0B]"
                      : "text-[#555555] group-hover:text-[#050505]"
                  )}
                />
              </div>

              {/* Active Dot Indicator */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isActive && (
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[#F04B0B] shadow-[0_0_6px_rgba(240,75,11,0.6)]"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
