#!/usr/bin/env python3
"""
test_scripts/test_api.py
========================
Smoke test for the World Clock FastAPI backend.

Usage:
    python test_scripts/test_api.py
    python test_scripts/test_api.py --url http://localhost:8000
    python test_scripts/test_api.py --url https://yourdomain.com

Requires: pip install requests
"""

import argparse
import json
import sys
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("ERROR: 'requests' is not installed.")
    print("Install it with: pip install requests")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Test runner — tracks pass/fail
# ---------------------------------------------------------------------------

class TestRunner:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.passed = 0
        self.failed = 0
        self.errors = []

    def check(self, name: str, condition: bool, detail: str = ""):
        if condition:
            self.passed += 1
            print(f"  [PASS] {name}")
        else:
            self.failed += 1
            print(f"  [FAIL] {name}")
            if detail:
                print(f"         {detail}")
            self.errors.append(name)

    def section(self, title: str):
        print(f"\n{'=' * 70}")
        print(title)
        print("=" * 70)

    def summary(self):
        print(f"\n{'=' * 70}")
        print(f"SUMMARY: {self.passed} passed, {self.failed} failed")
        print("=" * 70)
        if self.errors:
            print("\nFailed tests:")
            for e in self.errors:
                print(f"  - {e}")
            return 1
        return 0


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def post(runner: TestRunner, path: str, payload: dict) -> dict | None:
    """POST JSON, return parsed response or None on error."""
    url = f"{runner.base_url}{path}"
    try:
        r = requests.post(url, json=payload, timeout=10)
    except requests.ConnectionError:
        print(f"  [ERROR] Cannot connect to {url}")
        print(f"          Is the server running? Try: uvicorn app.main:app --reload")
        sys.exit(2)
    except requests.Timeout:
        print(f"  [ERROR] Timeout on {url}")
        return None

    if r.status_code != 200:
        print(f"  [HTTP {r.status_code}] {url}")
        try:
            print(f"         {r.json()}")
        except Exception:
            print(f"         {r.text[:200]}")
        return None

    return r.json()


def get(runner: TestRunner, path: str) -> dict | None:
    url = f"{runner.base_url}{path}"
    try:
        r = requests.get(url, timeout=10)
    except requests.ConnectionError:
        print(f"  [ERROR] Cannot connect to {url}")
        sys.exit(2)

    if r.status_code != 200:
        print(f"  [HTTP {r.status_code}] {url}")
        return None
    return r.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_health(runner: TestRunner):
    runner.section("1. GET /health")
    data = get(runner, "/health")
    if data is None:
        runner.check("health returns 200", False)
        return

    runner.check("status == 'ok'", data.get("status") == "ok",
                 f"got: {data.get('status')!r}")

    info = data.get("data", {})
    print(f"  Startup info: {json.dumps(info, indent=2)}")

    runner.check("aliases loaded (> 0)", info.get("aliases", 0) > 0,
                 f"got: {info.get('aliases')}")
    runner.check("abbreviations loaded (> 0)", info.get("abbreviations", 0) > 0,
                 f"got: {info.get('abbreviations')}")
    runner.check("place_keys loaded (> 0)", info.get("place_keys", 0) > 0,
                 f"got: {info.get('place_keys')}")


def test_resolve_abbreviation(runner: TestRunner):
    runner.section("2. POST /resolve — abbreviations")

    # Unique abbreviation
    data = post(runner, "/resolve", {"query": "JST"})
    if data:
        runner.check("JST -> status unique", data.get("status") == "unique",
                     f"got: {data.get('status')}")
        runner.check("JST -> zone Asia/Tokyo", data.get("zone") == "Asia/Tokyo",
                     f"got: {data.get('zone')}")
        runner.check("JST -> source abbreviation",
                     data.get("source") == "abbreviation")
        if data.get("candidates"):
            c = data["candidates"][0]
            runner.check("JST candidate has offset", bool(c.get("offset")),
                         f"got: {c.get('offset')!r}")
            runner.check("JST candidate has abbrev", bool(c.get("abbrev")))

    # Ambiguous abbreviation
    data = post(runner, "/resolve", {"query": "IST"})
    if data:
        runner.check("IST -> status ambiguous",
                     data.get("status") == "ambiguous",
                     f"got: {data.get('status')}")
        runner.check("IST -> candidates >= 2",
                     len(data.get("candidates", [])) >= 2,
                     f"got: {len(data.get('candidates', []))}")
        zones = [c["zone"] for c in data.get("candidates", [])]
        runner.check("IST includes Asia/Kolkata", "Asia/Kolkata" in zones,
                     f"got: {zones}")
        runner.check("IST includes Europe/Dublin", "Europe/Dublin" in zones,
                     f"got: {zones}")

    # Unknown
    data = post(runner, "/resolve", {"query": "XYZ999"})
    if data:
        runner.check("XYZ999 -> status unknown",
                     data.get("status") == "unknown",
                     f"got: {data.get('status')}")

    # Case-insensitive
    data = post(runner, "/resolve", {"query": "jst"})
    if data:
        runner.check("lowercase 'jst' resolves", data.get("zone") == "Asia/Tokyo")


