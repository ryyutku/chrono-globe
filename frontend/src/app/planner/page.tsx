// src/app/planner/page.tsx
"use client";

import { useState, useMemo } from "react";
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

export default function MeetingPlannerPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState(14); // 2:00 PM
  const [durationHours, setDurationHours] = useState(1);
  const [newCity, setNewCity] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const { addClockPair } = useSavedClocks();

  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "New York", zone: "America/New_York" },
    { id: "2", name: "London", zone: "Europe/London" },
    { id: "3", name: "Tokyo", zone: "Asia/Tokyo" },
  ]);

  const timelineData = useMemo(() => {
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

        return {
          refHour: h,
          localHour,
          display: `${String(localHour).padStart(2, "0")}:00`,
        };
      });

      return { participant: p, hours };
    });
  }, [participants, selectedDate]);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;

    try {
      const res = await resolveZone(newCity.trim());
      const zone = res.zone || res.candidates?.[0]?.zone;
      if (!zone) {
        setToast({ message: `Could not find "${newCity}"`, type: "warning" });
        return;
      }
      const cityName = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
      setParticipants([...participants, { id: Date.now().toString(), name: cityName, zone }]);
      setNewCity("");
    } catch {
      setToast({ message: "Failed to resolve location.", type: "warning" });
    }
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) {
      setToast({ message: "You need at least 1 participant.", type: "warning" });
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleSavePair = () => {
    if (participants.length < 2) return;
    const res = addClockPair(participants[0].zone, participants[1].zone);
    if (res.success) {
      setToast({ message: "Saved Pair to World Clocks!", type: "success" });
    } else {
      setToast({ message: "This pair is already in your World Clocks.", type: "warning" });
    }
  };

  const isSelected = (h: number) => h >= startHour && h < startHour + durationHours;

  const calendarPayload = useMemo(() => {
    if (participants.length < 2) return null;
    return {
      title: `Sync: ${participants[0].name} / ${participants[1].name}`,
      sourceUtcIso: new Date(`${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`).toISOString(),
      durationMinutes: durationHours * 60,
      fromZone: participants[0].zone,
      toZone: participants[1].zone,
      sourceLocal: `${selectedDate}T${String(startHour).padStart(2, "0")}:00:00`,
      targetLocal: `${selectedDate}T00:00:00`,
      sourceAbbrev: "UTC",
      targetAbbrev: "UTC",
    };
  }, [participants, selectedDate, startHour, durationHours]);

  const googleUrl = calendarPayload ? buildGoogleMeetUrl(calendarPayload) : null;
  const teamsUrl = calendarPayload ? buildTeamsMeetingUrl(calendarPayload) : null;

  return (
    <main className="px-6 sm:px-10 py-6 sm:py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Split Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-[#050505] leading-[0.9]">
            Meeting<br />Planner
          </h1>
          <p className="text-base font-medium text-[#555555] mt-3">
            Find overlapping hours across global timezones.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Today: Active Orange Pill */}
          <button className="rounded-full border-2 border-[#F04B0B] px-4 py-1.5 text-xs font-bold text-[#050505]">
            Today
          </button>
          <button className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#555555] hover:text-black">
            Tomorrow
          </button>

          {/* Date Picker Pill */}
          <div className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-3.5 py-1.5 text-xs font-bold text-[#050505] flex items-center gap-1.5 cursor-pointer">
            <span>📅</span>
            <span>Sat, Nov 7 ⌵</span>
          </div>

          {/* Duration Pill: 1h | 2h | 3h */}
          <div className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] p-1 flex items-center">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                onClick={() => setDurationHours(h)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  durationHours === h
                    ? "bg-[#0A0A0A] text-white"
                    : "text-[#555555] hover:text-black"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Add City Input Pill */}
          <form onSubmit={handleAddParticipant} className="flex items-center rounded-full bg-[#FFFFFF] border border-[#DCDAD5] pl-3.5 pr-1 py-1">
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Add city or country..."
              className="bg-transparent text-xs font-medium text-[#050505] placeholder-[#888888] focus:outline-none w-36"
            />
            <button
              type="submit"
              className="rounded-full bg-[#0A0A0A] text-white px-3.5 py-1 text-xs font-bold hover:bg-black"
            >
              + Add
            </button>
          </form>
        </div>
      </div>

      {/* Main Timeline Grid */}
      <div className="overflow-x-auto timespot-scrollbar pb-4">
        <div className="min-w-[1200px]">
          {/* Header Row: LOCATIONS | 00:00 ... 23:00 */}
          <div className="grid grid-cols-[180px_repeat(24,1fr)] items-center gap-1.5 mb-2 font-mono text-[11px] font-bold text-[#555555]">
            <div className="text-xs uppercase font-black text-[#050505]">
              LOCATIONS
            </div>
            {Array.from({ length: 24 }, (_, i) => (
              <button
                key={i}
                onClick={() => setStartHour(i)}
                className="hover:text-black py-1"
              >
                {String(i).padStart(2, "0")}:00
              </button>
            ))}
          </div>

          {/* Participant Tracks */}
          <div className="space-y-2">
            {timelineData.map(({ participant, hours }) => (
              <div
                key={participant.id}
                className="grid grid-cols-[180px_repeat(24,1fr)] items-center gap-1.5"
              >
                {/* Location Name with Orange Dot */}
                <div className="flex items-center gap-2 pr-3">
                  <span className="h-2 w-2 rounded-full bg-[#F04B0B] shrink-0" />
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-black text-[#050505] truncate">
                      {participant.name}
                    </h4>
                    <p className="text-[10px] font-semibold text-[#777777] truncate">
                      {participant.zone}
                    </p>
                  </div>
                </div>

                {/* 24 Hour Pills with Visible Times */}
                {hours.map((h) => {
                  const active = isSelected(h.refHour);

                  return (
                    <div
                      key={h.refHour}
                      onClick={() => setStartHour(h.refHour)}
                      className={`h-11 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold cursor-pointer transition select-none ${
                        active
                          ? "bg-[#F04B0B] text-white shadow-sm"
                          : "bg-[#DFDED9] hover:bg-[#d4d3ce] text-[#666666]"
                      }`}
                    >
                      {/* Displays local time in every single slot */}
                      <span>{h.display.slice(0, 5)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#DCDAD5]">
        {/* Left Label */}
        <div className="text-xs font-black uppercase tracking-wider text-[#050505]">
          SELECTED WINDOW · {durationHours} HOUR{durationHours > 1 ? "S" : ""}
        </div>

        {/* Center: Location Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {timelineData.map(({ participant, hours }) => {
            const start = hours[startHour]?.display ?? "00:00";
            const end = hours[(startHour + durationHours) % 24]?.display ?? "00:00";

            return (
              <div
                key={participant.id}
                className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-3.5 py-1 text-xs font-bold text-[#050505]"
              >
                <span className="text-[#555555] font-semibold mr-1">{participant.name}:</span>
                <span className="font-mono">{start}–{end}</span>
              </div>
            );
          })}
        </div>

        {/* Right Actions: Save Pair, Meet, Teams, Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSavePair}
            className="rounded-full border-2 border-[#F04B0B] px-4 py-1.5 text-xs font-bold text-[#050505] hover:bg-[#F04B0B] hover:text-white transition"
          >
            Save Pair
          </button>

          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-1.5 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
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
              className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-1.5 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="#5059C9">
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
            className="rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-1.5 text-xs font-bold text-[#050505] flex items-center gap-1.5 hover:bg-[#F4F3EE] shadow-sm transition"
          >
            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="#2D8CFF">
              <path d="M4.5 7h10A1.5 1.5 0 0 1 16 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 15.5v-7A1.5 1.5 0 0 1 4.5 7zm13 3.5l3.5-2.5v8l-3.5-2.5v-3z" />
            </svg>
            <span>Zoom</span>
          </a>
        </div>
      </div>
    </main>
  );
}