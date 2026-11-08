// src/components/ui/ClockCard.tsx
"use client";

import { useState, useEffect } from "react";
import { SavedClockPair } from "@/types/clock";

interface ClockCardProps {
  pair: SavedClockPair;
  isPrimary?: boolean;
  onRemove: (id: string) => void;
}

export function ClockCard({ pair, isPrimary = false, onRemove }: ClockCardProps) {
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

  const cardBg = isPrimary ? "bg-[#050505] text-[#FFFFFF] border-[#050505]" : "bg-[#FFFFFF] text-[#050505] border-[#D0D0D0]";
  const mutedText = isPrimary ? "text-[#A0A0A0]" : "text-[#777777]";
  const dividerBorder = isPrimary ? "border-[#171717]" : "border-[#E9E9E9]";

  return (
    <div className={`group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${cardBg}`}>
      {/* Remove Button */}
      <button
        onClick={() => onRemove(pair.id)}
        className={`absolute top-4 right-4 text-xs p-1 font-bold transition ${mutedText} hover:text-[#F04B0B]`}
        title="Remove clock"
      >
        ✕
      </button>

      {/* Main City Time */}
      <div>
        <div className="flex items-center gap-2">
          {isPrimary && <span className="h-2 w-2 rounded-full bg-[#F04B0B]" />}
          <h3 className="text-base font-black uppercase tracking-tight">
            {fromCity}
          </h3>
        </div>
        <p className={`font-mono text-[11px] ${mutedText} truncate`}>
          {pair.fromZone}
        </p>

        <div className="my-3 font-mono text-4xl font-black tracking-tight tabular-nums">
          {fromTime || "--:--:--"}
        </div>
      </div>

      {/* Destination Reference Line */}
      <div className={`mt-2 border-t pt-3 flex items-center justify-between text-xs ${dividerBorder}`}>
        <span className={mutedText}>↳ {toCity}:</span>
        <span className="font-mono font-bold tabular-nums">
          {toTime || "--:--:--"}
        </span>
      </div>
    </div>
  );
}