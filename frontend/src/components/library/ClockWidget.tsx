'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useClockStore } from '@/lib/store';
import './ClockWidget.css';

interface ClockWidgetProps {
  id: string;
  sourceZone: string;
  targetZone: string;
}

export default function ClockWidget({ id, sourceZone, targetZone }: ClockWidgetProps) {
  const removeClock = useClockStore((state) => state.removeClock);
  const [mode, setMode] = useState<'digital' | 'analog'>('digital');
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTargetParts = () => {
    if (!time) return { timeStr: '--:--:--', dateStr: '', hours: 0, minutes: 0, seconds: 0 };
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: targetZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateDtf = new Intl.DateTimeFormat('en-US', {
        timeZone: targetZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const parts = dtf.formatToParts(time);
      const hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const seconds = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

      return {
        timeStr: dtf.format(time),
        dateStr: dateDtf.format(time),
        hours,
        minutes,
        seconds,
      };
    } catch {
      return { timeStr: '--:--:--', dateStr: 'Invalid Zone', hours: 0, minutes: 0, seconds: 0 };
    }
  };

  const { timeStr, dateStr, hours, minutes, seconds } = getTargetParts();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <GlassCard className="clock-widget-container p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            {sourceZone.split('/').pop()?.replace('_', ' ')} &rarr;
          </div>
          <h3 className="text-base font-semibold text-stone-900 tracking-tight">
            {targetZone.split('/').pop()?.replace('_', ' ')}
          </h3>
          <p className="text-[11px] text-stone-500 font-medium">{targetZone}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'digital' ? 'analog' : 'digital')}
            className="p-1.5 text-xs rounded-lg text-stone-600 hover:bg-stone-200/50 transition-colors"
            title="Toggle view"
          >
            {mode === 'digital' ? 'Dial' : 'Digital'}
          </button>
          <button
            type="button"
            onClick={() => removeClock(id)}
            className="clock-remove-btn p-1 text-stone-400"
            title="Remove clock"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Middle Display */}
      <div className="my-auto flex justify-center py-2">
        {mode === 'digital' ? (
          <div className="text-center">
            <div className="clock-digital-digits text-3xl font-light text-stone-900">
              {timeStr}
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium">{dateStr}</div>
          </div>
        ) : (
          <div className="analog-dial">
            <div
              className="dial-hand dial-hand-hour"
              style={{ transform: `rotate(${hourDeg}deg)` }}
            />
            <div
              className="dial-hand dial-hand-minute"
              style={{ transform: `rotate(${minuteDeg}deg)` }}
            />
            <div
              className="dial-hand dial-hand-second"
              style={{ transform: `rotate(${secondDeg}deg)` }}
            />
            <div className="dial-pin" />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-stone-500 flex justify-between border-t border-stone-200/40 pt-2.5">
        <span>Source: {sourceZone.split('/')[0]}</span>
        <span>Target: {targetZone.split('/')[0]}</span>
      </div>
    </GlassCard>
  );
}