// src/lib/hooks/useSavedClocks.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { SavedClockPair } from "@/types/clock";

const STORAGE_KEY = "timespot_saved_clock_pairs";

const DEFAULT_PAIRS: SavedClockPair[] = [
  {
    id: "Europe/London->Asia/Colombo",
    fromZone: "Europe/London",
    toZone: "Asia/Colombo",
    savedAt: 1,
  },
  {
    id: "Asia/Colombo->America/New_York",
    fromZone: "Asia/Colombo",
    toZone: "America/New_York",
    savedAt: 2,
  },
  {
    id: "America/New_York->Asia/Tokyo",
    fromZone: "America/New_York",
    toZone: "Asia/Tokyo",
    savedAt: 3,
  },
];

function getStoredPairs(): SavedClockPair[] {
  if (typeof window === "undefined") return DEFAULT_PAIRS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAIRS));
      return DEFAULT_PAIRS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAIRS;
  } catch {
    return DEFAULT_PAIRS;
  }
}

export function useSavedClocks() {
  // Synchronous initial load — zero race conditions
  const [pairs, setPairs] = useState<SavedClockPair[]>(getStoredPairs);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const handleSync = () => {
      setPairs(getStoredPairs());
    };

    // Keep tabs and components synchronized in real-time
    window.addEventListener("storage", handleSync);
    window.addEventListener("timespot_clocks_sync", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("timespot_clocks_sync", handleSync);
    };
  }, []);

  const addClockPair = useCallback(
    (fromZone: string, toZone: string): { success: boolean; reason?: "duplicate" } => {
      const pairId = `${fromZone}->${toZone}`;
      const current = getStoredPairs();

      if (current.some((p) => p.id === pairId)) {
        return { success: false, reason: "duplicate" };
      }

      const newPair: SavedClockPair = {
        id: pairId,
        fromZone,
        toZone,
        savedAt: Date.now(),
      };

      const updated = [newPair, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPairs(updated);
      window.dispatchEvent(new Event("timespot_clocks_sync"));

      return { success: true };
    },
    []
  );

  const removeClockPair = useCallback((pairId: string) => {
    const current = getStoredPairs();
    const updated = current.filter((p) => p.id !== pairId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPairs(updated);
    window.dispatchEvent(new Event("timespot_clocks_sync"));
  }, []);

  return { pairs, addClockPair, removeClockPair, isLoaded };
}