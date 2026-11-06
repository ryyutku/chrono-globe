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
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Open World Clocks
            </Link>
            <Link
              href="/planner"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
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