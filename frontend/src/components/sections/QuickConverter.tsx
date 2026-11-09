// src/components/sections/QuickConverter.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { resolveZone, convertTime } from "@/lib/api/timezone";
import { ConvertResponse } from "@/types/timezone";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import { Toast } from "@/components/ui/Toast";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
} from "@/lib/utils/calendar";

const STORAGE_KEY = "timespot_home_converter_state_v6";

interface ConverterPersistedState {
  fromQuery: string;
  toQuery: string;
  inputTime: string;
  inputDate: string;
  resolvedFrom: string | null;
  resolvedTo: string | null;
  result: ConvertResponse | null;
}

function getInitialConverterState(): ConverterPersistedState {
  if (typeof window === "undefined") {
    return {
      fromQuery: "thailand",
      toQuery: "new york",
      inputTime: "18:06",
      inputDate: new Date().toISOString().slice(0, 10),
      resolvedFrom: "Asia/Bangkok",
      resolvedTo: "America/New_York",
      result: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fromQuery: parsed.fromQuery || "thailand",
        toQuery: parsed.toQuery || "new york",
        inputTime: parsed.inputTime || "18:06",
        inputDate: parsed.inputDate || new Date().toISOString().slice(0, 10),
        resolvedFrom: parsed.resolvedFrom || "Asia/Bangkok",
        resolvedTo: parsed.resolvedTo || "America/New_York",
        result: parsed.result || null,
      };
    }
  } catch {}

  return {
    fromQuery: "thailand",
    toQuery: "new york",
    inputTime: "18:06",
    inputDate: new Date().toISOString().slice(0, 10),
    resolvedFrom: "Asia/Bangkok",
    resolvedTo: "America/New_York",
    result: null,
  };
}

// Parses pure 24-hour format ("HH:MM") without converting to 12-hour or local browser timezone
function parseTargetIso24(isoString?: string) {
  if (!isoString) return { time: "--:--", date: "—" };

  const [datePart, timePartWithOffset] = isoString.split("T");
  if (!timePartWithOffset) return { time: "--:--", date: "—" };

  // Pure 24-hour format: "HH:MM" (e.g. 18:06, 06:06, 23:45)
  const time24 = timePartWithOffset.slice(0, 5);

  // Parse date purely in UTC to prevent day shifting
  const [year, month, day] = datePart.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dateFormatted = dateObj.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });

  return {
    time: time24,
    date: dateFormatted,
  };
}

