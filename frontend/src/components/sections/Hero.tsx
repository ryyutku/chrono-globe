// src/components/sections/Hero.tsx
import { Container } from "@/components/layout/Container";

interface HeroProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export function Hero({ title, subtitle, actions }: HeroProps) {
  return (
    <section className="relative py-14 sm:py-20 border-b border-[#DCDAD5] bg-[#ECEBE6]">
      <Container className="max-w-4xl flex flex-col items-start gap-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD5] bg-[#FFFFFF] px-3.5 py-1 text-xs font-bold text-[#F04B0B] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />
          Canonical IANA Time Engine
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-[#050505] leading-[0.95]">
          {title}
        </h1>
        <p className="text-base sm:text-xl font-medium text-[#555555] max-w-2xl leading-relaxed">
          {subtitle}
        </p>
        {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
      </Container>
    </section>
  );
}