def test_resolve_place(runner: TestRunner):
    runner.section("3. POST /resolve — place names")

    cases = [
        ("Paris", "Europe/Paris"),
        ("Tokyo", "Asia/Tokyo"),
        ("New York", "America/New_York"),
        ("Mumbai", "Asia/Kolkata"),
    ]

    for query, expected in cases:
        data = post(runner, "/resolve", {"query": query})
        if data:
            runner.check(f"{query!r} -> {expected}",
                         data.get("zone") == expected,
                         f"got: {data.get('zone')}")
            runner.check(f"{query!r} -> source place",
                         data.get("source") == "place",
                         f"got: {data.get('source')}")


def test_resolve_zone_and_alias(runner: TestRunner):
    runner.section("4. POST /resolve — raw zones and aliases")

    # Canonical zone
    data = post(runner, "/resolve", {"query": "America/New_York"})
    if data:
        runner.check("America/New_York resolves to itself",
                     data.get("zone") == "America/New_York",
                     f"got: {data.get('zone')}")
        runner.check("source == 'zone'", data.get("source") == "zone",
                     f"got: {data.get('source')}")

    # Deprecated alias
    data = post(runner, "/resolve", {"query": "Asia/Calcutta"})
    if data:
        runner.check("Asia/Calcutta -> Asia/Kolkata",
                     data.get("zone") == "Asia/Kolkata",
                     f"got: {data.get('zone')}")

    # Backward link
    data = post(runner, "/resolve", {"query": "US/Eastern"})
    if data:
        runner.check("US/Eastern -> America/New_York",
                     data.get("zone") == "America/New_York",
                     f"got: {data.get('zone')}")

    # Rare alias
    data = post(runner, "/resolve", {"query": "Europe/Kiev"})
    if data:
        runner.check("Europe/Kiev -> Europe/Kyiv",
                     data.get("zone") == "Europe/Kyiv",
                     f"got: {data.get('zone')}")


def test_resolve_coordinate(runner: TestRunner):
    runner.section("5. POST /resolve — coordinates")

    # Paris
    data = post(runner, "/resolve", {"query": "48.85,2.35"})
    if data:
        runner.check("48.85,2.35 -> Europe/Paris",
                     data.get("zone") == "Europe/Paris",
                     f"got: {data.get('zone')}")
        runner.check("source == 'coordinate'",
                     data.get("source") == "coordinate",
                     f"got: {data.get('source')}")

    # Mumbai
    data = post(runner, "/resolve", {"query": "19.076,72.8777"})
    if data:
        runner.check("19.076,72.8777 -> Asia/Kolkata",
                     data.get("zone") == "Asia/Kolkata",
                     f"got: {data.get('zone')}")


def test_convert(runner: TestRunner):
    runner.section("6. POST /convert")

    # NY -> Tokyo (March 2026, US on EDT)
    data = post(runner, "/convert", {
        "when": "2026-03-21 09:00",
        "from_zone": "America/New_York",
        "to_zone": "Asia/Tokyo",
    })
    if data:
        # 09:00 EDT = 13:00 UTC = 22:00 JST
        runner.check("NY 09:00 -> Tokyo 22:00",
                     "T22:00" in data.get("target_local", ""),
                     f"got: {data.get('target_local')}")
        runner.check("source offset is -04:00",
                     data.get("source_offset") == "-04:00",
                     f"got: {data.get('source_offset')}")
        runner.check("target offset is +09:00",
                     data.get("target_offset") == "+09:00",
                     f"got: {data.get('target_offset')}")
        runner.check("source abbrev EDT",
                     data.get("source_abbrev") == "EDT",
                     f"got: {data.get('source_abbrev')}")
        runner.check("target abbrev JST",
                     data.get("target_abbrev") == "JST",
                     f"got: {data.get('target_abbrev')}")

    # Half-hour offset
    data = post(runner, "/convert", {
        "when": "2026-06-15 12:00",
        "from_zone": "Europe/Paris",
        "to_zone": "Asia/Kolkata",
    })
    if data:
        # 12:00 CEST (+02:00) = 10:00 UTC = 15:30 IST (+05:30)
        runner.check("Paris 12:00 -> Kolkata 15:30",
                     "T15:30" in data.get("target_local", ""),
                     f"got: {data.get('target_local')}")
        runner.check("target offset is +05:30",
                     data.get("target_offset") == "+05:30",
                     f"got: {data.get('target_offset')}")

    # Historical
    data = post(runner, "/convert", {
        "when": "1950-06-15 12:00",
        "from_zone": "America/Chicago",
        "to_zone": "Europe/Paris",
    })
    if data:
        # 1950-06-15: Chicago on CDT (-05:00), Paris on CET (+01:00) — no DST then
        # 12:00 CDT = 17:00 UTC = 18:00 CET
        runner.check("1950 Chicago 12:00 -> Paris 18:00",
                     "T18:00" in data.get("target_local", ""),
                     f"got: {data.get('target_local')}")
        runner.check("1950 source offset -05:00",
                     data.get("source_offset") == "-05:00",
                     f"got: {data.get('source_offset')}")
        runner.check("1950 target offset +01:00",
                     data.get("target_offset") == "+01:00",
                     f"got: {data.get('target_offset')}")


