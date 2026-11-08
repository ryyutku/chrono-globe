TimeSpot — Modern Timezone Engine & Meeting Planner
One time. Two places. No timezone maths.
A high-contrast, editorial timezone utility and multi-zone overlap planner built with Next.js 15, TypeScript, Tailwind CSS, and a Python FastAPI canonical resolver backend.
Overview
Working across international boundaries often leads to mental math errors, ambiguous abbreviations (like CST or IST), and sudden Daylight Saving Time (DST) mismatches.
TimeSpot eliminates timezone confusion by resolving freeform queries (cities, countries, micro-islands, abbreviations, or GPS coordinates) down to canonical IANA timezone identities, performing accurate mathematical conversions in UTC, and finding non-disruptive meeting windows across international teams without requiring databases or accounts.
Key Features
1. Dual-Panel Time Converter
Side-by-Side Contrast Interface: Light FROM source panel paired with a solid black TO destination panel.
Direct Inline 24-Hour & 12-Hour Typing: Edit hours and minutes directly without disruptive browser popups or calendar wheels.
Auto AM/PM Intelligence: Typing hours 
≥
12
≥12
 automatically detects the period and flips between day/night. Includes a single-click AM ⇄ PM toggle.
Zero Client Timezone Leakage: Resolves conversion math in UTC, preventing the client's local browser from distorting destination times.
2. World Clocks Grid
Persistent Corridors: Track live timezone pairs saved directly in browser localStorage.
Editorial Contrast Cards: Dynamic distribution of high-contrast solid black and crisp white cards.
Sub-Conversions: Displays real-time ticking source times alongside converted destination offsets.
3. Multi-Zone Meeting Planner
24-Hour Overlap Grid: Visualizes 24 hourly pill slots across unlimited team locations.
Toggle Selection: Click any time slot to select a meeting window; click again to unselect.
Working Hour Color States: Highlights preferred working hours (9–17), outside-hours, and sleeping slots.
Full Persistence: Preserves selected dates, hours, durations, and custom participant lists across browser tabs.
4. Zero-Database Calendar Integrations
1-Click Schedulers: Generates pre-filled meeting links with calculated UTC start/end times directly for:
Google Meet (via Google Calendar Web Intent)
Microsoft Teams (via official Teams deep link)
Zoom (via instant meeting scheduler)
5. 3D Interactive Timezones Globe
Dedicated visual route (/zones) featuring an interactive 3D Earth space globe with a floating liquid glass navigation pill.
The 5-Layer Timezone Model
All inputs funnel down to Layer 3 (Canonical IANA Zone), which serves as the single source of truth:
Code
[ Layer 1: Abbreviations ]   (JST, IST, CST)
[ Layer 2: Places/Countries]  (Paris, Nepal, Sri Lanka, Tuvalu, Pitcairn)
[ Layer 2b: Coordinates ]    (48.85, 2.35 -> TimezoneFinder)
[ Layer 5: Aliases/Links ]   (Asia/Calcutta -> Asia/Kolkata, US/Eastern)
            │
            ▼
