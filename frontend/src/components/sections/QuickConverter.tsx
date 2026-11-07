// src/components/sections/QuickConverter.tsx
"use client";

import { useState, useEffect } from "react";
import { resolveZone, convertTime } from "@/lib/api/timezone";
import { ConvertResponse } from "@/types/timezone";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import { Toast } from "@/components/ui/Toast";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
} from "@/lib/utils/calendar";

const STORAGE_KEY = "timespot_conversion_v2";

export function QuickConverter() {
  const [fromQuery, setFromQuery] = useState("New York");
  const [toQuery, setToQuery] = useState("London");
  const [inputTime, setInputTime] = useState("03:15");
  const [inputDate, setInputDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [resolvedFrom, setResolvedFrom] = useState<string | null>("America/New_York");
  const [resolvedTo, setResolvedTo] = useState<string | null>("Europe/London");

  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const { addClockPair } = useSavedClocks();

  const handleSetNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setInputTime(`${hh}:${mm}`);
    setInputDate(now.toISOString().slice(0, 10));
  };

  useEffect(() => {
    if (!fromQuery.trim() || !toQuery.trim()) return;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const [fromRes, toRes] = await Promise.all([
          resolveZone(fromQuery.trim()),
          resolveZone(toQuery.trim()),
        ]);

        const canonicalFrom = fromRes.zone || fromRes.candidates?.[0]?.zone;
        const canonicalTo = toRes.zone || toRes.candidates?.[0]?.zone;

        if (!canonicalFrom || !canonicalTo) {
          setLoading(false);
          return;
        }

        setResolvedFrom(canonicalFrom);
        setResolvedTo(canonicalTo);

        const safeTime = inputTime.trim().length >= 4 ? inputTime.trim() : "12:00";
        const conv = await convertTime({
          when: `${inputDate} ${safeTime}`,
          from_zone: canonicalFrom,
          to_zone: canonicalTo,
        });

        setResult(conv);
      } catch (err) {
        console.error("Conversion failed:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [fromQuery, toQuery, inputTime, inputDate]);

  const handleSaveClock = () => {
    if (!resolvedFrom || !resolvedTo) return;

    const res = addClockPair(resolvedFrom, resolvedTo);
    const fromName = resolvedFrom.split("/").pop()?.replace(/_/g, " ");
    const toName = resolvedTo.split("/").pop()?.replace(/_/g, " ");

    if (res.success) {
      setToast({
        message: `Saved ${fromName} → ${toName} to World Clocks!`,
        type: "success",
      });
    } else {
      setToast({
        message: `${fromName} → ${toName} is already saved.`,
        type: "warning",
      });
    }
  };

  const swapLocations = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
  };

  const parseTime = (isoString?: string) => {
    if (!isoString) return { time: "--:--", period: "AM", date: "Nov 7" };
    const d = new Date(isoString);
    let hours = d.getHours();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const dateFormatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      time: `${String(hours).padStart(2, "0")}:${minutes}`,
      period,
      date: dateFormatted,
    };
  };

  const fromDisplay = parseTime(`${inputDate}T${inputTime}:00`);
  const toDisplay = parseTime(result?.target_local);

  const calendarPayload =
    result && resolvedFrom && resolvedTo
      ? {
          title: `Sync: ${resolvedFrom.split("/").pop()?.replace(/_/g, " ")} / ${resolvedTo.split("/").pop()?.replace(/_/g, " ")}`,
          sourceUtcIso: result.source_utc,
          fromZone: resolvedFrom,
          toZone: resolvedTo,
          sourceLocal: result.source_local,
          targetLocal: result.target_local,
          sourceAbbrev: result.source_abbrev,
          targetAbbrev: result.target_abbrev,
        }
      : null;

  const googleUrl = calendarPayload ? buildGoogleMeetUrl(calendarPayload) : null;
  const teamsUrl = calendarPayload ? buildTeamsMeetingUrl(calendarPayload) : null;

  return (
    <div className="w-full">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Conversion Cards Container */}
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 mt-8">
        
        {/* FROM CARD (White Panel) */}
        <div className="rounded-[24px] bg-[#FFFFFF] border border-[#DCDAD5] p-7 sm:p-8 shadow-sm flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F04B0B]" />
              <span className="text-xs font-black tracking-wider uppercase text-[#050505]">
                FROM
              </span>
            </div>

            <input
              type="text"
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#050505] bg-transparent border-none p-0 focus:outline-none w-full"
            />
            <p className="text-xs font-medium text-[#555555] mt-1">
              {resolvedFrom ? `${resolvedFrom} · ${result?.source_offset || "-05:00"}` : "America/New_York · -05:00"}
            </p>
          </div>

          <div className="mt-8">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-[#050505] tabular-nums">
              {fromDisplay.time}
            </div>
            <div className="text-sm font-bold text-[#050505] mt-1">
              {fromDisplay.period} · {fromDisplay.date}
            </div>
          </div>
        </div>

        {/* Circular Swap Button (↔) */}
        <div className="flex justify-center -my-3 md:my-0 z-10">
          <button
            type="button"
            onClick={swapLocations}
            className="h-12 w-12 rounded-full bg-[#D8D7D2] hover:bg-[#c9c8c3] text-[#050505] flex items-center justify-center text-lg font-bold shadow-sm transition active:scale-95"
            title="Swap cities"
          >
            ↔
          </button>
        </div>

        {/* TO CARD (Solid Black Panel) */}
        <div className="rounded-[24px] bg-[#0A0A0A] text-white p-7 sm:p-8 shadow-md flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F04B0B]" />
              <span className="text-xs font-black tracking-wider uppercase text-white">
                TO
              </span>
            </div>

            <input
              type="text"
              value={toQuery}
              onChange={(e) => setToQuery(e.target.value)}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white bg-transparent border-none p-0 focus:outline-none w-full"
            />
            <p className="text-xs font-medium text-[#888888] mt-1">
              {resolvedTo ? `${resolvedTo} · ${result?.target_offset || "+00:00"}` : "Europe/London · +00:00"}
              {loading && <span className="text-[#F04B0B] ml-2 animate-pulse">...</span>}
            </p>
          </div>

          <div className="mt-8">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white tabular-nums">
              {toDisplay.time}
            </div>
            <div className="text-sm font-bold text-[#888888] mt-1">
              {toDisplay.period} · {toDisplay.date}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Controls Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Date / Time Picker Pills */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] cursor-pointer shadow-sm hover:bg-[#F4F3EE] transition">
            <span>📅</span>
            <span>Select date and time</span>
            <input
              type="time"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={handleSetNow}
            className="flex items-center gap-1.5 rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] shadow-sm hover:bg-[#F4F3EE] transition"
          >
            <span>Now</span>
            <span className="text-[10px]">⌵</span>
          </button>
        </div>

        {/* Right: Meeting Launchers + Save Conversion */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google Meet */}
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#00832d" d="M15 12l4.5-3.5v7L15 12z" />
                <path fill="#0066da" d="M4 6.5A1.5 1.5 0 0 1 5.5 5h8A1.5 1.5 0 0 1 15 6.5V11H4V6.5z" />
                <path fill="#e94235" d="M4 11h11v2H4z" />
                <path fill="#2684fc" d="M4 13h11v4.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 17.5V13z" />
              </svg>
              <span>Google Meet</span>
            </a>
          )}

          {/* Microsoft Teams */}
          {teamsUrl && (
            <a
              href={teamsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#5059C9">
                <path d="M16.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19.5 8.5h-6a1.5 1.5 0 0 0-1.5 1.5v4.25c0 .69.56 1.25 1.25 1.25h5.5c1.24 0 2.25-1.01 2.25-2.25v-3.25c0-.83-.67-1.5-1.5-1.5z" opacity="0.85"/>
                <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM13.5 10.5h-7A2.5 2.5 0 0 0 4 13v5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-5a2.5 2.5 0 0 0-1.5-2.5z" fill="#7B83EB" />
              </svg>
              <span>Teams</span>
            </a>
          )}

          {/* Zoom */}
          <a
            href={getZoomScheduleUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#2D8CFF">
              <path d="M4.5 7h10A1.5 1.5 0 0 1 16 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7zm13 3.5l3.5-2.5v8l-3.5-2.5v-3z" />
            </svg>
            <span>Zoom</span>
          </a>

          {/* Save Conversion */}
          <button
            type="button"
            onClick={handleSaveClock}
            className="rounded-full bg-[#F04B0B] hover:bg-[#d64107] text-white px-6 py-2 text-xs sm:text-sm font-bold tracking-tight shadow-md transition active:scale-95"
          >
            Save Conversion +
          </button>
        </div>
      </div>
    </div>
  );
}