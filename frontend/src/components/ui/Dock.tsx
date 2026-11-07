// src/components/ui/Dock.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <nav
      aria-label="Floating Dock Navigation"
      className={cn("flex items-center justify-center w-full", className)}
    >
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-full",
          "liquid-glass-l1 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.85)]",
          "backdrop-blur-2xl"
        )}
      >
        {items.map((item, i) => {
          const isActive = pathname === item.href;
          const isHovered = hoveredIndex === i;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex flex-col items-center select-none group"
            >
              {/* Floating Liquid Glass Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute -top-10 px-3 py-1 rounded-full liquid-glass-l3 border border-white/20 text-[11px] font-medium tracking-wide text-[#F4F5F8] shadow-xl whitespace-nowrap pointer-events-none z-50"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Magnifying Icon Button */}
              <motion.div
                animate={{
                  scale: isHovered ? 1.22 : 1,
                  y: isHovered ? -3 : 0,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className={cn(
                  "relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-white/[0.14] border border-white/25 shadow-inner"
                    : "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20"
                )}
              >
                {/* Luminous Glow Ring on Hover */}
                {isHovered && (
                  <motion.span
                    layoutId="dock-glow"
                    className="absolute inset-0 rounded-2xl border border-[#65DDF2]/60 shadow-[0_0_15px_rgba(101,221,242,0.35)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Icon */}
                <item.icon
                  className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200",
                    isActive
                      ? "text-[#65DDF2] drop-shadow-[0_0_8px_rgba(101,221,242,0.6)]"
                      : "text-[#A0A2AC] group-hover:text-[#F4F5F8]"
                  )}
                />
              </motion.div>

              {/* Active Dot Indicator */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isActive && (
                  <motion.div
                    layoutId="dock-active-dot"
                    className="h-1.5 w-1.5 rounded-full bg-[#65DDF2] shadow-[0_0_8px_#65DDF2]"
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}