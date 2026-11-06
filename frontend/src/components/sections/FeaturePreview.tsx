// src/components/sections/FeaturePreview.tsx

import { Container } from "@/components/layout/Container";
import { QuickConverter } from "@/components/sections/QuickConverter";

export function FeaturePreview() {
  return (
    <section className="border-t border-zinc-800/80 bg-zinc-950/40 py-20">
      <Container>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Track time without timezone math
          </h2>
          <p className="mt-2 text-zinc-400">
            Powered by canonical IANA zones with instant DST corrections.
          </p>
        </div>

        {/* Interactive Quick Time Conversion Widget */}
        <div className="mb-16">
          <QuickConverter />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-800 mb-4" />
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}