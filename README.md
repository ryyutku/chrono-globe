# TimeSpot - Modern Timezone Engine & Meeting Planner

> **One time. Two places. No timezone maths.**

A high-contrast, editorial timezone utility and multi-zone overlap
planner built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and
a **Python FastAPI** canonical resolver backend.

## Overview

Working across international boundaries often leads to mental-math
errors, ambiguous abbreviations (such as `CST` or `IST`), and unexpected
Daylight Saving Time (DST) mismatches.

TimeSpot eliminates timezone confusion by resolving freeform
queries---including cities, countries, micro-islands, abbreviations, and
GPS coordinates---into canonical IANA timezone identities. It performs
accurate conversions in UTC and finds practical meeting windows across
international teams, without requiring databases or user accounts.

## Key Features

### 1. Dual-Panel Time Converter

-   **Side-by-side contrast interface:** A light `FROM` source panel
    paired with a solid-black `TO` destination panel.
-   **Direct inline 24-hour and 12-hour typing:** Edit hours and minutes
    directly, without disruptive browser popups or calendar wheels.
-   **Automatic AM/PM intelligence:** Typing an hour of `12` or greater
    automatically detects the period and switches between day and night.
    A single-click AM/PM toggle is also available.
-   **No client-timezone leakage:** Conversion calculations are
    performed in UTC, preventing the client's local browser timezone
    from distorting destination times.

### 2. World Clocks Grid

-   **Persistent corridors:** Track live timezone pairs saved directly
    in browser `localStorage`.
-   **Editorial contrast cards:** A dynamic arrangement of high-contrast
    solid-black and crisp-white cards.
-   **Sub-conversions:** Display live source times alongside converted
    destination times and offsets.

### 3. Multi-Zone Meeting Planner

-   **24-hour overlap grid:** Visualize 24 hourly pill slots across an
    unlimited number of team locations.
-   **Toggle selection:** Click a time slot to select a meeting window;
    click it again to unselect it.
-   **Working-hour color states:** Distinguish preferred working hours
    (`09:00–17:00`), outside-working hours, and sleeping hours.
-   **Full persistence:** Preserve selected dates, hours, durations, and
    custom participant lists across browser tabs.

### 4. Zero-Database Calendar Integrations

Generate pre-filled meeting links with calculated UTC start and end
times in one click:

-   **Google Meet:** Via Google Calendar Web Intent.
-   **Microsoft Teams:** Via the official Teams deep link.
-   **Zoom:** Via the instant meeting scheduler.

### 5. 3D Interactive Timezones Globe

A dedicated visual route (`/zones`) featuring an interactive 3D Earth
space globe and a floating liquid-glass navigation pill.

## The Five-Layer Timezone Model

All inputs funnel down to **Layer 3 (Canonical IANA Zone)**, which acts
as the single source of truth.

``` text
[ Layer 1: Abbreviations ]    JST, IST, CST
[ Layer 2: Places/Countries ] Paris, Nepal, Sri Lanka, Tuvalu, Pitcairn
[ Layer 2b: Coordinates ]     48.85, 2.35 -> TimezoneFinder
[ Layer 5: Aliases/Links ]    Asia/Calcutta -> Asia/Kolkata, US/Eastern
              |
              v
+------------------------------------------+
| Layer 3: Canonical IANA Identifier       |  <- Single source of truth
+------------------------------------------+
              |
              v
+------------------------------------------+
| Layer 4: UTC Offset + Instant DST Math   |
+------------------------------------------+
```

## Tech Stack

### Frontend

  -----------------------------------------------------------------------
  Area                                Technology / Approach
  ----------------------------------- -----------------------------------
  Framework                           Next.js 15 (App Router, Turbopack)

  Language                            TypeScript (strict mode)

  Styling                             Tailwind CSS

  Typography                          Inter, using tabular numerals for
                                      stable clock digits

  Persistence                         Client-side `localStorage` with
                                      lazy state initialization to avoid
                                      SSR hydration mismatches
  -----------------------------------------------------------------------

### Backend

  -----------------------------------------------------------------------
  Area                                Technology / Approach
  ----------------------------------- -----------------------------------
  Framework                           FastAPI

  Python                              Python 3.11+

  Server                              Uvicorn

  Timezone logic                      Standard-library `zoneinfo` and the
                                      IANA timezone database

  City data                           GeoNames `cities15000.txt` dataset

  Coordinate resolution               TimezoneFinder

  Territory coverage                  `ALL_TERRITORIES` mapping for
                                      sovereign nations, dependencies,
                                      and micro-islands
  -----------------------------------------------------------------------

## Project Structure

