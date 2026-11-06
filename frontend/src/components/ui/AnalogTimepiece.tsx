// src/components/ui/AnalogTimepiece.tsx

"use client";

import { useEffect, useState } from "react";

interface TimepieceProps {
  timeZone?: string;
  size?: number; // width & height in px
}

export function AnalogTimepiece({ timeZone, size = 380 }: TimepieceProps) {
  const [time, setTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    millis: number;
  }>({ hours: 0, minutes: 0, seconds: 0, millis: 0 });

  useEffect(() => {
    let animId: number;

    function update() {
      const now = new Date();
      
      // If a specific timezone is provided, adjust to it; otherwise use local
      let h = now.getHours();
      let m = now.getMinutes();
      let s = now.getSeconds();
      const ms = now.getMilliseconds();

      if (timeZone) {
        try {
          const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
          }).formatToParts(now);

          h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
          m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
          s = parseInt(parts.find((p) => p.type === "second")?.value ?? "0", 10);
        } catch {
          // fallback
        }
      }

      setTime({ hours: h, minutes: m, seconds: s, millis: ms });
      animId = requestAnimationFrame(update);
    }

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [timeZone]);

  // Calculate rotation angles
  // Second hand sweeps smoothly by adding millis
  const secondDeg = (time.seconds + time.millis / 1000) * 6;
  const minuteDeg = time.minutes * 6 + (time.seconds / 60) * 6;
  const hourDeg = (time.hours % 12) * 30 + (time.minutes / 60) * 30;

  // Generate 60 tick marks around the rim
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isHour = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const r1 = 170;
    const r2 = isHour ? 152 : 162;
    const x1 = 200 + r1 * Math.sin(angle);
    const y1 = 200 - r1 * Math.cos(angle);
    const x2 = 200 + r2 * Math.sin(angle);
    const y2 = 200 - r2 * Math.cos(angle);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isHour ? "#e4e4e7" : "#52525b"}
        strokeWidth={isHour ? 3 : 1.2}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="relative flex items-center justify-center p-4">
      {/* Ambient background glow ring */}
      <div 
        className="absolute rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
        style={{ width: size * 1.1, height: size * 1.1 }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        className="drop-shadow-2xl select-none"
      >
        <defs>
          {/* Bezel Metallic Gradient */}
          <radialGradient id="bezelGrad" cx="50%" cy="50%" r="50%">
            <stop offset="90%" stopColor="#18181b" />
            <stop offset="98%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#3f3f46" />
          </radialGradient>

          {/* Dial Face Texture */}
          <radialGradient id="dialGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="85%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#040405" />
          </radialGradient>

          {/* Glass Glare Reflection */}
          <linearGradient id="glare" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Outer Bezel & Case */}
        <circle cx="200" cy="200" r="195" fill="url(#bezelGrad)" stroke="#3f3f46" strokeWidth="2" />
        <circle cx="200" cy="200" r="185" fill="#09090b" stroke="#27272a" strokeWidth="1" />

        {/* 2. Main Dial Face */}
        <circle cx="200" cy="200" r="178" fill="url(#dialGrad)" />

        {/* 3. Concentric Chronometer Sub-ring */}
        <circle cx="200" cy="200" r="110" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="#27272a" strokeWidth="1" />

        {/* 4. Luxury Branding Typography */}
        <text
          x="200"
          y="150"
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="11"
          fontWeight="bold"
          letterSpacing="4"
          className="font-mono uppercase"
        >
          CHRONOWORLD
        </text>
        <text
          x="200"
          y="165"
          textAnchor="middle"
          fill="#52525b"
          fontSize="7"
          fontWeight="600"
          letterSpacing="2"
          className="font-mono uppercase"
        >
          AUTOMATIC • UTC
        </text>

        {/* 5. 60 Minute/Hour Markers */}
        {ticks}

        {/* Roman / Number Cardinal Accents */}
        <text x="200" y="70" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="monospace">12</text>
        <text x="340" y="206" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="monospace">3</text>
        <text x="200" y="345" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="monospace">6</text>
        <text x="60" y="206" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="monospace">9</text>

        {/* 6. HOUR HAND */}
        <g transform={`rotate(${hourDeg} 200 200)`}>
          {/* Shadow */}
          <polygon points="196,200 200,98 204,200 200,215" fill="#000000" opacity="0.4" transform="translate(2, 4)" />
          {/* Hand body */}
          <polygon points="196,200 199,96 201,96 204,200 200,215" fill="#f4f4f5" />
          <line x1="200" y1="110" x2="200" y2="185" stroke="#18181b" strokeWidth="1.5" />
        </g>

        {/* 7. MINUTE HAND */}
        <g transform={`rotate(${minuteDeg} 200 200)`}>
          <polygon points="197,200 200,60 203,200 200,225" fill="#000000" opacity="0.4" transform="translate(3, 5)" />
          <polygon points="197,200 199,58 201,58 203,200 200,225" fill="#e4e4e7" />
          <line x1="200" y1="80" x2="200" y2="185" stroke="#18181b" strokeWidth="1.5" />
        </g>

        {/* 8. SWEEPING SECOND HAND (Electric Cyan / Luxury Chrono needle) */}
        <g transform={`rotate(${secondDeg} 200 200)`}>
          {/* Needle */}
          <line x1="200" y1="45" x2="200" y2="235" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
          {/* Counterweight circle */}
          <circle cx="200" cy="225" r="4.5" fill="#06b6d4" />
          <circle cx="200" cy="225" r="2" fill="#09090b" />
        </g>

        {/* 9. Center Pivot Pin & Cap */}
        <circle cx="200" cy="200" r="7" fill="#27272a" stroke="#09090b" strokeWidth="1" />
        <circle cx="200" cy="200" r="3.5" fill="#06b6d4" />

        {/* 10. Crystal Glass Reflection Overlay */}
        <circle cx="200" cy="200" r="185" fill="url(#glare)" pointerEvents="none" />
      </svg>
    </div>
  );
}