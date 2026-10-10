"""
build_aliases.py — Layer 5 build step
======================================
Parses the IANA tz database link definitions and produces data/aliases.json.

Run once:
    python build_aliases.py

Re-run quarterly when the tzdata PyPI package updates.
"""

import json
import re
from pathlib import Path

OUTPUT_FILE = Path(__file__).parent / "data" / "aliases.json"


def parse_tzdata_zi(path: Path) -> dict:
    """Parse 'L Target Alias' lines from tzdata.zi."""
    aliases = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) >= 3 and parts[0] == "L":
                target, alias = parts[1], parts[2]
                aliases[alias] = target
    return aliases


def try_pypi_tzdata() -> dict | None:
    """Load tzdata.zi from the installed PyPI tzdata package."""
    try:
        import tzdata
        base = Path(tzdata.__file__).parent / "zoneinfo"
        zi = base / "tzdata.zi"
        if zi.exists():
            print(f"  found {zi}")
            return parse_tzdata_zi(zi)
    except ImportError:
        pass
    return None


def build() -> dict:
    print("Building alias map...")
    aliases = try_pypi_tzdata()
    if aliases is None:
        raise RuntimeError(
            "Could not find tzdata.zi. Install the 'tzdata' PyPI package: "
            "pip install tzdata"
        )

    # Remove self-references
    cleaned = {a: t for a, t in aliases.items() if a != t}

    # Flatten chains (A -> B -> C becomes A -> C)
    def resolve(name, seen=None):
        if seen is None:
            seen = set()
        if name in seen:
            return name
        seen.add(name)
        if name in cleaned:
            return resolve(cleaned[name], seen)
        return name

    flattened = {alias: resolve(alias) for alias in cleaned}
    print(f"  total aliases: {len(flattened)}")
    return flattened


def main():
    aliases = build()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(aliases, f, indent=2, sort_keys=True)
    print(f"Wrote {OUTPUT_FILE} ({len(aliases)} entries)")

    for name in ["Asia/Calcutta", "US/Eastern", "Japan", "Eire", "GB"]:
        if name in aliases:
            print(f"  {name} -> {aliases[name]}")


if __name__ == "__main__":
    main()