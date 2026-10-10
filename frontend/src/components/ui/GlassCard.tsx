// src/components/ui/GlassCard.tsx
"use client";

import React, { useCallback, useRef, useState } from "react";
import "./GlassCard.css";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Show the diagonal sheen layer (default true). */
  sheen?: boolean;
  /** Disable the click squeeze + burst animation (default false). */
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = "",
  sheen = true,
  interactive = true,
  onClick,
  ...props
}: GlassCardProps) {
  const [bursting, setBursting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive) {
        setBursting(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setBursting(false), 480);
      }
      onClick?.(e);
    },
    [interactive, onClick]
  );

  const classes = [
    "glass-card",
    bursting ? "glass-card--burst" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={handleClick} {...props}>
      {sheen && <div className="glass-card__sheen" aria-hidden="true" />}
      <div className="glass-card__content">{children}</div>
    </div>
  );
}