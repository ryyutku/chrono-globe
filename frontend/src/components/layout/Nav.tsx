// src/components/layout/Nav.tsx

"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { PrismaticGlassNav } from "@/components/ui/PrismaticGlassNav";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 py-3 sm:py-4 ${
        scrolled
          ? "bg-[#08090C]/65 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_16px_36px_-12px_rgba(0,0,0,0.85)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <Container className="flex items-center justify-between">
        {/* Preserved Signature Prismatic Navigation Unit */}
        <PrismaticGlassNav label="Home" showLinks={true} />

        {/* UTC Status Indicator - Cyan accent instead of green */}
        <div className="liquid-glass-l3 hidden sm:flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-mono font-medium text-[#A0A2AC]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#65DDF2] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#65DDF2]" />
          </span>
          <span className="text-[#F4F5F8]">UTC Ready</span>
        </div>
      </Container>
    </header>
  );
}