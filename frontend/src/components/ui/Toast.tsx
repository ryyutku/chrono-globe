// src/components/ui/Toast.tsx

"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "warning";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === "success" 
    ? "border-emerald-600/50 bg-emerald-950/90 text-emerald-200" 
    : "border-amber-600/50 bg-amber-950/90 text-amber-200";

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md text-sm font-medium ${bgColor}`}>
        <span>{type === "success" ? "✓" : "⚠"}</span>
        <span>{message}</span>
        <button 
          onClick={onClose} 
          className="ml-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}