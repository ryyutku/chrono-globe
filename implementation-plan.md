Does 24timezones.com Provide an API?
No. 24timezones.com is a consumer-facing website, not a data provider. It has no public API. Historical Stack Overflow answers mention that timeanddate.com (a similar site) offers an API but only free for 3 months. 24timezones.com does not.

Don't scrape it. Their terms of service almost certainly prohibit it, and the data would be stale. You need a proper data source.

Free / Open-Source Providers (No Limits)
Here's the landscape, organized by what they give you:

For IANA Zone Data (Layer 3 & 4)
Resource	What It Gives You	License / Cost
Python zoneinfo	IANA zone database built into Python 3.9+. available_timezones() returns all canonical zones.	Free, stdlib
tzdata (PyPI)	Ships the IANA database with your app. Needed on systems without a system tz database.	Free, open source
pytz	all_timezones includes aliases and deprecated names (600+ identifiers).	Free, open source
IANA tz database	The raw source files (data.iana.org/time-zones). You can parse backward for aliases.	Free, public domain
@vvo/tzdb (npm)	Simplified IANA zones with alternative names, major cities, abbreviations, and deprecated names for compatibility. Auto-updated from GeoNames.	Free, MIT
countries-states-cities-database	250 countries, 5,299 states, 153,765 cities, and 427 timezones with 100% IANA coverage.	Free, ODbL (attribution required)
For Coordinate → Timezone (Layer 2 Bridge)
Resource	What It Gives You	License / Cost
timezonefinder (Python)	Offline lookup: given lat/lng, returns the IANA zone. Works for every coordinate on Earth, including oceans.	Free, MIT
geo2tz	High-performance coordinate → timezone service. Free hosting available.	Free, open source
GeoNames	timeZones.txt maps timezone names to offsets; cities500.txt gives place names with lat/lon.	Free, CC-BY
For Abbreviations (Layer 1 Bridge)
Resource	What It Gives You	License / Cost
@vvo/tzdb	An abbreviations object mapping abbreviations to full forms (EST → Eastern Standard Time).	Free, MIT
timezone-abbreviations (npm)	Extracted from Wikipedia + verified with Intl.DateTimeFormat.	Free, open source
timezone-i18n	Multilingual dataset with IANA names, country codes, abbreviations, and raw offsets.	Free, open source
For a Ready-Made API (If You Want to Test Quickly)
Resource	What It Gives You	Limits
WorldTimeZoneServer (GitHub)	Public REST API for timezone and country data. No authentication needed.	Self-hosted
OpenTimezone API	Fully free, no API key required. Timezone list and time conversion.	Free
timeapi.io	Free, no auth. IANA timezones, IP-to-timezone, DST status.	Free tier
chronosync-mcp	Free, keyless timezone converter with IANA/DST accuracy.	Free
TinyFn List Timezones	Returns all timezone abbreviations (EST, PST, GMT, etc.).	Free API key
The key takeaway: You don't need to pay for anything. The combination of Python's zoneinfo + timezonefinder + @vvo/tzdb (or its data) covers all 5 layers for free, offline, with no rate limits.

How the 5 Layers Merge Together
Here's the mental model. Think of it as a pipeline where each layer resolves to the one below it:

text
USER INPUT (any of these)
    │
    ├─ "CST" ──────────────────┐
    ├─ "Calcutta" ─────────────┤
    ├─ "Fiji" ─────────────────┤
    ├─ "28.6139, 77.2090" ─────┤
    ├─ "UTC+5:30" ─────────────┤
    └─ "Asia/Kolkata" ─────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 1: ABBREVIATION RESOLVER                       │
│  "CST" → [US Central, China, Cuba, Australia Central] │
│  "IST" → [India, Ireland, Israel]                     │
│  Ambiguous → show all options                         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 2: PLACE NAME RESOLVER                         │
│  "Calcutta" → Asia/Kolkata                           │
│  "Fiji" → Pacific/Fiji                               │
│  "Nairobi" → Africa/Nairobi                          │
│  Uses: GeoNames / countries-states-cities DB         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 2b: COORDINATE RESOLVER (if lat/lng given)    │
│  (28.6139, 77.2090) → Asia/Kolkata                   │
│  Uses: timezonefinder                                │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 3: IANA ZONE (the canonical identity)         │
│  "Asia/Kolkata"                                      │
│  All paths converge here.                            │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 4: OFFSET + DST RESOLVER                      │
│  Asia/Kolkata → UTC+5:30 (no DST)                    │
│  America/New_York → UTC-5 (EST) or UTC-4 (EDT)       │
│  Uses: zoneinfo.ZoneInfo                             │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  LAYER 5: IDENTIFIER RESOLVER (aliases)              │
│  "Asia/Calcutta" → Asia/Kolkata (deprecated alias)   │
│  "US/Eastern" → America/New_York (legacy alias)      │
│  Uses: pytz.all_timezones / IANA backward file       │
└──────────────────────────────────────────────────────┘
The Critical Insight
Layers 1, 2, 2b, and 5 are all "resolvers" that converge on Layer 3 (IANA zone). Layer 4 is a computed property of Layer 3 at a given moment.

