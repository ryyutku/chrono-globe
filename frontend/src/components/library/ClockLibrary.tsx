'use client';

import React from 'react';
import { useClockStore } from '@/lib/store';
import ClockWidget from './ClockWidget';
import './ClockLibrary.css';

export default function ClockLibrary() {
  const clocks = useClockStore((state) => state.clocks);
  const addClock = useClockStore((state) => state.addClock);

  const samplePairs = [
    { from: 'Europe/London', to: 'Asia/Tokyo' },
    { from: 'America/New_York', to: 'Europe/Paris' },
    { from: 'Asia/Dubai', to: 'Australia/Sydney' },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-stone-900">
            Saved Clocks
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Persisted locally in your browser
          </p>
        </div>
      </div>

      {clocks.length === 0 ? (
        <div className="clock-empty-card rounded-3xl p-10 text-center">
          <p className="text-stone-600 font-medium mb-3">
            Your library is empty.
          </p>
          <p className="text-xs text-stone-500 mb-6">
            Convert a pair above and tap &ldquo;Save to Library&rdquo;, or try one of these suggestions:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {samplePairs.map((pair) => (
              <button
                key={`${pair.from}-${pair.to}`}
                type="button"
                onClick={() => addClock(pair.from, pair.to)}
                className="clock-suggest-btn px-4 py-2 rounded-xl text-xs font-semibold text-stone-700"
              >
                {pair.from.split('/')[1]} &rarr; {pair.to.split('/')[1]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="clock-library-grid">
          {clocks.map((clock) => (
            <ClockWidget
              key={clock.id}
              id={clock.id}
              sourceZone={clock.sourceZone}
              targetZone={clock.targetZone}
            />
          ))}
        </div>
      )}
    </section>
  );
}