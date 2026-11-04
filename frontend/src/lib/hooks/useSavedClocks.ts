// src/lib/hooks/useSavedClocks.ts

"use client";

import { useState, useEffect } from "react";
import { SavedClockPair } from "@/types/clock";

const STORAGE_KEY = "chrono_saved_clock_pairs";

const DEFAULT_PAIRS: SavedClockPair[] = [
  {
    id: "America/New_York->Asia/Tokyo",
    fromZone: "America/New_York",
    toZone: "Asia/Tokyo",
    savedAt: Date.now(),
  },
  {
    id: "Europe/London->Asia/Kolkata",
    fromZone: "Europe/London",
    toZone: "Asia/Kolkata",
    savedAt: Date.now(),
  },
];

export function useSavedClocks() {
  const [pairs, setPairs] = useState<SavedClockPair[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPairs(JSON.parse(stored));
      } else {
        setPairs(DEFAULT_PAIRS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAIRS));
      }
    } catch {
      setPairs(DEFAULT_PAIRS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addClockPair = (
    fromZone: string,
    toZone: string
  ): { success: boolean; reason?: "duplicate" } => {
    const pairId = `${fromZone}->${toZone}`;

    // Duplicate check
    const exists = pairs.some((p) => p.id === pairId);
    if (exists) {
      return { success: false, reason: "duplicate" };
    }

    const newPair: SavedClockPair = {
      id: pairId,
      fromZone,
      toZone,
      savedAt: Date.now(),
    };

    const updated = [newPair, ...pairs];
    setPairs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  };

  const removeClockPair = (pairId: string) => {
    const updated = pairs.filter((p) => p.id !== pairId);
    setPairs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { pairs, addClockPair, removeClockPair, isLoaded };
}