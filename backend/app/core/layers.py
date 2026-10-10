"""
app/core/layers.py — All 5 layers, pure logic
==============================================

Layer 1 — Abbreviation resolution   (JST -> Asia/Tokyo)
Layer 2 — Place name lookup         (Paris -> Europe/Paris)
Layer 2b — Coordinate lookup        (48.85,2.35 -> Europe/Paris)
Layer 3 — IANA zone validation      (is "America/New_York" real?)
Layer 4 — Offset + DST computation  (what time is it in that zone?)
Layer 5 — Alias canonicalization    (Asia/Calcutta -> Asia/Kolkata)

All data is loaded ONCE via load_all_data() at server startup.
No network calls. No per-request file reads.
"""

import json
import zoneinfo
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

UTC = timezone.utc

# ---------------------------------------------------------------------------
# Module-level state, populated by load_all_data()
# ---------------------------------------------------------------------------
_ALIASES: dict = {}
_PLACES: dict | None = None
_ABBREV_MAP: dict = {}
_TF = None  # timezonefinder instance


# ===========================================================================
# LAYER 5 — Alias resolution
# ===========================================================================

def load_aliases(path: str) -> int:
    """Load aliases.json into memory. Returns count."""
    global _ALIASES
    with open(path, encoding="utf-8") as f:
        _ALIASES = json.load(f)
    return len(_ALIASES)


def canonicalize(zone_name: str) -> str:
    """Return the canonical IANA name for any zone string. Idempotent."""
    if not zone_name:
        return zone_name
    return _ALIASES.get(zone_name, zone_name)


# ===========================================================================
# LAYER 3 — IANA validation
# ===========================================================================

def is_valid_zone(name: str) -> bool:
    """True if `name` resolves to a loadable zone on this machine."""
    if not isinstance(name, str) or not name:
        return False
    try:
        zoneinfo.ZoneInfo(name)
        return True
    except (zoneinfo.ZoneInfoNotFoundError, ValueError, OSError):
        return False


# ===========================================================================
# LAYER 4 — Offset + DST computation
# ===========================================================================

def fmt_offset(delta: timedelta | None) -> str:
    """Format a timedelta as +HH:MM or -HH:MM."""
    if delta is None:
        return "n/a"
    total = int(round(delta.total_seconds()))
    sign = "+" if total >= 0 else "-"
    total = abs(total)
    hh, rem = divmod(total, 3600)
    mm, ss = divmod(rem, 60)
    if ss:
        return f"{sign}{hh:02d}:{mm:02d}:{ss:02d}"
    return f"{sign}{hh:02d}:{mm:02d}"


def snapshot(zone_name: str, moment: datetime | None = None) -> dict:
    """
    Everything Layer 4 knows about one zone at one instant.

    Returns a dict with keys: zone, local, utc, abbrev, offset, offset_str,
    std_offset, std_offset_str, dst_delta, dst_active.
    """
    tz = zoneinfo.ZoneInfo(zone_name)
    if moment is None:
        moment = datetime.now(UTC)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=UTC)

    instant_utc = moment.astimezone(UTC)
    local = instant_utc.astimezone(tz)

    offset = local.utcoffset()
    dst_delta = local.dst() or timedelta(0)
    std_offset = offset - dst_delta

    return {
        "zone": zone_name,
        "local": local,
        "utc": instant_utc,
        "abbrev": local.tzname(),
        "offset": offset,
        "offset_str": fmt_offset(offset),
        "std_offset": std_offset,
        "std_offset_str": fmt_offset(std_offset),
        "dst_delta": dst_delta,
        "dst_active": dst_delta != timedelta(0),
    }


def convert_time(local_str: str, from_zone: str, to_zone: str) -> dict:
    """Convert a naive local time string from one zone to another."""
    naive = datetime.fromisoformat(local_str)
    src = zoneinfo.ZoneInfo(canonicalize(from_zone))
    dst = zoneinfo.ZoneInfo(canonicalize(to_zone))
    aware = naive.replace(tzinfo=src)
    converted = aware.astimezone(dst)
    return {
        "source_local": aware,
        "source_offset": aware.utcoffset(),
        "source_abbrev": aware.tzname(),
        "source_utc": aware.astimezone(UTC),
        "target_local": converted,
        "target_offset": converted.utcoffset(),
        "target_abbrev": converted.tzname(),
    }


# ===========================================================================
# LAYER 2 — Place name lookup (GeoNames)
# ===========================================================================

def load_places(path: str) -> int:
    """Load GeoNames TSV into memory. Returns unique key count."""
    global _PLACES
    if _PLACES is not None:
        return len(_PLACES)

    index = defaultdict(list)
    with open(path, encoding="utf-8") as f:
        for line in f:
            fields = line.rstrip("\n").split("\t")
            if len(fields) < 18:
                continue
            try:
                place = {
                    "name": fields[1],
                    "ascii_name": fields[2],
                    "lat": float(fields[4]),
                    "lon": float(fields[5]),
                    "country": fields[8],
                    "population": int(fields[14]) if fields[14] else 0,
                    "zone": fields[17] or None,
                }
            except (ValueError, IndexError):
                continue

            keys = {place["name"].lower(), place["ascii_name"].lower()}
            for alt in (fields[3] or "").split(","):
                alt = alt.strip().lower()
                if alt:
                    keys.add(alt)
            for key in keys:
                index[key].append(place)

    _PLACES = index
    return len(_PLACES)


