// src/components/sections/FeaturePreview.tsx
"use client";

import dynamic from "next/dynamic";
import { Container } from "@/components/layout/Container";

// Load QuickConverter on the client only — completely eliminates hydration mismatch
const QuickConverter = dynamic(
  () => import("@/components/sections/QuickConverter").then((mod) => mod.QuickConverter),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-4xl h-[340px] rounded-[24px] bg-[#FFFFFF] border border-[#DCDAD5] p-8 flex items-center justify-center font-mono text-sm text-[#777777] animate-pulse">
        Loading converter...
      </div>
    ),
  }
);

export function FeaturePreview() {
  return (
    <section className="py-16 bg-[#ECEBE6]">
      <Container>
        {/* Section Heading */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#050505]">
            Track time without timezone math
          </h2>
          <p className="mt-2 text-sm sm:text-base font-medium text-[#555555]">
            Powered by canonical IANA zones with instant DST corrections.
          </p>
        </div>

        {/* The Converted High-Contrast Converter */}
        <div className="mb-14">
          <QuickConverter />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Instant Search & Resolution",
              desc: "Query by city, airport abbreviation, or GPS coords. Automatically maps to standard IANA zones.",
            },
            {
              title: "Canonical IANA Source of Truth",
              desc: "Supports 400+ zones and 600+ aliases. Correctly handles historical shifts and current DST changes.",
            },
            {
              title: "Multi-Zone Meeting Visualizer",
              desc: "Compare working hours across unlimited timezones to find the golden overlap window.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[#DCDAD5] bg-[#FFFFFF] p-6 shadow-sm transition hover:border-[#F04B0B]/50"
            >
              <div className="h-3 w-3 rounded-sm bg-[#F04B0B] mb-4" />
              <h3 className="font-black text-[#050505] text-base">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}