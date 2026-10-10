export interface ZoneCandidate {
  zone: string;
  local_time: string;
  offset: string;
  abbrev: string;
  dst_active: boolean;
}

export interface ResolveResponse {
  status: 'unique' | 'ambiguous' | 'unknown';
  zone?: string;
  candidates?: ZoneCandidate[];
  source?: string;
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

export interface WorldClockSnapshot {
  zone: string;
  local_time: string;
  offset: string;
  abbrev: string;
  dst_active: boolean;
}