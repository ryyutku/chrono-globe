// src/components/sections/Hero.tsx
import { Container } from "@/components/layout/Container";

interface HeroProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  media?: { type: "custom"; node: React.ReactNode } | any;
}

export function Hero({ title, subtitle, actions, media }: HeroProps) {
  return (
    <section className="relative py-14 sm:py-20 border-b border-[#D0D0D0] bg-[#E9E9E9]">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        {/* Left Column: Bold Typography */}
        <div className="flex flex-col items-start gap-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D0D0D0] bg-[#FFFFFF] px-3 py-1 text-xs font-bold text-[#F04B0B]">
            <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
            Canonical IANA Time Engine
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#050505] leading-none">
            {title}
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#777777] max-w-lg leading-relaxed">
            {subtitle}
          </p>
          {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center lg:justify-end">
          {media?.node ? (
            media.node
          ) : (
            <div className="w-full max-w-sm rounded-2xl border border-[#D0D0D0] bg-[#FFFFFF] p-6 shadow-sm">
              <span className="text-xs font-black uppercase text-[#F04B0B]">Instant Utility</span>
              <div className="mt-2 text-3xl font-black font-mono tabular-nums text-[#050505]">
                UTC 00:00
              </div>
              <p className="text-xs text-[#777777] mt-1">Global Standard Time</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}