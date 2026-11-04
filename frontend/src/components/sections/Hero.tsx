// src/components/sections/Hero.tsx

import Image from "next/image";
import { Container } from "@/components/layout/Container";

type HeroMedia =
  | {
      type: "image";
      src: string;
      alt: string;
      priority?: boolean;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
    }
  | {
      type: "custom";
      node: React.ReactNode;
    };

interface HeroProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  media?: HeroMedia;
}

export function Hero({ title, subtitle, actions, media }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 isolate">
      {/* 1. Full-width Background Video (Layer 0) */}
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
          {/* Subtle dark tint so the white text stays readable without darkening the earth completely */}
          <div className="absolute inset-0 bg-zinc-950/40" />
        </div>
      )}

      {/* Background Image fallback if media type is image */}
      {media?.type === "image" && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
          <Image
            src={media.src}
            alt={media.alt}
            fill
            priority={media.priority}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-zinc-950/40" />
        </div>
      )}

      {/* 2. Text Content (Layer 10) - Uses original 2-column grid so text position stays identical */}
      <Container className="relative overflow-hidden min-h-[50vh] flex items-center isolate">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {title}
          </h1>
          <p className="text-lg text-zinc-300 max-w-xl">
            {subtitle}
          </p>
          {actions && <div className="flex flex-wrap gap-4">{actions}</div>}
        </div>

        {/* The right column is left open so the earth video shows through naturally */}
        <div className="hidden lg:block" />
      </Container>
    </section>
  );
}