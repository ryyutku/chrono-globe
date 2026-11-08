# TimeSpot

## One time. Two places. No timezone maths.

A high-contrast, editorial timezone utility and multi-zone overlap planner built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and a **Python FastAPI** canonical resolver backend.

---

## Overview

Working across international boundaries often leads to mental math errors, ambiguous abbreviations (like **CST** or **IST**), and sudden Daylight Saving Time (DST) mismatches.

**TimeSpot** eliminates timezone confusion by resolving freeform queries (cities, countries, micro-islands, abbreviations, or GPS coordinates) down to canonical IANA timezone identities, performing accurate mathematical conversions in UTC, and finding non-disruptive meeting windows across international teams without requiring databases or accounts.

---

# Key Features

## 1. Dual-Panel Time Converter

- **Side-by-Side Contrast Interface**  
  Light **FROM** source panel paired with a solid black **TO** destination panel.

- **Direct Inline 24-Hour & 12-Hour Typing**  
  Edit hours and minutes directly without disruptive browser popups or calendar wheels.

- **Auto AM/PM Intelligence**  
  Typing hours `>= 12` automatically detects the period and flips between day/night. Includes a single-click AM ⇄ PM toggle.

- **Zero Client Timezone Leakage**  
  Resolves conversion math in UTC, preventing the client browser from distorting destination times.

---

## 2. World Clocks Grid

- **Persistent Corridors**  
  Track live timezone pairs saved directly in browser `localStorage`.

- **Editorial Contrast Cards**  
  Dynamic distribution of high-contrast solid black and crisp white cards.

- **Sub-Conversions**  
  Displays real-time ticking source times alongside converted destination offsets.

---

## 3. Multi-Zone Meeting Planner

- **24-Hour Overlap Grid**  
  Visualizes 24 hourly pill slots across unlimited team locations.

- **Toggle Selection**  
  Click any time slot to select a meeting window; click again to unselect.

- **Working Hour Color States**  
  Highlights preferred working hours (9–17), outside-hours, and sleeping slots.

- **Full Persistence**  
  Preserves selected dates, hours, durations, and custom participant lists across browser tabs.

---

## 4. Zero-Database Calendar Integrations

- **1-Click Schedulers** generate pre-filled meeting links with calculated UTC start/end times for:

  - **Google Meet** (via Google Calendar Web Intent)
  - **Microsoft Teams** (via official Teams deep link)
  - **Zoom** (via instant meeting scheduler)

---

## 5. 3D Interactive Timezones Globe

Dedicated visual route (`/zones`) featuring an interactive 3D Earth space globe with a floating liquid glass navigation pill.

---

# The 5-Layer Timezone Model

All inputs funnel down to **Layer 3 (Canonical IANA Zone)**, which serves as the single source of truth:

```text
[ Layer 1: Abbreviations ]    (JST, IST, CST)

[ Layer 2: Places/Countries ] (Paris, Nepal, Sri Lanka,
                                Tuvalu, Pitcairn)

[ Layer 2b: Coordinates ]     (48.85, 2.35)
                                -> TimezoneFinder

[ Layer 5: Aliases/Links ]    (Asia/Calcutta -> Asia/Kolkata,
                                US/Eastern)

                │
                ▼

┌────────────────────────────────────────┐
│ Layer 3: Canonical IANA Identifier     │
│       Single Source of Truth           │
└────────────────────────────────────────┘

                │
                ▼

┌────────────────────────────────────────┐
│ Layer 4: UTC Offset + Instant DST Math │
└────────────────────────────────────────┘
```
