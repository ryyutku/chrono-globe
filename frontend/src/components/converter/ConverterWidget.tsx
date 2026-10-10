'use client';

import React, { useState, useEffect } from 'react';
import { resolveQuery } from '@/lib/api';
import { ZoneCandidate } from '@/types';
import './ConverterWidget.css';

export default function ConverterWidget() {
  // 1. Detect user's current timezone on mount, default right side to UTC or Tokyo
  const [sourceZone, setSourceZone] = useState<string>('UTC');
  const [targetZone, setTargetZone] = useState<string>('Asia/Tokyo');

  // 2. Input search states
  const [sourceInput, setSourceInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [sourceCandidates, setSourceCandidates] = useState<ZoneCandidate[]>([]);
  const [targetCandidates, setTargetCandidates] = useState<ZoneCandidate[]>([]);

  // 3. Live clock tick (updates every second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Set user's actual browser timezone on start
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localZone) {
      setSourceZone(localZone);
      setSourceInput(localZone);
    }

    // 1-second ticking interval
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper to get formatted time & date for any IANA zone
  const formatTimeForZone = (zone: string) => {
    try {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      return {
        time: timeFormatter.format(currentTime),
        date: dateFormatter.format(currentTime),
      };
    } catch {
      return { time: '--:--:--', date: 'Invalid Timezone' };
    }
  };

  // Search timezone via backend
  const handleSearch = async (
    query: string,
    setZone: (z: string) => void,
    setCandidates: (c: ZoneCandidate[]) => void
  ) => {
    if (query.trim().length < 2) {
      setCandidates([]);
      return;
    }
    try {
      const res = await resolveQuery(query);
      if (res.status === 'unique' && res.zone) {
        setZone(res.zone);
        setCandidates([]);
      } else if (res.status === 'ambiguous' && res.candidates) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const leftDisplay = formatTimeForZone(sourceZone);
  const rightDisplay = formatTimeForZone(targetZone);

  return (
    <div className="converter-card">
      {/* LEFT SIDE: SOURCE */}
      <div className="converter-panel">
        <label className="converter-label">Your Timezone / Source</label>
        
        <input
          type="text"
          value={sourceInput}
          placeholder="Search city or zone (e.g. London, EST)"
          onChange={(e) => {
            setSourceInput(e.target.value);
            handleSearch(e.target.value, setSourceZone, setSourceCandidates);
          }}
          className="converter-input"
        />

        {/* Dropdown if query has multiple matches */}
        {sourceCandidates.length > 0 && (
          <ul className="converter-dropdown">
            {sourceCandidates.map((c) => (
              <li
                key={c.zone}
                onClick={() => {
                  setSourceZone(c.zone);
                  setSourceInput(c.zone);
                  setSourceCandidates([]);
                }}
              >
                {c.zone} ({c.abbrev})
              </li>
            ))}
          </ul>
        )}

        {/* Digital Clock Display */}
        <div className="clock-readout">
          <span className="clock-time">{leftDisplay.time}</span>
          <span className="clock-date">{leftDisplay.date}</span>
          <span className="clock-zone-name">{sourceZone}</span>
        </div>
      </div>

      {/* DIVIDER / ARROW */}
      <div className="converter-divider">
        <span>&rarr;</span>
      </div>

      {/* RIGHT SIDE: TARGET */}
      <div className="converter-panel">
        <label className="converter-label">Target Timezone</label>
        
        <input
          type="text"
          value={targetInput}
          placeholder="Search target city or zone (e.g. Tokyo, Paris)"
          onChange={(e) => {
            setTargetInput(e.target.value);
            handleSearch(e.target.value, setTargetZone, setTargetCandidates);
          }}
          className="converter-input"
        />

        {/* Dropdown if query has multiple matches */}
        {targetCandidates.length > 0 && (
          <ul className="converter-dropdown">
            {targetCandidates.map((c) => (
              <li
                key={c.zone}
                onClick={() => {
                  setTargetZone(c.zone);
                  setTargetInput(c.zone);
                  setTargetCandidates([]);
                }}
              >
                {c.zone} ({c.abbrev})
              </li>
            ))}
          </ul>
        )}

        {/* Digital Clock Display */}
        <div className="clock-readout">
          <span className="clock-time">{rightDisplay.time}</span>
          <span className="clock-date">{rightDisplay.date}</span>
          <span className="clock-zone-name">{targetZone}</span>
        </div>
      </div>
    </div>
  );
}