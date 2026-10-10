import { ResolveResponse, ConvertResponse, WorldClockSnapshot } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function resolveQuery(query: string): Promise<ResolveResponse> {
  const res = await fetch(`${API_BASE}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Resolve failed: ${res.statusText}`);
  }
  return res.json();
}

export async function convertTime(
  from_zone: string,
  to_zone: string,
  when?: string
): Promise<ConvertResponse> {
  const res = await fetch(`${API_BASE}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_zone, to_zone, when }),
  });
  if (!res.ok) {
    throw new Error(`Conversion failed: ${res.statusText}`);
  }
  return res.json();
}

export async function worldClock(zones: string[]): Promise<WorldClockSnapshot[]> {
  const res = await fetch(`${API_BASE}/world-clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zones }),
  });
  if (!res.ok) {
    throw new Error(`World clock snapshot failed: ${res.statusText}`);
  }
  return res.json();
}