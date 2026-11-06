// src/components/ui/FlipDigit.tsx


"use client";

import { useEffect, useState, useRef } from "react";

interface FlipCardProps {
  digit: string;
}

export function FlipCard({ digit }: FlipCardProps) {
  const [cur, setCur] = useState(digit);
  const [target, setTarget] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only flip if digit actually changed
    if (digit !== cur) {
      setTarget(digit);
      setFlipping(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      // Match the 640ms timeout from your snippet (.3s fold + .3s unfold)
      timerRef.current = setTimeout(() => {
        setCur(digit);
        setFlipping(false);
      }, 640);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [digit, cur]);

  return (
    <span className={`cnc-12__card ${flipping ? "is-flip" : ""}`} data-d={digit}>
      {/* 1. Static Top: shows the NEXT digit waiting underneath */}
      <span className="cnc-12__half cnc-12__half--t">
        <span>{flipping ? target : cur}</span>
      </span>

      {/* 2. Static Bottom: shows CURRENT digit until covered */}
      <span className="cnc-12__half cnc-12__half--b">
        <span>{cur}</span>
      </span>

      {/* 3. Moving Leaves: only mounted during the flip transition */}
      {flipping && (
        <>
          {/* Top Leaf folds down from 0 -> -90deg */}
          <span className="cnc-12__half cnc-12__half--t cnc-12__leaf cnc-12__leaf--t">
            <span>{cur}</span>
          </span>

          {/* Bottom Leaf unfolds from 90 -> 0deg */}
          <span className="cnc-12__half cnc-12__half--b cnc-12__leaf cnc-12__leaf--b">
            <span>{target}</span>
          </span>
        </>
      )}
    </span>
  );
}