This means your architecture is:

text
Input (any layer 1, 2, 2b, or 5)
    → Resolve to IANA zone (Layer 3)
        → Compute offset + DST (Layer 4)
            → Display to user
You don't need to "merge" them in a complex way. You need one resolver function per layer that all feed into the same IANA zone.

The Architecture (Separate → Integrated)
Phase 1: Build Each Layer Separately (Testing)
Build small, independent Python modules you can test in isolation:

text
tz_layers/
├── abbreviations.py     # Layer 1: CST → list of possibilities
├── places.py            # Layer 2: "Calcutta" → Asia/Kolkata
├── coordinates.py       # Layer 2b: (lat,lng) → Asia/Kolkata
├── iana.py              # Layer 3: list all zones, validate names
├── offsets.py           # Layer 4: zone + datetime → offset/DST
└── aliases.py           # Layer 5: "US/Eastern" → America/New_York
Each one is a simple function. Test them independently:

python
# abbreviations.py
def resolve_abbreviation(abbr: str) -> list[dict]:
    """'CST' → [{zone: 'America/Chicago', offset: 'UTC-6'}, ...]"""
    # Load from @vvo/tzdb abbreviations data
    ...

# places.py
def find_zones_by_place(query: str) -> list[dict]:
    """'Calcutta' → [{zone: 'Asia/Kolkata', ...}]"""
    # Query GeoNames cities DB
    ...

# coordinates.py
def zone_from_coordinates(lat: float, lng: float) -> str:
    """(28.6139, 77.2090) → 'Asia/Kolkata'"""
    from timezonefinder import TimezoneFinder
    tf = TimezoneFinder()
    return tf.timezone_at(lat=lat, lng=lng)

# iana.py
from zoneinfo import available_timezones
def list_all_zones() -> set[str]:
    return available_timezones()

# offsets.py
from zoneinfo import ZoneInfo
from datetime import datetime
def get_offset(zone_name: str, dt: datetime = None) -> dict:
    dt = dt or datetime.now(ZoneInfo(zone_name))
    tz = ZoneInfo(zone_name)
    local = dt.astimezone(tz)
    return {
        "zone": zone_name,
        "offset": local.utcoffset(),
        "dst": bool(local.dst()),
        "abbreviation": local.tzname()
    }

# aliases.py
from pytz import all_timezones
def resolve_alias(name: str) -> str:
    """'Asia/Calcutta' → 'Asia/Kolkata'"""
    # Check against IANA backward file
    ...
Phase 2: The Unified Resolver (Integration)
Once each layer works, build a single function that chains them:

python
def resolve_to_iana(query: str, lat: float = None, lng: float = None) -> list[dict]:
    """
    Accepts any user input and returns list of matching IANA zones.
    
    Order of resolution:
    1. If it's a valid IANA zone → return it
    2. If it's an alias → resolve to canonical
    3. If it's a coordinate → use timezonefinder
    4. If it's a place name → search GeoNames
    5. If it's an abbreviation → return all matches
    """
    results = []
    
    # Layer 3 + 5: exact IANA or alias
    if is_valid_iana(query) or is_alias(query):
        canonical = resolve_alias(query) if is_alias(query) else query
        results.append({"zone": canonical, "source": "direct"})
    
    # Layer 2b: coordinates
    if lat is not None and lng is not None:
        zone = zone_from_coordinates(lat, lng)
        results.append({"zone": zone, "source": "coordinates"})
    
    # Layer 2: place name
    place_matches = find_zones_by_place(query)
    results.extend(place_matches)
    
    # Layer 1: abbreviation
    abbr_matches = resolve_abbreviation(query)
    results.extend(abbr_matches)
    
    # Deduplicate by IANA zone name
    return deduplicate(results)
Phase 3: The Final Product Shape
In your Next.js + FastAPI app, the integration looks like this:

text
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend                                        │
│                                                          │
│  [Search box: user types "CST"]                         │
│         │                                                │
│         ▼                                                │
│  [Dropdown shows:                                        │
│    • Central Standard Time (US) — UTC-6                 │
│    • China Standard Time — UTC+8                        │
│    • Cuba Standard Time — UTC-5                         │
│    • Australian Central Standard Time — UTC+9:30]       │
│         │                                                │
│         ▼                                                │
│  [User picks one → stored as IANA zone in localStorage] │
│         │                                                │
│         ▼                                                │
│  [Clock card displays:                                   │
│    City name | Current time | UTC offset | DST badge]   │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/world-clock
                       │ { zones: ["America/Chicago", "Asia/Kolkata"] }
                       ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI Backend                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  resolve_to_iana()  ← unified resolver           │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  get_offset()  ← zoneinfo computation            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  meeting_planner()  ← cross-zone comparison      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
