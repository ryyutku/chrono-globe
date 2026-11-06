// src/app/planner/page.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { Container } from "@/components/layout/Container";
import { resolveZone } from "@/lib/api/timezone";
import { Toast } from "@/components/ui/Toast";
import { useSavedClocks } from "@/lib/hooks/useSavedClocks";
import {
  buildGoogleMeetUrl,
  buildTeamsMeetingUrl,
  getZoomScheduleUrl,
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
  
  const [startHour, setStartHour] = useState(14);
  const [durationHours, setDurationHours] = useState(1);
  const [newParticipantQuery, setNewParticipantQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const { addClockPair } = useSavedClocks();

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "New York", zone: "America/New_York" },
    { id: "2", name: "London", zone: "Europe/London" },
    { id: "3", name: "Tokyo", zone: "Asia/Tokyo" },
  ]);

  const handleSetQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const timelineData = useMemo(() => {
    if (participants.length === 0) return [];

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

  const handleSaveClockPair = () => {
    if (participants.length < 2) return;
    const res = addClockPair(participants[0].zone, participants[1].zone);
    if (res.success) {
      setToast({ message: `Saved ${participants[0].name} → ${participants[1].name} to World Clocks!`, type: "success" });
    } else {
      setToast({ message: "This conversion pair is already saved.", type: "warning" });
    }
  };

  const calendarPayload = useMemo(() => {
    if (participants.length < 2) return null;
    const ref = participants[0];
    const target = participants[1];

    const refIso = `${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`;
    const startDate = new Date(refIso);

    return {
      title: `Team Sync: ${ref.name} / ${target.name}`,
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

  const isHourSelected = (h: number) => {
    return h >= startHour && h < startHour + durationHours;
  };

  const humanDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#08090C] py-12 text-[#F4F5F8]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Container>
        {/* Header Bar */}
        <div className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="liquid-glass-l3 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#65DDF2] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#65DDF2] animate-pulse" />
              Multi-Zone Overlap Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Meeting Planner
            </h1>
            <p className="mt-1.5 text-sm text-[#A0A2AC]">
              Find synchronized meeting windows across international locations.
            </p>
          </div>

          {/* Liquid Glass Controls Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Pill */}
            <div className="liquid-glass-l2 flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleSetQuickDate(0)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedDate === new Date().toISOString().slice(0, 10)
                    ? "bg-white text-zinc-950 font-bold"
                    : "text-[#A0A2AC] hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(1)}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-[#A0A2AC] hover:text-white transition"
              >
                Tomorrow
              </button>

              <div className="h-3.5 w-[1px] bg-white/10" />

              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker()}
                className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1 text-xs font-mono font-semibold text-[#65DDF2] border border-[#65DDF2]/30 transition"
              >
                <span>📅</span>
                <span>{humanDate}</span>
              </button>

              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="sr-only"
              />
            </div>

            {/* Duration Toggle (1h / 2h / 3h) */}
            <div className="liquid-glass-l2 flex items-center rounded-full p-1">
              {[1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => setDurationHours(h)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                    durationHours === h
                      ? "bg-white text-zinc-950 font-bold shadow-md"
                      : "text-[#A0A2AC] hover:text-white"
                  }`}
                >
                  {h} hr{h > 1 ? "s" : ""}
                </button>
              ))}
            </div>

            {/* Add Location Input */}
            <form onSubmit={handleAddParticipant} className="liquid-glass-l2 flex items-center rounded-full pl-4 pr-1.5 py-1 focus-within:border-[#65DDF2]/50 transition">
              <input
                type="text"
                value={newParticipantQuery}
                onChange={(e) => setNewParticipantQuery(e.target.value)}
                placeholder="Add city or country..."
                className="w-36 bg-transparent text-xs text-[#F4F5F8] placeholder-[#737680] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isSearching ? "..." : "+ Add"}
              </button>
            </form>
          </div>
        </div>

        {/* Legend */}
        <div className="my-5 flex items-center justify-between text-xs text-[#A0A2AC]">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#737680]">
            Scroll horizontally to view 24-hour overlap
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#48CFCB]" />
              <span className="text-[#F4F5F8]">Preferred (9–17)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E9B968]" />
              <span>Outside preferred</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#181A22] border border-white/10" />
              <span className="text-[#737680]">Unavailable</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Timeline Grid Container */}
        <div className="liquid-glass-l1 relative overflow-x-auto planner-scrollbar rounded-3xl p-6 shadow-2xl">
          <div className="min-w-[1360px]">
            
            {/* Hour Headers */}
            <div className="mb-3.5 grid grid-cols-[230px_repeat(24,1fr)] items-center gap-2 text-center font-mono text-xs text-[#A0A2AC]">
              <div className="sticky left-0 z-20 timeline-fog-mask py-1.5 pr-8 text-left text-xs font-bold text-[#A0A2AC] uppercase tracking-wider">
                Locations
              </div>

              {Array.from({ length: 24 }, (_, i) => {
                const inRange = isHourSelected(i);
                return (
                  <button
                    key={i}
                    onClick={() => setStartHour(i)}
                    className={`rounded-xl py-2 px-1 text-xs font-semibold transition-all ${
                      inRange
                        ? "bg-white text-zinc-950 font-bold shadow-md scale-105"
                        : "text-[#A0A2AC] hover:text-[#F4F5F8] hover:bg-white/[0.04]"
                    }`}
                  >
                    {String(i).padStart(2, "0")}:00
                  </button>
                );
              })}
            </div>

            {/* Participant Tracks */}
            <div className="space-y-3.5">
              {timelineData.map(({ participant, hours }) => (
                <div
                  key={participant.id}
                  className="grid grid-cols-[230px_repeat(24,1fr)] items-center gap-2 relative"
                >
                  {/* Floating Location Card (Sticky Left with Fog Mask) */}
                  <div className="sticky left-0 z-20 flex items-center justify-between timeline-fog-mask py-1 pr-6 rounded-2xl">
                    <div className="liquid-glass-l2 flex items-center justify-between w-full rounded-2xl px-4 py-2.5">
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-[#F4F5F8] tracking-tight truncate max-w-[125px]">
                          {participant.name}
                        </h4>
                        <p className="font-mono text-[10px] text-[#65DDF2] truncate max-w-[125px]">
                          {participant.zone.split("/")[1]?.replace(/_/g, " ") || participant.zone}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-[#737680] hover:text-red-400 text-xs transition p-1 hover:scale-110 ml-2"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 24 Single-Line Availability Cells */}
                  {hours.map((h) => {
                    const inRange = isHourSelected(h.refHour);

                    // Liquid Glass Availability Styling
                    let statusClass = "bg-[#101217]/60 border-white/[0.04] text-[#737680]";
                    if (h.status === "work") {
                      // Turquoise / Cyan glass (No green)
                      statusClass = "bg-[#48CFCB]/14 border-[#48CFCB]/28 text-[#65DDF2] font-semibold";
                    } else if (h.status === "extended") {
                      // Muted Amber glass
                      statusClass = "bg-[#E9B968]/10 border-[#E9B968]/22 text-[#E9B968]";
                    }

                    return (
                      <div
                        key={h.refHour}
                        onClick={() => setStartHour(h.refHour)}
                        className={`
                          relative flex h-14 cursor-pointer items-center justify-center rounded-2xl border text-center font-mono text-xs transition-all duration-200
                          ${statusClass}
                          ${
                            inRange
                              ? "!border-[#65DDF2] bg-[#65DDF2]/20 text-white font-bold ring-2 ring-[#65DDF2]/50 shadow-[0_0_18px_rgba(101,221,242,0.35)] scale-105 z-10"
                              : "hover:brightness-125 hover:border-white/20"
                          }
                        `}
                      >
                        <span>{h.display}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Executive Floating Glass Action Dock */}
        <div className="liquid-glass-l2 mt-8 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Target Window & Local Time Badges */}
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#65DDF2] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#65DDF2]">
                  Target Sync Window ({durationHours} Hour{durationHours > 1 ? "s" : ""})
                </span>
                <span className="text-xs font-mono text-[#A0A2AC]">• {humanDate}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {timelineData.map(({ participant, hours }) => {
                  const localStart = hours[startHour]?.display ?? "00:00";
                  const localEnd = hours[(startHour + durationHours) % 24]?.display ?? "00:00";

                  return (
                    <div
                      key={participant.id}
                      className="liquid-glass-l3 flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs"
                    >
                      <span className="font-semibold text-[#A0A2AC]">{participant.name}:</span>
                      <span className="font-mono font-bold text-[#F4F5F8]">
                        {localStart}–{localEnd}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unified Liquid Glass Action Stack */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Save Pair */}
              <button
                type="button"
                onClick={handleSaveClockPair}
                className="liquid-glass-l3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/25 active:scale-95"
              >
                <svg className="h-4 w-4 text-[#48CFCB] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Save Pair</span>
              </button>

              {/* Google Meet */}
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-glass-l3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/25 active:scale-95"
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
                  className="liquid-glass-l3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/25 active:scale-95"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#8B83FF">
                    <path d="M16.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19.5 8.5h-6a1.5 1.5 0 0 0-1.5 1.5v4.25c0 .69.56 1.25 1.25 1.25h5.5c1.24 0 2.25-1.01 2.25-2.25v-3.25c0-.83-.67-1.5-1.5-1.5z" opacity="0.85"/>
                    <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM13.5 10.5h-7A2.5 2.5 0 0 0 4 13v5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-5a2.5 2.5 0 0 0-1.5-2.5z" fill="#8B83FF" />
                  </svg>
                  <span>Teams</span>
                </a>
              )}

              {/* Zoom */}
              <a
                href={getZoomScheduleUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass-l3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[#F4F5F8] transition hover:bg-white/[0.08] hover:border-white/25 active:scale-95"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#2D8CFF">
                  <path d="M4.5 7h10A1.5 1.5 0 0 1 16 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7zm13 3.5l3.5-2.5v8l-3.5-2.5v-3z" />
                </svg>
                <span>Zoom</span>
              </a>

            </div>

          </div>
        </div>

      </Container>
    </main>
  );
}