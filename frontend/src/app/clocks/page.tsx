// src/app/clocks/page.tsx
"use client";

import { useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { ClockCard } from "@/components/ui/ClockCard";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import Link from "next/link";

export default function WorldClocksPage() {
  const { pairs, removeClockPair, isLoaded } = useSavedClocks();

  // Generates a lower ratio of black cards (~30% Black, ~70% White)
  const blackCardMap = useMemo(() => {
    const map: Record<string, boolean> = {};

    pairs.forEach((pair, index) => {
      let hash = 0;
      for (let i = 0; i < pair.id.length; i++) {
        hash = (hash << 5) - hash + pair.id.charCodeAt(i);
      }
      // % 3 === 0 assigns roughly 1 black card for every 3 cards
      map[pair.id] = Math.abs(hash + index) % 3 === 0;
    });

    // Ensure at least one black card exists for visual contrast if there are saved clocks
    if (pairs.length > 0 && !Object.values(map).some(Boolean)) {
      map[pairs[0].id] = true;
    }

    return map;
  }, [pairs]);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#E9E9E9] py-16 text-[#050505]">
        <Container>
          <div className="text-sm font-mono text-[#777777]">Loading saved clocks...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E9E9E9] py-12 text-[#050505]">
      <Container>
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#D0D0D0] pb-6 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#050505]">
              World Clocks
            </h1>
            <p className="mt-1 text-sm font-medium text-[#777777]">
              Track real-time differences across your saved timezone corridors.
            </p>
          </div>

          <Link
            href="/"
            className="self-start rounded-full bg-[#050505] px-4 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#F04B0B] transition"
          >
            + New Conversion
          </Link>
        </div>

        {/* Grid */}
        <div className="mt-8">
          {pairs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D0D0D0] bg-[#FFFFFF] p-12 text-center">
              <h3 className="font-bold text-[#050505]">No saved clocks yet</h3>
              <p className="mt-1 text-xs text-[#777777]">
                Convert any time on the Home page and click Save Clock to pin it here.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-xs font-bold text-[#F04B0B] underline"
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
                  isPrimary={Boolean(blackCardMap[pair.id])} // Mostly white, occasional black
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