# backend/app/core/data.py
import json
from pathlib import Path
from collections import defaultdict

_places = None
_aliases = None
_abbrev_map = None

def load_places(path: str):
    """Load GeoNames TSV into memory. Call once at startup."""
    global _places
    if _places is not None:
        return _places
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
    _places = index
    return _places