// src/components/sections/QuickConverter.tsx

"use client";

import { useState, useEffect } from "react";
import { resolveZone, convertTime } from "@/lib/api/timezone";
import { ConvertResponse } from "@/types/timezone";
import { FlipDigit } from "@/components/ui/FlipDigit";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import { Toast } from "@/components/ui/Toast";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
  formatInviteClipboard,
} from "@/lib/utils/calendar";

export function QuickConverter() {
  const [fromQuery, setFromQuery] = useState("New York");
  const [toQuery, setToQuery] = useState("Tokyo");
  const [inputTime, setInputTime] = useState("12:00");
  const [zoomLink, setZoomLink] = useState("");

  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [resolvedTo, setResolvedTo] = useState<string | null>(null);

  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { addClockPair } = useSavedClocks();
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

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
    ? result.target_local.split("T")[1]?.slice(0, 5) ?? "--:--"
    : "--:--";

  const [targetHours, targetMins] = targetTimeStr.split(":");

  // Meeting parameters
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
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md sm:p-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Origin, Swap, Destination */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-7">
        
        {/* Origin */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold tracking-wide text-zinc-400 uppercase mb-2">
            Origin
          </label>
          <input
            type="text"
            value={fromQuery}
            onChange={(e) => setFromQuery(e.target.value)}
            placeholder="e.g. New York, CST, Paris, or 48.85,2.35"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none transition-colors"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <input
              type="time"
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="w-28 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs font-mono text-zinc-200 focus:border-zinc-400 focus:outline-none"
            />
            {resolvedFrom && (
              <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[150px]">
                {resolvedFrom}
              </span>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex sm:h-[42px] items-center justify-center sm:col-span-1">
          <button
            type="button"
            onClick={swapQueries}
            className="mt-6 sm:mt-0 rounded-lg border border-zinc-700 bg-zinc-800 p-2.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-white active:scale-95"
            title="Swap locations"
          >
            ⇄
          </button>
        </div>

        {/* Destination */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold tracking-wide text-zinc-400 uppercase mb-2">
            Destination
          </label>
          <input
            type="text"
            value={toQuery}
            onChange={(e) => setToQuery(e.target.value)}
            placeholder="e.g. Tokyo, JST, London"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none transition-colors"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
            {resolvedTo ? (
              <span className="font-mono truncate">{resolvedTo}</span>
            ) : (
              <span>Resolves place, abbr, or coords</span>
            )}
            {loading && <span className="text-zinc-400 animate-pulse">Resolving...</span>}
          </div>
        </div>

      </div>

      {/* Optional Zoom / Teams Link input */}
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
          Optional Meeting Link (Paste your Zoom or Teams URL)
        </label>
        <input
          type="url"
          value={zoomLink}
          onChange={(e) => setZoomLink(e.target.value)}
          placeholder="https://zoom.us/j/... or personal room URL"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-lg bg-red-950/40 border border-red-900/50 p-2.5 text-center text-xs text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Conversion Output & Meeting Action Suite */}
      <div className="mt-6 flex flex-col items-center justify-between gap-6 border-t border-zinc-800/80 pt-6 sm:flex-row">
        
        {/* Origin summary */}
        <div className="text-center sm:text-left">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Origin Offset</div>
          <div className="mt-1 font-mono text-base font-medium text-zinc-200">
            {result ? `${result.source_abbrev} (${result.source_offset})` : "—"}
          </div>
        </div>

        {/* Digits */}
        <div className="flex items-center gap-2">
          <FlipDigit value={targetHours?.[0] ?? "-"} label="H" />
          <FlipDigit value={targetHours?.[1] ?? "-"} />
          <span className="font-mono text-2xl font-bold text-zinc-500 mb-4">:</span>
          <FlipDigit value={targetMins?.[0] ?? "-"} label="M" />
          <FlipDigit value={targetMins?.[1] ?? "-"} />
        </div>

        {/* Action Buttons: Save, Google, Teams, Zoom */}
        <div className="flex flex-col items-center sm:items-end gap-2">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Schedule Meeting</div>

          <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
            {/* Save Clock */}
            {resolvedFrom && resolvedTo && (
              <button
                type="button"
                onClick={handleSaveClock}
                className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white active:scale-95 flex items-center gap-1"
                title="Save this pair to World Clocks"
              >
                <span>+</span> Save
              </button>
            )}

            {/* Google Meet */}
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-sky-800/60 bg-sky-950/40 px-2.5 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-900/60 hover:text-white active:scale-95 flex items-center gap-1"
              >
                <span>🎥</span> Google Meet
              </a>
            )}

            {/* Microsoft Teams Direct */}
            {teamsUrl && (
              <a
                href={teamsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-indigo-800/60 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-900/60 hover:text-white active:scale-95 flex items-center gap-1"
              >
                <span>👥</span> Teams
              </a>
            )}

            {/* Zoom Scheduler Link */}
            <a
              href={getZoomScheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-blue-800/60 bg-blue-950/40 px-2.5 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-900/60 hover:text-white active:scale-95 flex items-center gap-1"
            >
              <span>📹</span> Zoom
            </a>

            
          </div>
        </div>

      </div>
    </div>
  );
}