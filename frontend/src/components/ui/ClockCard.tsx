// src/components/ui/ClockCard.tsx

"use client";

import { useState, useEffect } from "react";
import { SavedClockPair } from "@/types/clock";

interface ClockCardProps {
  pair: SavedClockPair;
  onRemove: (id: string) => void;
}

export function ClockCard({ pair, onRemove }: ClockCardProps) {
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  // Live ticking clocks for both zones
  useEffect(() => {
    function tick() {
      const now = new Date();

      const formatTime = (tz: string) =>
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);

      try {
        setFromTime(formatTime(pair.fromZone));
        setToTime(formatTime(pair.toZone));
      } catch {
        // fallback
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pair.fromZone, pair.toZone]);

  const cleanName = (z: string) => z.split("/").pop()?.replace(/_/g, " ") ?? z;
  const fromCity = cleanName(pair.fromZone);
  const toCity = cleanName(pair.toZone);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/70 shadow-lg">
      
      {/* Remove button */}
      <button
        onClick={() => onRemove(pair.id)}
        className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs"
        title="Remove clock pair"
      >
        ✕
      </button>

      {/* TOP: Origin (From) - BIG TIME DISPLAY */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {fromCity}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[120px]">
            {pair.fromZone}
          </span>
        </div>

        <div className="my-3 flex items-center justify-between">
          {/* BIG DIGITAL TIME */}
          <div className="font-mono text-3xl font-black tracking-tight text-white sm:text-4xl">
            {fromTime || "--:--:--"}
          </div>

          {/* 
            =======================================================
            FUTURE ANALOG CLOCK SLOT:
            Keep this reserved for SVG / CSS analog clock hands
            =======================================================
          */}
          <div 
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 shadow-inner"
            title="Analog clock dial slot"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          </div>
        </div>
      </div>

      {/* BOTTOM: Destination (To) - SMALLER SECONDARY DISPLAY */}
      <div className="mt-2 border-t border-zinc-800/80 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="text-zinc-600">↳</span>
          <span className="font-medium text-zinc-300">{toCity}:</span>
        </div>

        {/* SMALLER DIGITAL TIME */}
        <div className="font-mono text-lg font-bold text-zinc-300">
          {toTime || "--:--:--"}
        </div>
      </div>

    </div>
  );
}