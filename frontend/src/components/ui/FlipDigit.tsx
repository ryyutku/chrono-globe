// src/components/ui/FlipDigit.tsx

interface FlipDigitProps {
  value: string;
  label?: string;
}

export function FlipDigit({ value, label }: FlipDigitProps) {
  return (
    <div className="flex flex-col items-center">
      {/* 
        This wrapper is styled like an airport split-flap display card.
        When you're ready to add the flip animation, you only modify this element.
      */}
      <div className="relative flex h-14 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-2xl font-bold text-white shadow-inner sm:h-16 sm:w-14 sm:text-3xl">
        <span>{value}</span>
        {/* Subtle horizontal crease line mimicking split-flap boards */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-950/80 pointer-events-none" />
      </div>
      {label && (
        <span className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}