┌────────────────────────────────────────┐
│   Layer 3: Canonical IANA Identifier   │  <-- Single Source of Truth
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│ Layer 4: UTC Offset + Instant DST Math │
└────────────────────────────────────────┘
Tech Stack
Frontend
Framework: Next.js 15 (App Router, Turbopack)
Language: TypeScript (Strict Mode)
Styling: Tailwind CSS
Typography: Inter (tabular-nums for rock-solid, jitter-free clock digits)
Persistence: Client-side localStorage with lazy state initialization (zero SSR hydration mismatches)
Backend
Framework: FastAPI (Python 3.11+)
Server: Uvicorn
Data & Logic:
Standard library zoneinfo (IANA Olson database)
GeoNames dataset (cities15000.txt) for worldwide city resolutions
TimezoneFinder for GPS latitude/longitude resolution
ALL_TERRITORIES mapping covering sovereign nations, dependencies, and micro-islands
Project Structure
Text
timespot/
├── frontend/
│   ├── public/
│   │   └── videos/
│   │       └── earth.mp4           # Hero background video
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout & orange frame wrapper
│   │   │   ├── page.tsx            # Home page (Converter & Hero)
│   │   │   ├── globals.css         # Design tokens & tabular numeral styles
│   │   │   ├── clocks/
│   │   │   │   └── page.tsx        # World Clocks page
│   │   │   ├── planner/
│   │   │   │   └── page.tsx        # Meeting Planner page
│   │   │   └── zones/
│   │   │       └── page.tsx        # 3D Globe timezones view
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Nav.tsx         # Responsive navigation bar
│   │   │   │   └── Container.tsx   # Max-width layout wrapper
│   │   │   ├── sections/
│   │   │   │   ├── Hero.tsx        # Video hero banner
│   │   │   │   ├── FeaturePreview.tsx
│   │   │   │   └── QuickConverter.tsx # 2-panel conversion instrument
│   │   │   └── ui/
│   │   │       ├── ClockCard.tsx   # Saved clock card primitive
│   │   │       └── Toast.tsx       # Notification feedback pill
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   └── timezone.ts     # FastAPI client wrappers
│   │   │   ├── config/
│   │   │   │   └── nav.ts          # Central navigation configuration
│   │   │   └── utils/
│   │   │       └── calendar.ts     # Google Meet / Teams / Zoom link builders
│   │   └── types/
│   │       ├── clock.ts            # Saved clock interfaces
│   │       └── timezone.ts         # Pydantic-mirrored TypeScript types
│   ├── package.json
│   └── tsconfig.json
│
└── backend/
    ├── app/
    │   ├── main.py                 # FastAPI endpoints & CORS configuration
    │   ├── schemas.py              # Pydantic request/response schemas
    │   └── core/
    │       ├── layers.py           # 5-layer resolution & conversion logic
    │       └── territories.py      # Sovereign country & micro-island lookup
    ├── data/
    │   ├── aliases.json            # IANA backward compatibility links
    │   └── geonames/
    │       └── cities15000.txt     # Global populated places database
    └── requirements.txt
Getting Started
1. Prerequisites
Node.js: v18.18+ or v20+
Python: 3.10+
Package Managers: npm (or pnpm / bun) and pip
2. Backend Setup
Open a terminal and navigate to the backend directory:
Bash
cd backend
Create and activate a Python virtual environment:
macOS / Linux:
Bash
python3 -m venv venv
source venv/bin/activate
Windows (PowerShell):
Powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
Install backend dependencies:
Bash
pip install fastapi uvicorn timezonefinder requests pydantic
Start the FastAPI server:
Bash
uvicorn app.main:app --reload --port 8000
API Swagger Docs: http://localhost:8000/docs
Health Check: http://localhost:8000/health
3. Frontend Setup
Open a separate terminal and navigate to the frontend directory:
Bash
cd frontend
Install dependencies:
Bash
npm install
Configure environment variables (optional for local development):
Create a .env.local file in frontend/:
Env
NEXT_PUBLIC_API_URL=http://localhost:8000
Start the Next.js development server:
Bash
npm run dev
Open http://localhost:3000 in your browser.
API Reference
Method	Endpoint	Description	Sample Payload
GET	/health	Health check and loaded dataset telemetry	None
POST	/resolve	Resolves city, abbreviation, coords, or country to IANA zone	{"query": "Tokyo"}
POST	/convert	Converts local wall time between two canonical zones	{"when": "2026-11-08 18:06", "from_zone": "Asia/Bangkok", "to_zone": "America/New_York"}
POST	/world-clock	Returns instantaneous snapshot data for a list of IANA zones	{"zones": ["America/New_York", "Asia/Tokyo"]}
Design System
TimeSpot uses a high-contrast editorial color scheme:
Token	Hex Value	Usage
Vivid Orange	#F04B0B	Outer boundary frame, primary buttons, active pills
Warm Canvas	#ECEBE6	Inner background surface
Solid Black	#050505	Primary typography, destination cards
Pure White	#FFFFFF	Input cards, source panels, meeting pills
Muted Grey	#555555	Secondary timezone descriptions, sub-labels
Muted Border	#DCDAD5	Hairline dividers and card borders
Deployment
Frontend: Optimized for zero-configuration deployment on Vercel. Ensure NEXT_PUBLIC_API_URL points to your deployed backend URL.
Backend: Deployable on Render, Railway, or Fly.io using the start command:
Bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
(Remember to add your production frontend domain to allow_origins in backend/app/main.py).
License
MIT License. Free to use and modify for personal and commercial projects.
