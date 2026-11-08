# backend/app/core/layers.py
"""
app/core/layers.py — All 5 layers, pure logic
==============================================

Layer 1 — Abbreviation resolution   (JST -> Asia/Tokyo)
Layer 2 — Place / Country lookup    (Paris -> Europe/Paris, Sri Lanka -> Asia/Colombo)
Layer 2b — Coordinate lookup        (48.85,2.35 -> Europe/Paris)
Layer 3 — IANA zone validation      (is "America/New_York" real?)
Layer 4 — Offset + DST computation  (what time is it in that zone?)
Layer 5 — Alias canonicalization    (Asia/Calcutta -> Asia/Kolkata)
"""

import json
import zoneinfo
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

UTC = timezone.utc

from app.core.territories import ALL_TERRITORIES

# Build dynamic IANA suffix lookup so every island name automatically resolves
_ZONE_SUFFIX_MAP: dict[str, str] = {}
for _z in zoneinfo.available_timezones():
    _tail = _z.split("/")[-1].replace("_", " ").lower()
    _ZONE_SUFFIX_MAP[_tail] = _z

# ---------------------------------------------------------------------------
# Module-level state, populated by load_all_data()
# ---------------------------------------------------------------------------
_ALIASES: dict = {}
_PLACES: dict | None = None
_COUNTRY_ZONES: dict = defaultdict(set)  # ISO code -> set of IANA zones
_ABBREV_MAP: dict = {}
_TF = None

# Comprehensive Country Name / Alias -> ISO 3166-1 alpha-2 mapping
_COUNTRY_NAMES: dict[str, str] = {
    "nepal": "NP",
    "sri lanka": "LK",
    "india": "IN",
    "japan": "JP",
    "united kingdom": "GB",
    "uk": "GB",
    "great britain": "GB",
    "england": "GB",
    "germany": "DE",
    "france": "FR",
    "italy": "IT",
    "spain": "ES",
    "china": "CN",
    "singapore": "SG",
    "thailand": "TH",
    "vietnam": "VN",
    "indonesia": "ID",
    "malaysia": "MY",
    "philippines": "PH",
    "south korea": "KR",
    "korea": "KR",
    "pakistan": "PK",
    "bangladesh": "BD",
    "united states": "US",
    "usa": "US",
    "us": "US",
    "america": "US",
    "canada": "CA",
    "australia": "AU",
    "new zealand": "NZ",
    "brazil": "BR",
    "mexico": "MX",
    "argentina": "AR",
    "chile": "CL",
    "colombia": "CO",
    "south africa": "ZA",
    "egypt": "EG",
    "nigeria": "NG",
    "kenya": "KE",
    "russia": "RU",
    "turkey": "TR",
    "saudi arabia": "SA",
    "united arab emirates": "AE",
    "uae": "AE",
    "dubai": "AE",
    "netherlands": "NL",
    "belgium": "BE",
    "switzerland": "CH",
    "sweden": "SE",
    "norway": "NO",
    "finland": "FI",
    "denmark": "DK",
    "ireland": "IE",
    "poland": "PL",
    "portugal": "PT",
    "greece": "GR",
    "austria": "AT",
}


# ===========================================================================
# LAYER 5 — Alias resolution
# ===========================================================================

def load_aliases(path: str) -> int:
    global _ALIASES
    with open(path, encoding="utf-8") as f:
        _ALIASES = json.load(f)
    return len(_ALIASES)


def canonicalize(zone_name: str) -> str:
    if not zone_name:
        return zone_name
    return _ALIASES.get(zone_name, zone_name)


# ===========================================================================
# LAYER 3 — IANA validation
# ===========================================================================

def is_valid_zone(name: str) -> bool:
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
# LAYER 2 — Place & Country lookup (GeoNames)
# ===========================================================================

