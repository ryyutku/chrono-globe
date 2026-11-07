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
        "rounded-[24px] border border-[#DCDAD5] bg-[#FFFFFF]/92 backdrop-blur-xl shadow-xl text-[#050505]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
