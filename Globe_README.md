# Globe Page (`/globe`)

An interactive 3D Earth added to the chronos-globe frontend. Click a country to see its live local time and time zone(s), drop pins, and add pins by choosing a time zone from a list.

This page is self-contained. It does not use the backend or the Zustand store yet (see [Connecting to the clock store](#connecting-to-the-clock-store-later)).

---

## What it does

- Shows a rotatable, zoomable 3D Earth
- Highlights a country in gold when you hover it
- **Click a country:** opens a glass panel with a live ticking clock for each of its time zones, and drops a pin where you clicked
- **Left panel:** choose any time zone, press **Add pin** to place a pin for it, remove pins with ✕, or **Clear all**
- **Nav bar:** switches between Home (`/`) and Globe (`/globe`)

---

## Tech used, and why

| Tool | Used for | Why |
|---|---|---|
| `react-globe.gl` | The 3D globe | Ready-made: rotate, zoom, clickable countries, pins. Much faster than building from scratch |
| `three` | 3D engine under the globe | Required by `react-globe.gl` |
| `countries-and-timezones` | Country → time zone names | Means no country or zone names are typed by hand |
| `Intl.DateTimeFormat` (built into the browser) | Live time and UTC offset | No install, and handles daylight saving automatically |
| `GlassCard` (existing) | Panels | Keeps the glass/gold look consistent with the rest of the site |
| `countries.geojson` | Country shapes | The globe draws these and makes them clickable |

---

## File map

```
frontend/
├── public/
│   └── countries.geojson          # country shapes (downloaded once)
└── src/
    ├── app/
    │   ├── layout.tsx             # contains <NavBar />
    │   └── globe/
    │       └── page.tsx           # the /globe route, just renders <GlobeView />
    └── components/
        ├── nav/
        │   ├── NavBar.tsx         # Home / Globe switcher
        │   └── NavBar.css
        └── globe/
            ├── GlobeView.tsx      # the globe, click logic, pins, both panels
            ├── GlobeView.css
            ├── LiveClock.tsx      # ticking clock for one time zone name
            └── LiveClock.css
```

Next.js turns the folder name `app/globe/` into the URL `/globe`.

---

## How it works

### 1. Loading
`GlobeView` loads `/countries.geojson` once when the page opens and keeps the country shapes in state. The globe itself is loaded with `dynamic(..., { ssr: false })` because it uses WebGL, which only exists in the browser.

### 2. Clicking a country
```
click country
  → read its country code from the shape's properties
  → getCountry(code).timezones   (e.g. ["Asia/Colombo"])
  → show a LiveClock for each time zone in the right panel
  → drop a pin at the click position, labeled with the first time zone
```
Some countries have a bad code in the data file (France, for example), so `codeOf()` picks the better of two code fields.

### 3. The live clock
`LiveClock` takes a time zone name like `Asia/Colombo`, updates every second with `setInterval`, and formats the time with:

```ts
new Intl.DateTimeFormat("en-GB", { timeZone: tzid, ... }).format(now)
```

The browser knows every time zone and its daylight saving rules, so no extra data is needed.

### 4. Adding a pin from the selector
```
choose zone in dropdown → press Add pin
  → getAllTimezones()[zone].countries[0]   (first country using that zone)
  → find that country's shape
  → center() = average point of its biggest piece
  → add a pin there
```

### 5. Pins
Pins are a list in React state: `{ id, lat, lng, tz }`. They're drawn on the globe as gold dots with labels. ✕ removes one by `id`.

### 6. Styling
All CSS is in separate `.css` files next to each component, with no inline styles. The panels use `GlassCard` plus the classes `globe-panel`, `globe-panel--left` and `globe-panel--right`. The selectors are written as `.globe-page .globe-panel` so they win over `GlassCard`'s own positioning.

---

## Setup from scratch

In PowerShell, from the `frontend` folder:

```
npm install react-globe.gl three countries-and-timezones
npm install -D @types/three
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson" -OutFile public/countries.geojson
```

Then create the files in the file map above and add `<NavBar />` above `{children}` inside `<body>` in `layout.tsx`.

## Run it

```
cd frontend
npm run dev
```

Open http://localhost:3000/globe. The backend does not need to be running for this page.

---

## Things you can tweak

| Want to change | Edit |
|---|---|
| Hover color of countries | `polygonCapColor` in `GlobeView.tsx` |
| Pin label color and size | `labelColor`, `labelSize` in `GlobeView.tsx` |
| Page background | `.globe-page` in `GlobeView.css` |
| Panel position and width | `.globe-panel--left` / `--right` in `GlobeView.css` |
| Clock look | `LiveClock.css` |
| Earth image | `globeImageUrl` in `GlobeView.tsx` |

---

## Connecting to the clock store (later)

`store.ts` stays the single source of truth. A saved clock is `{ id, sourceZone, targetZone }`, so a globe pin maps naturally to a clock's `targetZone`.

In `GlobeView.tsx`, the line marked `LATER` is the only one that needs to change:

```ts
// LATER: replace this pins state with the Zustand store (src/lib/store.ts)
const [pins, setPins] = useState<Pin[]>([]);
```

Replace it with data from the store, and use `addClock` / `removeClock` instead of the local `setPins` calls.

---

## Known limits

- Countries with several time zones (USA, Russia) list all of them in the popup, but the pin is labeled with only the first one.
- Pins added from the selector land near the middle of the zone's first country, so they're approximate. Exact positions would need real time zone boundary data.
- The Earth image loads from the internet. Without a connection the globe appears without a texture.
- Zones with no country (like `Etc/UTC`) can't be placed on the globe, and the selector shows an alert.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `GlassCard` import error | Check the path `src/components/ui/GlassCard.tsx`; if it has a named export, use `import { GlassCard } from ...` |
| Panels in the wrong place | `GlassCard.css` sets its own position; adjust the selectors in `GlobeView.css` |
| Panel text hard to read | Change `color` in `.globe-panel` |
| Blank page or red error | Press F12, open the Console tab, and read the error |
| `three` version conflict | Another package wants a different `three` version; keep one version for both this page and React Three Fiber |

## Ideas for next

- Search box with fly-to
- Day/night shading
- Real time zone boundaries instead of country centers
- "Save to Library" on pins once the store is connected