def lookup_place(name: str) -> list:
    """Return matches sorted by population descending."""
    if not _PLACES:
        return []
    matches = _PLACES.get(name.lower(), [])
    return sorted(matches, key=lambda p: p["population"], reverse=True)


def top_zone(name: str) -> str | None:
    """Return the IANA zone for the most populous match."""
    results = lookup_place(name)
    return results[0]["zone"] if results else None


# ===========================================================================
# LAYER 2b — Coordinate lookup (timezonefinder)
# ===========================================================================

def load_timezonefinder():
    """Instantiate timezonefinder lazily. Returns True on success."""
    global _TF
    if _TF is not None:
        return True
    try:
        from timezonefinder import TimezoneFinder
        _TF = TimezoneFinder()
        return True
    except ImportError:
        return False


def zone_from_coords(lat: float, lon: float) -> str | None:
    """Return IANA zone for a coordinate, or None."""
    if _TF is None:
        return None
    try:
        return _TF.timezone_at(lat=lat, lng=lon)
    except Exception:
        return None


# ===========================================================================
# LAYER 1 — Abbreviation resolution
# ===========================================================================

def build_abbrev_map() -> int:
    """Build the abbreviation -> canonical zones map. Returns count."""
    global _ABBREV_MAP
    now_utc = datetime.now(UTC)
    raw = defaultdict(set)
    for zone_name in zoneinfo.available_timezones():
        try:
            tz = zoneinfo.ZoneInfo(zone_name)
            local = now_utc.astimezone(tz)
            abbrev = local.tzname()
            if abbrev and abbrev.isalpha() and abbrev.isupper():
                raw[abbrev].add(canonicalize(zone_name))
        except Exception:
            continue
    _ABBREV_MAP = {abbr: sorted(zones) for abbr, zones in raw.items()}
    return len(_ABBREV_MAP)


def resolve_abbreviation(abbr: str) -> tuple[str, list[str]]:
    """Return (status, zones). status is unique | ambiguous | unknown."""
    a = abbr.strip().upper()
    zones = _ABBREV_MAP.get(a, [])
    if not zones:
        return "unknown", []
    if len(zones) == 1:
        return "unique", zones
    return "ambiguous", zones


# ===========================================================================
# THE PIPELINE — one entry point that tries every layer in order
# ===========================================================================

def resolve_user_input(query: str) -> dict:
    """
    Given anything the user typed, return a resolution dict.

    Resolution order:
      1. Abbreviation   (JST, IST)         -> Layer 1
      2. Coordinate     ("48.85,2.35")     -> Layer 2b
      3. Place name     (Paris, New York)  -> Layer 2
      4. Raw IANA zone  (America/New_York) -> Layer 3 + Layer 5

    Returns:
        {"status": "unique" | "ambiguous" | "unknown",
         "zone": str | None,
         "candidates": list[str],
         "source": str}
    """
    q = query.strip()
    if not q:
        return {"status": "unknown", "zone": None, "candidates": [], "source": "none"}

    # 1. Abbreviation
    status, zones = resolve_abbreviation(q)
    if status == "unique":
        return {"status": "unique", "zone": zones[0],
                "candidates": zones, "source": "abbreviation"}
    if status == "ambiguous":
        return {"status": "ambiguous", "zone": None,
                "candidates": zones, "source": "abbreviation"}

    # 2. Coordinate ("lat,lon")
    if "," in q:
        try:
            lat_s, lon_s = q.split(",", 1)
            lat, lon = float(lat_s.strip()), float(lon_s.strip())
            zone = zone_from_coords(lat, lon)
            if zone:
                canon = canonicalize(zone)
                return {"status": "unique", "zone": canon,
                        "candidates": [canon], "source": "coordinate"}
        except ValueError:
            pass

    # 3. Place name
    zone = top_zone(q)
    if zone:
        canon = canonicalize(zone)
        return {"status": "unique", "zone": canon,
                "candidates": [canon], "source": "place"}

    # 4. Raw IANA zone
    if is_valid_zone(q):
        canon = canonicalize(q)
        return {"status": "unique", "zone": canon,
                "candidates": [canon], "source": "zone"}

    return {"status": "unknown", "zone": None, "candidates": [], "source": "none"}


# ===========================================================================
# STARTUP — load everything once
# ===========================================================================

def load_all_data(data_dir: str) -> dict:
    """
    Load all data needed by the layers. Called once at app startup.

    Returns a summary dict.
    """
    base = Path(data_dir)

    # Layer 5
    aliases_path = base / "aliases.json"
    alias_count = load_aliases(str(aliases_path)) if aliases_path.exists() else 0

    # Layer 1 (depends on aliases being loaded first)
    abbrev_count = build_abbrev_map()

    # Layer 2
    places_path = base / "geonames" / "cities15000.txt"
    place_count = load_places(str(places_path)) if places_path.exists() else 0

    # Layer 2b
    tf_ok = load_timezonefinder()

    return {
        "aliases": alias_count,
        "abbreviations": abbrev_count,
        "place_keys": place_count,
        "timezonefinder": tf_ok,
    }