What Benefits Everyone Around the World
This is the important design question. Here's what makes a world clock app genuinely useful globally:

1. Search by Whatever the User Knows
A user in Fiji doesn't know "Pacific/Fiji." They know "Fiji." A user in Nepal doesn't know "Asia/Kathmandu." They know "Nepal" or "Kathmandu." A developer knows "Asia/Kolkata." A business person knows "IST." Your search must accept all of these and resolve to the right zone.

This is why the 5-layer resolver matters: it meets users where they are, not where you are.

2. Always Show the UTC Offset
The abbreviation is a label. The offset is the truth. Show both:

text
Central Standard Time (US)
Chicago
UTC−6  |  CST  |  No DST
This eliminates the "which CST?" problem. A user in China sees "China Standard Time (UTC+8)" and immediately knows it's different.

3. Disambiguate Abbreviations
When someone types "CST," don't guess. Show all 4 possibilities with their offsets. Let them pick. This is especially important for international business users who might be scheduling across US, China, and Cuba simultaneously.

4. Handle DST Explicitly
A zone's offset changes twice a year in many countries. Your app must show:

Current offset (e.g., UTC−4)

Standard offset (e.g., UTC−5)

DST status (e.g., "DST active until Nov 2")

Abbreviation (e.g., "EDT" vs "EST")

This is what zoneinfo gives you for free. Never hardcode offsets.

5. Support the Meeting Planner
This is the killer feature. A world clock alone is decorative. A world clock that shows overlapping work hours across all saved zones is genuinely useful. For a company with teams in New York, London, Bangalore, and Sydney, seeing "the only 2-hour window where everyone is awake" is the reason to use the app.

6. Include Obscure Regions in Search
Your GeoNames database should include all populated places (cities500.txt or allCountries.txt filtered to feature class P). This means a user in a village in Bhutan or a small island in Kiribati can search their local place name and find their zone. The timezonefinder library handles the coordinate resolution for any point on Earth.

7. Offline-First Data
Once the app loads, the zone list and place database should be cached client-side. The only thing that needs the backend is the current time computation (or you can do that client-side with Intl.DateTimeFormat). This makes the app fast and usable even on slow connections — important for users in regions with poor internet.

8. Open Data, Open Source
Use ODbL-licensed data (countries-states-cities-database) and MIT-licensed libraries (timezonefinder, @vvo/tzdb). This means anyone can fork your project, improve it, and deploy it for their own community. A timezone app should be a public utility, not a proprietary product.

Recommended Stack (Final)
Layer	Tool	Why
Layer 1: Abbreviations	@vvo/tzdb abbreviations + custom disambiguation UI	Free, comprehensive, MIT
Layer 2: Place names	countries-states-cities-database (SQLite) + GeoNames cities500.txt	153k+ cities, 427 timezones, ODbL
Layer 2b: Coordinates	timezonefinder (Python)	Offline, works for every coordinate
Layer 3: IANA zones	zoneinfo.available_timezones() + pytz.all_timezones	Stdlib + 600+ identifiers
Layer 4: Offsets/DST	zoneinfo.ZoneInfo	Handles DST, half-hour, 45-min offsets
Layer 5: Aliases	IANA backward file parsed, or pytz.all_timezones	Deprecated names still resolve
Backend	FastAPI (Python)	Lightweight, async, auto OpenAPI docs
Frontend	Next.js	Your choice, good for deployment practice
Next Step
Start with Layer 3 + Layer 4 in a single Python script. This is the foundation:

python
from zoneinfo import ZoneInfo, available_timezones
from datetime import datetime

# Layer 3: List all zones
zones = available_timezones()
print(f"Total IANA zones: {len(zones)}")

# Layer 4: Get offset for a zone
def zone_info(name: str):
    tz = ZoneInfo(name)
    now = datetime.now(tz)
    return {
        "zone": name,
        "time": now.strftime("%H:%M"),
        "offset": str(now.utcoffset()),
        "dst": bool(now.dst()),
        "abbr": now.tzname()
    }

# Test edge cases
for z in ["Asia/Kolkata", "Asia/Kathmandu", "Pacific/Chatham", "America/New_York"]:
    print(zone_info(z))
Run that. Once Layer 3 + 4 work, add Layer 2b (timezonefinder) and Layer 2 (GeoNames). Layer 1 and 5 are data lookups — they come last.

Want me to write the Phase 1 modules next?

