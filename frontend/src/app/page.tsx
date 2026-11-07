// src/app/page.tsx
import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { FeaturePreview } from "@/components/sections/FeaturePreview";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero
        videoSrc="/videos/earth.mp4"
        title="Time across borders, simplified."
        subtitle="Search cities, countries, or abbreviations. Built on canonical IANA timezones to handle daylight saving without headaches."
        actions={
          <>
            <Link
              href="/clocks"
              className="rounded-full bg-[#F04B0B] px-5 py-2.5 text-sm font-bold text-[#FFFFFF] shadow-md hover:bg-[#d44008] transition"
            >
              Open World Clocks
            </Link>
            <Link
              href="/planner"
              className="rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition shadow-sm"
            >
              Plan a Meeting
            </Link>
          </>
        }
      />

      <FeaturePreview />
    </main>
  );
}