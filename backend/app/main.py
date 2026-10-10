"""
app/main.py — FastAPI application
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core import layers
from app.schemas import (
    ResolveRequest, ResolveResponse, ZoneCandidate,
    ConvertRequest, ConvertResponse,
    WorldClockRequest, WorldClockResponse,
    HealthResponse,
)

# Path to the data directory, relative to this file
DATA_DIR = Path(__file__).parent.parent / "data"

# Store startup summary for /health
_STARTUP_INFO: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all data ONCE at startup. Free resources at shutdown."""
    print("Loading data...")
    _STARTUP_INFO.update(layers.load_all_data(str(DATA_DIR)))
    print(f"Startup complete: {_STARTUP_INFO}")
    yield
    print("Shutting down.")


app = FastAPI(
    title="World Clock API",
    version="1.0.0",
    description="Timezone resolution and conversion API",
    lifespan=lifespan,
)

# CORS — allow your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production domain here later:
        # "https://yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _candidate(zone: str) -> ZoneCandidate:
    """Build a ZoneCandidate from a zone name."""
    s = layers.snapshot(zone)
    return ZoneCandidate(
        zone=zone,
        local_time=s["local"].isoformat(),
        offset=s["offset_str"],
        abbrev=s["abbrev"],
        dst_active=s["dst_active"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
def health():
    """Health check + what got loaded at startup."""
    return HealthResponse(status="ok", data=_STARTUP_INFO)


@app.post("/resolve", response_model=ResolveResponse)
def resolve(req: ResolveRequest):
    """
    Resolve any user input (abbreviation, place, coordinate, IANA zone)
    into IANA zone candidate(s).
    """
    result = layers.resolve_user_input(req.query)
    candidates = [_candidate(z) for z in result["candidates"]]
    return ResolveResponse(
        status=result["status"],
        zone=result["zone"],
        candidates=candidates,
        source=result["source"],
    )


@app.post("/convert", response_model=ConvertResponse)
def convert(req: ConvertRequest):
    """Convert a naive local time from one zone to another."""
    try:
        r = layers.convert_time(req.when, req.from_zone, req.to_zone)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ConvertResponse(
        source_local=r["source_local"].isoformat(),
        source_offset=layers.fmt_offset(r["source_offset"]),
        source_abbrev=r["source_abbrev"],
        source_utc=r["source_utc"].isoformat(),
        target_local=r["target_local"].isoformat(),
        target_offset=layers.fmt_offset(r["target_offset"]),
        target_abbrev=r["target_abbrev"],
    )


@app.post("/world-clock", response_model=WorldClockResponse)
def world_clock(req: WorldClockRequest):
    """Get current snapshots for a list of zones."""
    clocks = []
    for zone in req.zones:
        canon = layers.canonicalize(zone)
        if not layers.is_valid_zone(canon):
            raise HTTPException(status_code=400, detail=f"Invalid zone: {zone}")
        clocks.append(_candidate(canon))
    return WorldClockResponse(clocks=clocks)