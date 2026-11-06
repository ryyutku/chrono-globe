// src/components/sections/Hero.tsx
import Image from "next/image";
import { Container } from "@/components/layout/Container";

type HeroMedia =
  | { type: "image"; src: string; alt: string; priority?: boolean }
  | { type: "video"; src: string; poster?: string }
  | { type: "custom"; node: React.ReactNode };

interface HeroProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  media?: HeroMedia;
}

export function Hero({ title, subtitle, actions, media }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 isolate">
      {media?.type === "video" && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
          <video
            src={media.src}
            poster={media.poster}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#08090C]/70" />
        </div>
      )}

      <Container className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#F4F5F8] sm:text-6xl drop-shadow-md">
            {title}
          </h1>
          <p className="text-lg text-[#A0A2AC] max-w-xl leading-relaxed">
            {subtitle}
          </p>
          {actions && <div className="flex flex-wrap gap-4 pt-2">{actions}</div>}
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          {media?.type === "custom" && media.node}
        </div>
      </Container>
    </section>
  );
}