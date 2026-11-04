// src/app/planner/page.tsx

"use client";

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { resolveZone } from "@/lib/api/timezone";
import { Toast } from "@/components/ui/Toast";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
  formatInviteClipboard,
} from "@/lib/utils/calendar";

interface Participant {
  id: string;
  name: string;
  zone: string;
}

type HourStatus = "work" | "extended" | "sleep";

function getHourStatus(hour: number): HourStatus {
  if (hour >= 9 && hour < 17) return "work";
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 21)) return "extended";
  return "sleep";
}

export default function MeetingPlannerPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  
  // Range & Duration State
  const [startHour, setStartHour] = useState(14); // 2:00 PM in reference zone
  const [durationHours, setDurationHours] = useState(1); // 1, 2, or 3 hours
  
  const [newParticipantQuery, setNewParticipantQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "New York", zone: "America/New_York" },
    { id: "2", name: "London", zone: "Europe/London" },
    { id: "3", name: "Tokyo", zone: "Asia/Tokyo" },
  ]);

  // Compute 24-hour timeline matrix for all participants
  const timelineData = useMemo(() => {
    if (participants.length === 0) return [];
    const refZone = participants[0].zone;

    return participants.map((p) => {
      const hours = Array.from({ length: 24 }, (_, h) => {
        const refIso = `${selectedDate}T${String(h).padStart(2, "0")}:00:00`;
        const tempDate = new Date(refIso);

        const localHourStr = new Intl.DateTimeFormat("en-US", {
          timeZone: p.zone,
          hour: "numeric",
          hour12: false,
        }).format(tempDate);

        const localHour = parseInt(localHourStr, 10) % 24;
        const status = getHourStatus(localHour);

        return {
          refHour: h,
          localHour,
          status,
          display: `${String(localHour).padStart(2, "0")}:00`,
        };
      });

      return { participant: p, hours };
    });
  }, [participants, selectedDate]);

  // Group continuous golden hours into multi-hour ranges (e.g. 14:00 - 17:00)
  const goldenRanges = useMemo(() => {
    if (timelineData.length === 0) return [];

    const availableHours: number[] = [];
    for (let h = 0; h < 24; h++) {
      const allAwake = timelineData.every((t) => t.hours[h].status !== "sleep");
      if (allAwake) availableHours.push(h);
    }

    // Group adjacent hours into ranges
    const ranges: { start: number; length: number }[] = [];
    let currentStart: number | null = null;
    let currentLen = 0;

    for (let i = 0; i < availableHours.length; i++) {
      if (currentStart === null) {
        currentStart = availableHours[i];
        currentLen = 1;
      } else if (availableHours[i] === availableHours[i - 1] + 1) {
        currentLen++;
      } else {
        ranges.push({ start: currentStart, length: currentLen });
        currentStart = availableHours[i];
        currentLen = 1;
      }
    }
    if (currentStart !== null) {
      ranges.push({ start: currentStart, length: currentLen });
    }

    return ranges;
  }, [timelineData]);

  // Handle participant add
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await resolveZone(newParticipantQuery.trim());
      const zone = res.zone || res.candidates?.[0]?.zone;

      if (!zone) {
        setToast({ message: `Could not find "${newParticipantQuery}"`, type: "warning" });
        return;
      }

      if (participants.some((p) => p.zone === zone)) {
        setToast({ message: `${zone.replace(/_/g, " ")} is already listed.`, type: "warning" });
        return;
      }

      const cityName = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
      setParticipants([
        ...participants,
        { id: Date.now().toString(), name: cityName, zone },
      ]);
      setNewParticipantQuery("");
      setToast({ message: `Added ${cityName}!`, type: "success" });
    } catch {
      setToast({ message: "Failed to resolve location.", type: "warning" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      setToast({ message: "You need at least 1 participant.", type: "warning" });
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  // Calendar params for the selected range
  const calendarPayload = useMemo(() => {
    if (participants.length < 2) return null;
    const ref = participants[0];
    const target = participants[1];

    const refIso = `${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`;
    const startDate = new Date(refIso);

    return {
      title: `Sync (${durationHours}h): ${ref.name} / ${target.name}`,
      sourceUtcIso: startDate.toISOString(),
      durationMinutes: durationHours * 60,
      fromZone: ref.zone,
      toZone: target.zone,
      sourceLocal: `${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`,
      targetLocal: `${selectedDate}T00:00:00`,
      sourceAbbrev: ref.zone.split("/").pop() ?? "",
      targetAbbrev: target.zone.split("/").pop() ?? "",
    };
  }, [participants, selectedDate, startHour, durationHours]);

  const googleUrl = calendarPayload ? buildGoogleMeetUrl(calendarPayload) : null;
  const teamsUrl = calendarPayload ? buildTeamsMeetingUrl(calendarPayload) : null;


  // Check if an hour falls within the selected range
  const isHourSelected = (h: number) => {
    return h >= startHour && h < startHour + durationHours;
  };

  return (
    <main className="min-h-screen bg-zinc-950 py-12 text-zinc-100">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Container>
        {/* Top Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-800 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Meeting Planner
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Interactive 24-hour visualizer to find the best overlap across teams.
            </p>
          </div>

          {/* Date, Duration, and Add Location */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-400 focus:outline-none"
            />

            {/* Duration Selector */}
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-400 focus:outline-none"
              title="Meeting Duration"
            >
              <option value={1}>1 Hour Meeting</option>
              <option value={2}>2 Hours Meeting</option>
              <option value={3}>3 Hours Meeting</option>
            </select>

            {/* Add Location Search */}
            <form onSubmit={handleAddParticipant} className="flex items-center gap-2">
              <input
                type="text"
                value={newParticipantQuery}
                onChange={(e) => setNewParticipantQuery(e.target.value)}
                placeholder="Add city or country..."
                className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isSearching ? "..." : "Add"}
              </button>
            </form>
          </div>
        </div>

        {/* Golden Window Selection Bar */}
        <div className="my-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base">✨</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Golden Ranges (All Awake):
              </span>

              {goldenRanges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {goldenRanges.map((r, i) => {
                    const startLabel = `${String(r.start).padStart(2, "0")}:00`;
                    const endLabel = `${String((r.start + r.length) % 24).padStart(2, "0")}:00`;
                    const isActive = startHour === r.start;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setStartHour(r.start);
                          setDurationHours(Math.min(r.length, 2)); // Defaults to up to 2 hours
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition ${
                          isActive
                            ? "bg-emerald-500 text-zinc-950 font-bold shadow-md ring-2 ring-emerald-300"
                            : "bg-zinc-800 text-emerald-400 hover:bg-zinc-700"
                        }`}
                      >
                        {startLabel} – {endLabel} ({r.length}h window)
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-amber-400">
                  No overlapping waking window found. Try another date or adjust participants.
                </span>
              )}
            </div>

            {/* Legend */}
            {/* <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Work (9-17)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Extended</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-800 border border-zinc-700" />
                <span>Sleep</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* 24-Hour Timeline Grid Container */}
        <div className="relative overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-2xl">
          {/* Explicit width ensures all 24 hours render without collapsing */}
          <div className="min-w-[1280px]">
            
            {/* Header: Hour Numbers */}
            <div className="mb-3 grid grid-cols-[220px_repeat(24,1fr)] items-center gap-1.5 text-center font-mono text-[11px] text-zinc-500">
              {/* Sticky location header */}
              <div className="sticky left-0 z-20 bg-zinc-900/90 py-1 text-left font-sans text-xs font-bold text-zinc-400 uppercase tracking-wider backdrop-blur-md">
                Location
              </div>

              {Array.from({ length: 24 }, (_, i) => {
                const inRange = isHourSelected(i);
                return (
                  <button
                    key={i}
                    onClick={() => setStartHour(i)}
                    className={`rounded py-1.5 transition ${
                      inRange
                        ? "bg-white text-zinc-950 font-bold shadow"
                        : "hover:text-zinc-200"
                    }`}
                  >
                    {String(i).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            {/* Participant Tracks */}
            <div className="space-y-3">
              {timelineData.map(({ participant, hours }) => (
                <div
                  key={participant.id}
                  className="grid grid-cols-[220px_repeat(24,1fr)] items-center gap-1.5"
                >
                  {/* Sticky Left Column: City & Remove button */}
                  <div className="sticky left-0 z-20 flex items-center justify-between bg-zinc-900/95 py-2 pr-4 backdrop-blur-md border-r border-zinc-800/80">
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm text-white truncate">
                        {participant.name}
                      </h4>
                      <p className="font-mono text-[10px] text-zinc-500 truncate">
                        {participant.zone}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-zinc-600 hover:text-red-400 text-xs transition p-1"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 24 Distinct Hour Blocks */}
                  {hours.map((h) => {
                    const inRange = isHourSelected(h.refHour);

                    let statusClass = "bg-zinc-950/70 border-zinc-800/80 text-zinc-600";
                    if (h.status === "work") {
                      statusClass = "bg-emerald-950/40 border-emerald-800/60 text-emerald-300";
                    } else if (h.status === "extended") {
                      statusClass = "bg-amber-950/30 border-amber-800/50 text-amber-300";
                    }

                    return (
                      <div
                        key={h.refHour}
                        onClick={() => setStartHour(h.refHour)}
                        data-hour={h.refHour}
                        data-status={h.status}
                        className={`
                          relative flex h-14 cursor-pointer flex-col items-center justify-center rounded-lg border text-center font-mono text-[11px] transition-all
                          ${statusClass}
                          ${
                            inRange
                              ? "ring-2 ring-white scale-105 z-10 font-bold shadow-lg"
                              : "hover:brightness-125"
                          }
                        `}
                      >
                        <span>{String(h.localHour).padStart(2, "0")}</span>
                        <span className="text-[9px] opacity-60">:00</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Selected Slot Summary & Launch Suite */}
        <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              Selected Time Window ({durationHours} Hour{durationHours > 1 ? "s" : ""})
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <h3 className="font-mono text-2xl font-bold text-white">
                {String(startHour).padStart(2, "0")}:00 – {String((startHour + durationHours) % 24).padStart(2, "0")}:00 ({participants[0]?.name})
              </h3>
              <span className="text-sm text-zinc-400 font-mono">
                {selectedDate}
              </span>
            </div>
          </div>

          {/* Schedulers */}
          <div className="flex flex-wrap items-center gap-2">
            {googleUrl && (
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-sky-800/60 bg-sky-950/40 px-3.5 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-900/60 hover:text-white"
              >
                🎥 Google Meet
              </a>
            )}

            {teamsUrl && (
              <a
                href={teamsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-indigo-800/60 bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-900/60 hover:text-white"
              >
                👥 Teams
              </a>
            )}

            <a
              href={getZoomScheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-blue-800/60 bg-blue-950/40 px-3.5 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-900/60 hover:text-white"
            >
              📹 Zoom
            </a>

           
          </div>
        </div>

      </Container>
    </main>
  );
}