// src/components/sections/FeaturePreview.tsx
import { Container } from "@/components/layout/Container";
import { QuickConverter } from "@/components/sections/QuickConverter";

export function FeaturePreview() {
  return (
    <section className="py-16 bg-[#E9E9E9]">
      <Container>
        {/* Section Heading */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black tracking-tight text-[#050505] sm:text-4xl">
            Track time without timezone math
          </h2>
          <p className="mt-2 text-sm font-medium text-[#777777]">
            Powered by canonical IANA zones with instant DST corrections.
          </p>
        </div>

        {/* The Converted High-Contrast Converter */}
        <div className="mb-14">
          <QuickConverter />
        </div>

        {/* Feature Cards: Crisp White on Warm Grey */}
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
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#D0D0D0] bg-[#FFFFFF] p-6 shadow-sm transition hover:border-[#F04B0B]/50"
            >
              <div className="h-3 w-3 rounded-sm bg-[#F04B0B] mb-4" />
              <h3 className="font-black text-[#050505]">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#777777]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}