// src/components/sections/QuickConverter.tsx
"use client";

import { useState, useEffect } from "react";
import { resolveZone, convertTime } from "@/lib/api/timezone";
import { ConvertResponse } from "@/types/timezone";
import { FlipCard } from "@/components/ui/FlipDigit";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import { Toast } from "@/components/ui/Toast";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
} from "@/lib/utils/calendar";

const STORAGE_KEY = "chrono_last_conversion";

function getStored(key: "from" | "to" | "time", fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data[key] || fallback;
  } catch {
    return fallback;
  }
}

function formatOffset(abbrev?: string, offset?: string): string {
  if (!offset) return "—";
  if (
    !abbrev ||
    abbrev === offset ||
    abbrev.replace(":", "") === offset.replace(":", "") ||
    abbrev.startsWith("+") ||
    abbrev.startsWith("-")
  ) {
    return `UTC${offset}`;
  }
  return `${abbrev} (${offset})`;
}

export function QuickConverter() {
  const [fromQuery, setFromQuery] = useState(() => getStored("from", "sri lanka"));
  const [toQuery, setToQuery] = useState(() => getStored("to", "england"));
  const [inputTime, setInputTime] = useState(() => getStored("time", "14:30"));
  const [zoomLink, setZoomLink] = useState("");

  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [resolvedTo, setResolvedTo] = useState<string | null>(null);

  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { addClockPair } = useSavedClocks();
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const handleSetCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setInputTime(`${hours}:${minutes}`);
  };

  useEffect(() => {
    if (!fromQuery.trim() || !toQuery.trim()) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [fromRes, toRes] = await Promise.all([
          resolveZone(fromQuery.trim()),
          resolveZone(toQuery.trim()),
        ]);

        const canonicalFrom = fromRes.zone || fromRes.candidates?.[0]?.zone;
        const canonicalTo = toRes.zone || toRes.candidates?.[0]?.zone;

        if (!canonicalFrom) {
          setErrorMessage(`Unknown location: "${fromQuery}"`);
          return;
        }

        if (!canonicalTo) {
          setErrorMessage(`Unknown location: "${toQuery}"`);
          return;
        }

        setResolvedFrom(canonicalFrom);
        setResolvedTo(canonicalTo);

        const safeTime = inputTime.trim().length >= 4 ? inputTime.trim() : "12:00";
        const today = new Date().toISOString().slice(0, 10);

        const conv = await convertTime({
          when: `${today} ${safeTime}`,
          from_zone: canonicalFrom,
          to_zone: canonicalTo,
        });

        setResult(conv);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ from: fromQuery, to: toQuery, time: safeTime })
        );
      } catch (err: unknown) {
        console.error("Conversion error:", err);
        if (err instanceof Error) setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [fromQuery, toQuery, inputTime]);

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

  const swapQueries = () => {
    setFromQuery(toQuery);
    setToQuery(fromQuery);
  };

  const targetTimeStr = result?.target_local
    ? result.target_local.split("T")[1]?.slice(0, 5) ?? "00:00"
    : "00:00";

  const [targetHours, targetMins] = targetTimeStr.split(":");

  const meetingPayload =
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
          zoomLink: zoomLink.trim(),
        }
      : null;

  const googleUrl = meetingPayload ? buildGoogleMeetUrl(meetingPayload) : null;
  const teamsUrl = meetingPayload ? buildTeamsMeetingUrl(meetingPayload) : null;

  return (
    <div className="liquid-glass-l1 relative mx-auto max-w-4xl rounded-3xl p-6 sm:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Origin, Swap, Destination Fields */}
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-7">
        
        {/* Origin Column */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold tracking-wider text-[#A0A2AC] uppercase mb-2">
            Origin
          </label>
          <input
            type="text"
            value={fromQuery}
            onChange={(e) => setFromQuery(e.target.value)}
            placeholder="e.g. Sri Lanka, New York, CST"
            className="liquid-glass-recessed w-full rounded-2xl px-4 py-2.5 text-sm text-[#F4F5F8] placeholder-[#737680] focus:border-[#65DDF2]/60 focus:ring-1 focus:ring-[#65DDF2]/40 focus:outline-none transition-all"
          />

          {/* Time Picker Bar */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="liquid-glass-recessed flex items-center gap-2 rounded-xl px-3 py-1.5 focus-within:border-[#65DDF2]/50 transition-all">
              <span className="text-xs text-[#737680] select-none">🕒</span>
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                title="Edit conversion time"
                className="bg-transparent font-mono text-sm font-semibold text-[#F4F5F8] focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="liquid-glass-l3 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-[#A0A2AC] hover:text-white transition"
              >
                Now
              </button>
            </div>

            {resolvedFrom && (
              <span className="text-[11px] font-mono text-[#737680] truncate max-w-[130px]" title={resolvedFrom}>
                {resolvedFrom}
              </span>
            )}
          </div>
        </div>

        {/* Swap Control */}
        <div className="flex sm:h-[46px] items-center justify-center sm:col-span-1">
          <button
            type="button"
            onClick={swapQueries}
            className="liquid-glass-l3 mt-6 sm:mt-0 rounded-2xl p-3 text-[#A0A2AC] transition hover:text-[#F4F5F8] hover:border-white/25 active:scale-95"
            title="Swap locations"
          >
            ⇄
          </button>
        </div>

        {/* Destination Column */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold tracking-wider text-[#A0A2AC] uppercase mb-2">
            Destination
          </label>
          <input
            type="text"
            value={toQuery}
            onChange={(e) => setToQuery(e.target.value)}
            placeholder="e.g. England, Tokyo, London"
            className="liquid-glass-recessed w-full rounded-2xl px-4 py-2.5 text-sm text-[#F4F5F8] placeholder-[#737680] focus:border-[#65DDF2]/60 focus:ring-1 focus:ring-[#65DDF2]/40 focus:outline-none transition-all"
          />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#737680] px-1">
            {resolvedTo ? (
              <span className="font-mono truncate" title={resolvedTo}>{resolvedTo}</span>
            ) : (
              <span>Resolves place, abbr, or coords</span>
            )}
            {loading && <span className="text-[#65DDF2] animate-pulse font-medium">Calculating...</span>}
          </div>
        </div>

      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl bg-red-950/30 border border-red-500/20 p-2.5 text-center text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Bottom Area: Origin Offset / Digital Clock / Unified Glass Actions */}
      <div className="mt-8 grid grid-cols-1 items-center gap-6 border-t border-white/[0.08] pt-8 lg:grid-cols-12">
        
        {/* Origin Offset */}
        <div className="text-center lg:col-span-3 lg:text-left">
          <div className="text-xs uppercase tracking-wider text-[#A0A2AC] font-semibold">
            Origin Offset
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#F4F5F8]">
            {result ? formatOffset(result.source_abbrev, result.source_offset) : "—"}
          </div>
          <div className="text-[11px] text-[#737680] mt-0.5">
            {resolvedFrom ? resolvedFrom.replace(/_/g, " ") : ""}
          </div>
        </div>

        {/* Smoked Glass 2-Leaf Flip Clock Display */}
        <div className="flex justify-center lg:col-span-6">
          <div className="cnc-12__board" aria-hidden="true">
            <div className="cnc-12__group" data-unit="h">
              <FlipCard digit={targetHours?.[0] ?? "0"} />
              <FlipCard digit={targetHours?.[1] ?? "0"} />
              <small className="cnc-12__cap">hrs</small>
            </div>

            <span className="cnc-12__colon">:</span>

            <div className="cnc-12__group" data-unit="m">
              <FlipCard digit={targetMins?.[0] ?? "0"} />
              <FlipCard digit={targetMins?.[1] ?? "0"} />
              <small className="cnc-12__cap">min</small>
            </div>
          </div>
        </div>

        {/* Destination Info & Vertical Liquid Glass Action Stack */}
        <div className="flex flex-col items-center lg:col-span-3 lg:items-end">
          <div className="text-center lg:text-right mb-3">
            <div className="text-xs uppercase tracking-wider text-[#A0A2AC] font-semibold">
              Destination
            </div>
            <div className="font-mono text-sm font-semibold text-[#F4F5F8]">
              {result ? formatOffset(result.target_abbrev, result.target_offset) : "—"}
            </div>
          </div>

          {/* Unified Liquid Glass Buttons */}
          <div className="flex w-full max-w-[200px] flex-col gap-2">
            {/* 1. Save Clock */}
            {resolvedFrom && resolvedTo && (
              <button
                type="button"
                onClick={handleSaveClock}
                className="liquid-glass-l2 flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/20 active:scale-98"
              >
                <svg className="h-4 w-4 text-[#48CFCB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Save Clock</span>
              </button>
            )}

            {/* 2. Google Meet */}
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-l2 flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/20 active:scale-98"
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

            {/* 3. Microsoft Teams */}
            {teamsUrl && (
              <a
                href={teamsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-l2 flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/20 active:scale-98"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#8B83FF">
                  <path d="M16.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19.5 8.5h-6a1.5 1.5 0 0 0-1.5 1.5v4.25c0 .69.56 1.25 1.25 1.25h5.5c1.24 0 2.25-1.01 2.25-2.25v-3.25c0-.83-.67-1.5-1.5-1.5z" opacity="0.85"/>
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM13.5 10.5h-7A2.5 2.5 0 0 0 4 13v5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-5a2.5 2.5 0 0 0-1.5-2.5z" fill="#8B83FF" />
                </svg>
                <span>Microsoft Teams</span>
              </a>
            )}

            {/* 4. Zoom */}
            <a
              href={getZoomScheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-l2 flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/20 active:scale-98"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#2D8CFF">
                <path d="M4.5 7h10A1.5 1.5 0 0 1 16 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7zm13 3.5l3.5-2.5v8l-3.5-2.5v-3z" />
              </svg>
              <span>Zoom Meeting</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}