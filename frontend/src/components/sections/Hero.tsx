// src/components/sections/Hero.tsx
import { Container } from "@/components/layout/Container";

interface HeroProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  videoSrc?: string;
}

export function Hero({ title, subtitle, actions, videoSrc }: HeroProps) {
  return (
    <section className="relative py-16 sm:py-24 border-b border-[#DCDAD5] bg-[#ECEBE6] overflow-hidden isolate">
      {/* 1. Full-width Background Video */}
      {videoSrc && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {/* Dark scrim overlay so text remains 100% legible against the video */}
          <div className="absolute inset-0 bg-black/0" />
        </div>
      )}

      {/* 2. Foreground Content */}
      <Container className="relative z-10 max-w-4xl flex flex-col items-start gap-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#F04B0B] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
          Canonical IANA Time Engine
        </div>

        <h1
          className={`text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] ${
            videoSrc ? "text-white drop-shadow-md" : "text-[#050505]"
          }`}
        >
          {title}
        </h1>

        <p
          className={`text-base sm:text-xl font-medium max-w-2xl leading-relaxed ${
            videoSrc ? "text-zinc-200 drop-shadow" : "text-[#555555]"
          }`}
        >
          {subtitle}
        </p>

        {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
      </Container>
    </section>
  );
}