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

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-3 rounded-full bg-[#FFFFFF] border border-[#DCDAD5] px-4 py-2.5 shadow-xl text-xs font-bold text-[#050505]">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white ${
            type === "success" ? "bg-[#F04B0B]" : "bg-[#050505]"
          }`}
        >
          {type === "success" ? "✓" : "!"}
        </span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-[#777777] hover:text-[#050505] transition p-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}