``` text
timespot/
├── frontend/
│   ├── public/
│   │   └── videos/
│   │       └── earth.mp4              # Hero background video
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout and orange frame wrapper
│   │   │   ├── page.tsx               # Home page (Converter and Hero)
│   │   │   ├── globals.css            # Design tokens and tabular numeral styles
│   │   │   ├── clocks/
│   │   │   │   └── page.tsx           # World Clocks page
│   │   │   ├── planner/
│   │   │   │   └── page.tsx           # Meeting Planner page
│   │   │   └── zones/
│   │   │       └── page.tsx           # 3D Globe timezones view
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Nav.tsx            # Responsive navigation bar
│   │   │   │   └── Container.tsx      # Maximum-width layout wrapper
│   │   │   ├── sections/
│   │   │   │   ├── Hero.tsx           # Video hero banner
│   │   │   │   ├── FeaturePreview.tsx
│   │   │   │   └── QuickConverter.tsx # Two-panel conversion instrument
│   │   │   └── ui/
│   │   │       ├── ClockCard.tsx      # Saved clock card primitive
│   │   │       └── Toast.tsx          # Notification feedback pill
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   └── timezone.ts        # FastAPI client wrappers
│   │   │   ├── config/
│   │   │   │   └── nav.ts             # Central navigation configuration
│   │   │   └── utils/
│   │   │       └── calendar.ts        # Google Meet / Teams / Zoom link builders
│   │   └── types/
│   │       ├── clock.ts               # Saved clock interfaces
│   │       └── timezone.ts            # Pydantic-mirrored TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
└── backend/
    ├── app/
    │   ├── main.py                    # FastAPI endpoints and CORS configuration
    │   ├── schemas.py                 # Pydantic request/response schemas
    │   └── core/
    │       ├── layers.py              # Five-layer resolution and conversion logic
    │       └── territories.py         # Sovereign country and micro-island lookup
    ├── data/
    │   ├── aliases.json               # IANA backward-compatibility links
    │   └── geonames/
    │       └── cities15000.txt        # Global populated-places database
    └── requirements.txt
```

## Getting Started

### 1. Prerequisites

-   **Node.js:** v18.18+ or v20+
-   **Python:** 3.10+
-   **Package managers:** npm (or pnpm / bun) and pip

### 2. Backend Setup

Open a terminal and navigate to the backend directory:

``` bash
cd backend
```

Create and activate a Python virtual environment.

**macOS / Linux**

``` bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell)**

``` powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

``` bash
pip install fastapi uvicorn timezonefinder requests pydantic
```

Start the FastAPI server:

``` bash
uvicorn app.main:app --reload --port 8000
```

-   **API documentation (Swagger):** <http://localhost:8000/docs>
-   **Health check:** <http://localhost:8000/health>

### 3. Frontend Setup

Open a separate terminal and navigate to the frontend directory:

``` bash
cd frontend
```

Install the frontend dependencies:

``` bash
npm install
```

Configure the environment variable (optional for local development).

Create a `.env.local` file in `frontend/`:

``` env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:

``` bash
npm run dev
```

Open <http://localhost:3000> in your browser.

## API Reference

  --------------------------------------------------------------------------------------------------------------------------------------------------
  Method            Endpoint          Description       Sample Payload
  ----------------- ----------------- ----------------- --------------------------------------------------------------------------------------------
  `GET`             `/health`         Health check and  ---
                                      loaded-dataset    
                                      telemetry         

  `POST`            `/resolve`        Resolves a city,  `{"query": "Tokyo"}`
                                      abbreviation,     
                                      coordinates, or   
                                      country to an     
                                      IANA timezone     

  `POST`            `/convert`        Converts local    `{"when": "2026-11-08 18:06", "from_zone": "Asia/Bangkok", "to_zone": "America/New_York"}`
                                      wall time between 
                                      two canonical     
                                      zones             

  `POST`            `/world-clock`    Returns an        `{"zones": ["America/New_York", "Asia/Tokyo"]}`
                                      instantaneous     
                                      snapshot for a    
                                      list of IANA      
                                      zones             
  --------------------------------------------------------------------------------------------------------------------------------------------------

## Design System

TimeSpot uses a high-contrast editorial color scheme.

  -----------------------------------------------------------------------
  Token                   Hex Value               Usage
  ----------------------- ----------------------- -----------------------
  Vivid Orange            `#F04B0B`               Outer boundary frame,
                                                  primary buttons, and
                                                  active pills

  Warm Canvas             `#ECEBE6`               Inner background
                                                  surface

  Solid Black             `#050505`               Primary typography and
                                                  destination cards

  Pure White              `#FFFFFF`               Input cards, source
                                                  panels, and meeting
                                                  pills

  Muted Grey              `#555555`               Secondary timezone
                                                  descriptions and
                                                  sub-labels

  Muted Border            `#DCDAD5`               Hairline dividers and
                                                  card borders
  -----------------------------------------------------------------------

## Deployment

### Frontend

The frontend is designed for deployment on [Vercel](https://vercel.com).

Ensure that `NEXT_PUBLIC_API_URL` points to the deployed backend URL.

### Backend

The backend can be deployed on platforms such as Render, Railway, or
Fly.io.

Use the following start command:

``` bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Add your production frontend domain to the `allow_origins` configuration
in `backend/app/main.py`.

## License

MIT License. Free to use and modify for personal and commercial
projects.
