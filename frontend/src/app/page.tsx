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
              className="rounded-full bg-[#F04B0B] px-5 py-2.5 text-sm font-bold text-[#FFFFFF] shadow-sm hover:bg-[#d44008] transition"
            >
              Open World Clocks
            </Link>
            <Link
              href="/planner"
              className="rounded-full border border-[#D0D0D0] bg-[#FFFFFF] px-5 py-2.5 text-sm font-bold text-[#050505] hover:bg-[#E9E9E9] transition"
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