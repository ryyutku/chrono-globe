// src/app/clocks/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { ClockCard } from "@/components/ui/ClockCard";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import { ZoneCandidate } from "@/types/timezone";
import { resolveZone } from "@/lib/api/timezone";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WorldClocksPage() {
  const { pairs, removeClockPair, isLoaded } = useSavedClocks();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 py-16 text-zinc-100">
        <Container>
          <div className="text-sm text-zinc-500">Loading your saved clocks...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 py-12 text-zinc-100">
      <Container>
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              World Clocks
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Live conversions between your origin and destination timezones.
            </p>
          </div>

          <Link
            href="/"
            className="self-start rounded-lg bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
          >
            + New Conversion
          </Link>
        </div>

        {/* Clocks Grid */}
        <div className="mt-8">
          {pairs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
              <h3 className="font-semibold text-white">No saved conversions yet</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Use the converter on the homepage to save a timezone pair.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-sm text-zinc-300 underline hover:text-white"
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