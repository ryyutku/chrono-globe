// src/app/page.tsx

import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { FeaturePreview } from "@/components/sections/FeaturePreview";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Hero
        title="Time across borders, simplified."
        subtitle="Search cities, countries, or abbreviations. Built on canonical IANA timezones to handle daylight saving without headaches."
        actions={
          <>
            <Link
              href="/clocks"
              className="liquid-glass-l3 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 hover:border-white/30 shadow-lg"
            >
              Open World Clocks
            </Link>
            <Link
              href="/planner"
              className="liquid-glass-l2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#A0A2AC] transition hover:text-white hover:bg-white/10"
            >
              Plan a Meeting
            </Link>
          </>
        }
        media={{
          type: "video",
          src : "/videos/earth.mp4",
        }}
      />

      <FeaturePreview />
    </main>
  );
}