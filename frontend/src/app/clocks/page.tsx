// src/app/clocks/page.tsx
"use client";

import { Container } from "@/components/layout/Container";
import { ClockCard } from "@/components/ui/ClockCard";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import Link from "next/link";

export default function WorldClocksPage() {
  const { pairs, removeClockPair, isLoaded } = useSavedClocks();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#08090C] py-16 text-[#F4F5F8]">
        <Container>
          <div className="text-sm text-[#737680]">Loading saved clocks...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090C] py-12 text-[#F4F5F8]">
      <Container>
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              World Clocks
            </h1>
            <p className="mt-1 text-sm text-[#A0A2AC]">
              Real-time synchronized clocks between your saved timezone corridors.
            </p>
          </div>

          <Link
            href="/"
            className="liquid-glass-l3 self-start rounded-full px-4 py-2 text-xs font-semibold text-[#F4F5F8] hover:text-white transition"
          >
            + New Conversion
          </Link>
        </div>

        {/* Clocks Grid */}
        <div className="mt-8">
          {pairs.length === 0 ? (
            <div className="liquid-glass-l1 rounded-3xl p-12 text-center border-dashed border-white/10">
              <h3 className="font-semibold text-white">No saved conversions yet</h3>
              <p className="mt-1 text-sm text-[#737680]">
                Convert a timezone on the home page and save it here.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-semibold text-[#65DDF2] underline hover:text-white"
              >
                Go to Converter
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pairs.map((pair) => (
                <ClockCard
                  key={pair.id}
                  pair={pair}
                  onRemove={removeClockPair}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}