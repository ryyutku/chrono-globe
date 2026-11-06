// src/lib/api/timezone.ts

import { ConvertRequest, ConvertResponse, ResolveResponse } from "@/types/timezone";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Layer 1/2 -> Layer 3 Resolver
export async function resolveZone(query: string): Promise<ResolveResponse> {
  const res = await fetch(`${API_BASE_URL}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resolve failed (${res.status}): ${errorBody}`);
  }

  return res.json();
}

// Layer 3 -> Layer 4 Converter
export async function convertTime(payload: ConvertRequest): Promise<ConvertResponse> {
  const res = await fetch(`${API_BASE_URL}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Convert failed (${res.status}): ${errorBody}`);
  }

  return res.json();
}