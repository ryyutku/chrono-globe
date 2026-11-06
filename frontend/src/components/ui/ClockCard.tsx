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
    <div className="liquid-glass-l2 group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-white/25 hover:shadow-2xl">
      
      {/* Remove Button */}
      <button
        onClick={() => onRemove(pair.id)}
        className="absolute top-4 right-4 text-[#737680] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs"
        title="Remove clock pair"
      >
        ✕
      </button>

      {/* Origin (From) - Big Display */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#65DDF2] animate-pulse" />
          <span className="text-xs font-semibold text-[#A0A2AC] uppercase tracking-wider">
            {fromCity}
          </span>
          <span className="text-[10px] font-mono text-[#737680] truncate max-w-[120px]">
            {pair.fromZone}
          </span>
        </div>

        <div className="my-3 flex items-center justify-between">
          <div className="font-mono text-3xl font-black tracking-tight text-[#F4F5F8] sm:text-4xl">
            {fromTime || "--:--:--"}
          </div>

          {/* Reserved Analog Dial Slot */}
          <div 
            className="liquid-glass-l3 relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            title="Analog dial slot"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#65DDF2]" />
          </div>
        </div>
      </div>

      {/* Destination (To) - Secondary Display */}
      <div className="mt-2 border-t border-white/[0.08] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#A0A2AC]">
          <span className="text-[#737680]">↳</span>
          <span className="font-medium text-[#F4F5F8]">{toCity}:</span>
        </div>

        <div className="font-mono text-lg font-bold text-[#A0A2AC]">
          {toTime || "--:--:--"}
        </div>
      </div>

    </div>
  );
}