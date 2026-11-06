// src/types/clock.ts

export interface SavedClock {
  zone: string;           // Canonical IANA zone (e.g. "Asia/Tokyo")
  label?: string;         // Optional custom nickname (e.g. "Tokyo Office")
  addedAt: number;        // Timestamp
}

export interface ClockSnapshot {
  zone: string;
  local_time: string;
  offset: string;
  abbrev: string;
  dst_active: boolean;
}

export interface SavedClockPair {
  id: string;         // e.g. "America/New_York->Asia/Tokyo"
  fromZone: string;   // Origin (BIG time)
  toZone: string;     // Destination (Smaller time)
  savedAt: number;
}