def test_world_clock(runner: TestRunner):
    runner.section("7. POST /world-clock")

    data = post(runner, "/world-clock", {
        "zones": ["Asia/Kolkata", "Europe/London", "America/New_York"]
    })
    if data:
        clocks = data.get("clocks", [])
        runner.check("3 clocks returned", len(clocks) == 3,
                     f"got: {len(clocks)}")

        by_zone = {c["zone"]: c for c in clocks}

        runner.check("Kolkata present", "Asia/Kolkata" in by_zone)
        runner.check("London present", "Europe/London" in by_zone)
        runner.check("New York present", "America/New_York" in by_zone)

        if "Asia/Kolkata" in by_zone:
            runner.check("Kolkata offset +05:30",
                         by_zone["Asia/Kolkata"]["offset"] == "+05:30",
                         f"got: {by_zone['Asia/Kolkata']['offset']}")

        print("\n  Clock snapshots:")
        for c in clocks:
            print(f"    {c['zone']:<22} {c['local_time']:<32} "
                  f"{c['offset']}  {c['abbrev']:<5}  "
                  f"DST={'yes' if c['dst_active'] else 'no'}")

    # Aliases in the list should also work
    data = post(runner, "/world-clock", {
        "zones": ["Asia/Calcutta", "US/Eastern"]
    })
    if data:
        zones = [c["zone"] for c in data.get("clocks", [])]
        runner.check("Asia/Calcutta canonicalized to Asia/Kolkata",
                     "Asia/Kolkata" in zones, f"got: {zones}")
        runner.check("US/Eastern canonicalized to America/New_York",
                     "America/New_York" in zones, f"got: {zones}")

    # Invalid zone should 400
    try:
        r = requests.post(f"{runner.base_url}/world-clock",
                          json={"zones": ["Not/AZone"]}, timeout=10)
        runner.check("invalid zone -> HTTP 400", r.status_code == 400,
                     f"got: HTTP {r.status_code}")
    except Exception as e:
        runner.check("invalid zone -> HTTP 400", False, str(e))


def test_error_handling(runner: TestRunner):
    runner.section("8. Error handling")

    # Empty query should 422 (Pydantic validation)
    try:
        r = requests.post(f"{runner.base_url}/resolve",
                          json={"query": ""}, timeout=10)
        runner.check("empty query -> HTTP 422", r.status_code == 422,
                     f"got: HTTP {r.status_code}")
    except Exception as e:
        runner.check("empty query -> HTTP 422", False, str(e))

    # Missing field
    try:
        r = requests.post(f"{runner.base_url}/resolve",
                          json={}, timeout=10)
        runner.check("missing 'query' field -> HTTP 422", r.status_code == 422,
                     f"got: HTTP {r.status_code}")
    except Exception as e:
        runner.check("missing 'query' field -> HTTP 422", False, str(e))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Test the World Clock API")
    parser.add_argument("--url", default="http://localhost:8000",
                        help="Base URL of the API (default: http://localhost:8000)")
    args = parser.parse_args()

    print(f"Testing API at: {args.url}")
    print(f"Started at: {datetime.now().isoformat(timespec='seconds')}")

    # Quick connectivity check
    try:
        requests.get(f"{args.url}/health", timeout=5)
    except requests.ConnectionError:
        print(f"\nERROR: Cannot connect to {args.url}")
        print("Start the server first:")
        print("  cd backend")
        print("  uvicorn app.main:app --reload")
        sys.exit(2)

    runner = TestRunner(args.url)

    t0 = time.time()
    test_health(runner)
    test_resolve_abbreviation(runner)
    test_resolve_place(runner)
    test_resolve_zone_and_alias(runner)
    test_resolve_coordinate(runner)
    test_convert(runner)
    test_world_clock(runner)
    test_error_handling(runner)
    elapsed = time.time() - t0

    print(f"\nCompleted in {elapsed:.2f}s")
    return runner.summary()


if __name__ == "__main__":
    sys.exit(main())