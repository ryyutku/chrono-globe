// src/types/timezone.ts

export interface ZoneCandidate {
  zone: string;
  local_time: string;
  offset: string;
  abbrev: string;
  dst_active: boolean;
}

export interface ResolveResponse {
  status: "unique" | "ambiguous" | "unknown";
  zone: string | null;
  candidates: ZoneCandidate[];
  source: string;
}

export interface ConvertRequest {
  when: string;       // "YYYY-MM-DD HH:MM"
  from_zone: string;  // Canonical IANA zone e.g. "America/New_York"
  to_zone: string;    // Canonical IANA zone e.g. "Asia/Tokyo"
}

export interface ConvertResponse {
  source_local: string;
  source_offset: string;
  source_abbrev: string;
  source_utc: string;
  target_local: string;
  target_offset: string;
  target_abbrev: string;
}

export interface WorldClockResponse {
  clocks: ZoneCandidate[];
}