def load_places(path: str) -> int:
    global _PLACES, _COUNTRY_ZONES
    if _PLACES is not None:
        return len(_PLACES)

    index = defaultdict(list)
    country_zones = defaultdict(set)

    with open(path, encoding="utf-8") as f:
        for line in f:
            fields = line.rstrip("\n").split("\t")
            if len(fields) < 18:
                continue
            try:
                country_code = fields[8].upper()
                zone = fields[17] or None

                if country_code and zone:
                    country_zones[country_code].add(canonicalize(zone))

                place = {
                    "name": fields[1],
                    "ascii_name": fields[2],
                    "lat": float(fields[4]),
                    "lon": float(fields[5]),
                    "country": country_code,
                    "population": int(fields[14]) if fields[14] else 0,
                    "zone": zone,
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
    _COUNTRY_ZONES = country_zones
    return len(_PLACES)


def lookup_place(name: str) -> list:
    if not _PLACES:
        return []
    matches = _PLACES.get(name.lower(), [])
    return sorted(matches, key=lambda p: p["population"], reverse=True)


def lookup_country(name: str) -> list[str]:
    """Look up any sovereign country, dependency, or island."""
    clean = name.strip().lower()

    # 1. Check territory dictionary
    if clean in ALL_TERRITORIES:
        return ALL_TERRITORIES[clean]

    # 2. Check if query matches the tail of any IANA zone (e.g. "niue" -> "Pacific/Niue")
    if clean in _ZONE_SUFFIX_MAP:
        return [_ZONE_SUFFIX_MAP[clean]]

    return []


def top_zone(name: str) -> str | None:
    results = lookup_place(name)
    return results[0]["zone"] if results else None


# ===========================================================================
# LAYER 2b — Coordinate lookup (timezonefinder)
# ===========================================================================

def load_timezonefinder():
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
    a = abbr.strip().upper()
    zones = _ABBREV_MAP.get(a, [])
    if not zones:
        return "unknown", []
    if len(zones) == 1:
        return "unique", zones
    return "ambiguous", zones


# ===========================================================================
# THE PIPELINE
# ===========================================================================

def resolve_user_input(query: str) -> dict:
    q = query.strip()
    if not q:
        return {"status": "unknown", "zone": None, "candidates": [], "source": "none"}

    # 1. Abbreviation (JST, IST)
    status, zones = resolve_abbreviation(q)
    if status == "unique":
        return {"status": "unique", "zone": zones[0],
                "candidates": zones, "source": "abbreviation"}
    if status == "ambiguous":
        return {"status": "ambiguous", "zone": None,
                "candidates": zones, "source": "abbreviation"}

    # 2. Coordinate ("48.85,2.35")
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

    # 3. Country / Island / Territory (Nepal, Tuvalu, Niue, Sri Lanka, Tokelau, Pitcairn)
    country_zones = lookup_country(q)
    if country_zones:
        canon_zones = [canonicalize(z) for z in country_zones]
        if len(canon_zones) == 1:
            return {"status": "unique", "zone": canon_zones[0],
                    "candidates": canon_zones, "source": "country"}
        return {"status": "ambiguous", "zone": canon_zones[0],
                "candidates": canon_zones, "source": "country"}

    # 4. Place name from GeoNames (Colombo, Kathmandu, Paris, etc.)
    zone = top_zone(q)
    if zone:
        canon = canonicalize(zone)
        return {"status": "unique", "zone": canon,
                "candidates": [canon], "source": "place"}

    # 5. Raw IANA zone (Asia/Kathmandu, America/New_York)
    if is_valid_zone(q):
        canon = canonicalize(q)
        return {"status": "unique", "zone": canon,
                "candidates": [canon], "source": "zone"}

    return {"status": "unknown", "zone": None, "candidates": [], "source": "none"}


# ===========================================================================
# STARTUP
# ===========================================================================

def load_all_data(data_dir: str) -> dict:
    base = Path(data_dir)

    aliases_path = base / "aliases.json"
    alias_count = load_aliases(str(aliases_path)) if aliases_path.exists() else 0

    abbrev_count = build_abbrev_map()

    places_path = base / "geonames" / "cities15000.txt"
    place_count = load_places(str(places_path)) if places_path.exists() else 0

    tf_ok = load_timezonefinder()

    return {
        "aliases": alias_count,
        "abbreviations": abbrev_count,
        "place_keys": place_count,
        "timezonefinder": tf_ok,
    }