export function QuickConverter() {
  const initial = getInitialConverterState();

  const [fromQuery, setFromQuery] = useState(initial.fromQuery);
  const [toQuery, setToQuery] = useState(initial.toQuery);
  const [inputTime, setInputTime] = useState(initial.inputTime);
  const [inputDate, setInputDate] = useState(initial.inputDate);

  const [resolvedFrom, setResolvedFrom] = useState<string | null>(initial.resolvedFrom);
  const [resolvedTo, setResolvedTo] = useState<string | null>(initial.resolvedTo);
  const [result, setResult] = useState<ConvertResponse | null>(initial.result);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const { addClockPair } = useSavedClocks();

  const handleSetNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setInputTime(`${hh}:${mm}`);
    setInputDate(now.toISOString().slice(0, 10));
  };

  // 24-hour input handler
  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (/^[0-9:]*$/.test(val) && val.length <= 5) {
      if (val.length === 4 && !val.includes(":")) {
        val = `${val.slice(0, 2)}:${val.slice(2, 4)}`;
      }
      setInputTime(val);
    }
  };

  // Clamps numbers cleanly on blur (00:00 to 23:59)
  const handleTimeBlur = () => {
    const digits = inputTime.replace(/[^0-9]/g, "");
    let h = 12;
    let m = 0;

    if (inputTime.includes(":")) {
      const parts = inputTime.split(":");
      h = parseInt(parts[0], 10) || 0;
      m = parseInt(parts[1], 10) || 0;
    } else if (digits.length >= 3) {
      h = parseInt(digits.slice(0, digits.length - 2), 10) || 0;
      m = parseInt(digits.slice(-2), 10) || 0;
    } else if (digits.length > 0) {
      h = parseInt(digits, 10) || 0;
      m = 0;
    }

    if (h > 23) h = 23;
    if (h < 0) h = 0;
    if (m > 59) m = 59;
    if (m < 0) m = 0;

    setInputTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  // Toggle AM/PM helper by shifting 12 hours
  const handleTogglePeriod = () => {
    let h = 12;
    let m = "00";

    if (inputTime.includes(":")) {
      const parts = inputTime.split(":");
      h = parseInt(parts[0], 10) || 0;
      m = parts[1]?.slice(0, 2) || "00";
    }

    if (h >= 12) {
      h = h - 12;
    } else {
      h = h + 12;
    }

    setInputTime(`${String(h).padStart(2, "0")}:${m.padStart(2, "0")}`);
  };

  const getFromPeriodInfo = () => {
    let h = 12;
    if (inputTime.includes(":")) {
      h = parseInt(inputTime.split(":")[0], 10) || 0;
    }
    const period = h >= 12 ? "PM" : "AM";

    const [year, month, day] = inputDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    });

    return { period, date: formattedDate };
  };

  const fromPeriodInfo = getFromPeriodInfo();

  // Conversion Pipeline
  useEffect(() => {
    if (!fromQuery.trim() || !toQuery.trim()) return;
    if (!inputTime.includes(":") || inputTime.trim().length < 4) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      if (isMounted) setLoading(true);

      try {
        const [fromRes, toRes] = await Promise.all([
          resolveZone(fromQuery.trim()),
          resolveZone(toQuery.trim()),
        ]);

        if (!isMounted) return;

        const canonicalFrom = fromRes.zone || fromRes.candidates?.[0]?.zone;
        const canonicalTo = toRes.zone || toRes.candidates?.[0]?.zone;

        if (!canonicalFrom || !canonicalTo) {
          setLoading(false);
          return;
        }

        setResolvedFrom(canonicalFrom);
        setResolvedTo(canonicalTo);

        const [hPart, mPart] = inputTime.split(":");
        let h = parseInt(hPart, 10) || 0;
        let m = parseInt(mPart, 10) || 0;
        if (h > 23) h = 23;
        if (m > 59) m = 59;
        const safeTime24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        const conv = await convertTime({
          when: `${inputDate} ${safeTime24}`,
          from_zone: canonicalFrom,
          to_zone: canonicalTo,
        });

        if (!isMounted) return;

        setResult(conv);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            fromQuery,
            toQuery,
            inputTime: safeTime24,
            inputDate,
            resolvedFrom: canonicalFrom,
            resolvedTo: canonicalTo,
            result: conv,
          })
        );
      } catch (err) {
        console.error("Conversion failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fromQuery, toQuery, inputTime, inputDate]);

  const handleSaveClock = () => {
    if (!resolvedFrom || !resolvedTo) return;
    const res = addClockPair(resolvedFrom, resolvedTo);
    const fromName = resolvedFrom.split("/").pop()?.replace(/_/g, " ");
    const toName = resolvedTo.split("/").pop()?.replace(/_/g, " ");

    if (res.success) {
      setToast({ message: `Saved ${fromName} → ${toName} to World Clocks!`, type: "success" });
    } else {
      setToast({ message: `${fromName} → ${toName} is already saved.`, type: "warning" });
    }
  };

  const swapLocations = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
  };

  // Clean 24-hour target display
  const toDisplay = parseTargetIso24(result?.target_local);

  const calendarPayload =
    result && resolvedFrom && resolvedTo
      ? {
          title: `Sync: ${resolvedFrom.split("/").pop()?.replace(/_/g, " ")} / ${resolvedTo.split("/").pop()?.replace(/_/g, " ")}`,
          sourceUtcIso: result.source_utc,
          fromZone: resolvedFrom,
          toZone: resolvedTo,
          sourceLocal: result.source_local,
          targetLocal: result.target_local,
          sourceAbbrev: "UTC",
          targetAbbrev: "UTC",
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

      {/* Hidden Native Date Input */}
      <input
        ref={dateInputRef}
        type="date"
        value={inputDate}
        onChange={(e) => {
          if (e.target.value) setInputDate(e.target.value);
        }}
        className="sr-only"
      />

      {/* Side-by-Side Conversion Panels */}
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 mt-8">
        
        {/* FROM CARD */}
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
            <p className="text-xs font-medium text-[#555555] mt-1 truncate">
              {resolvedFrom ? `${resolvedFrom} · ${result?.source_offset || "+07:00"}` : "Asia/Bangkok · +07:00"}
            </p>
          </div>

          <div className="mt-8">
            <input
              type="text"
              inputMode="numeric"
              value={inputTime}
              onChange={handleTimeInput}
              onBlur={handleTimeBlur}
              placeholder="00:00"
              className="w-full text-6xl sm:text-7xl font-black font-mono tracking-tight text-[#050505] bg-transparent border-none p-0 focus:outline-none tabular-nums selection:bg-[#F04B0B] selection:text-white"
              title="Type 24-hour time (e.g. 18:06 or 03:15)"
            />
            
            <div className="text-sm font-bold text-[#050505] mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePeriod}
                className="rounded-full bg-[#EAE9E4] hover:bg-[#F04B0B] hover:text-white px-2.5 py-0.5 text-xs font-black transition cursor-pointer select-none"
                title="Click to toggle AM / PM"
              >
                {fromPeriodInfo.period} ⇄
              </button>
              <span>· {fromPeriodInfo.date}</span>
            </div>
          </div>
        </div>

        {/* Swap Button */}
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

        {/* TO CARD (Pure 24-Hour Display) */}
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
            <p className="text-xs font-medium text-[#888888] mt-1 truncate">
              {resolvedTo ? `${resolvedTo} · ${result?.target_offset || "-05:00"}` : "America/New_York · -05:00"}
              {loading && <span className="text-[#F04B0B] ml-2 animate-pulse">...</span>}
            </p>
          </div>

          {/* 24-Hour Formatted Converted Time */}
          <div className="mt-8">
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white tabular-nums">
              {toDisplay.time}
            </div>
            <div className="text-sm font-bold text-[#888888] mt-1">
              {toDisplay.date}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Controls Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {/* Date Selector & Now Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()}
            className="flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] shadow-sm hover:bg-[#F4F3EE] transition"
          >
            <svg className="h-4 w-4 text-[#050505]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{fromPeriodInfo.date} · {inputTime}</span>
          </button>

          <button
            type="button"
            onClick={handleSetNow}
            className="flex items-center gap-1.5 rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2 text-xs font-bold text-[#050505] shadow-sm hover:bg-[#F4F3EE] transition"
          >
            <span>Now</span>
            <span className="text-[10px]">⌵</span>
          </button>
        </div>

        {/* Meeting Buttons & Save */}
        <div className="flex flex-wrap items-center gap-2">
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