// src/components/ui/GlassCard.tsx
import React from "react";
import { cn } from "@/lib/utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5 backdrop-blur-xl shadow-2xl text-zinc-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
