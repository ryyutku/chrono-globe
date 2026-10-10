"""
app/schemas.py — Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field


class ResolveRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200,
                       description="City, abbreviation, IANA zone, or 'lat,lon'")


class ZoneCandidate(BaseModel):
    zone: str
    local_time: str
    offset: str
    abbrev: str
    dst_active: bool


class ResolveResponse(BaseModel):
    status: str                 # unique | ambiguous | unknown
    zone: str | None = None
    candidates: list[ZoneCandidate] = []
    source: str                 # abbreviation | place | coordinate | zone | none


class ConvertRequest(BaseModel):
    when: str = Field(..., description="Naive local time, e.g. '2026-03-21 09:00'")
    from_zone: str
    to_zone: str


class ConvertResponse(BaseModel):
    source_local: str
    source_offset: str
    source_abbrev: str
    source_utc: str
    target_local: str
    target_offset: str
    target_abbrev: str


class WorldClockRequest(BaseModel):
    zones: list[str] = Field(..., min_length=1, max_length=50)


class WorldClockResponse(BaseModel):
    clocks: list[ZoneCandidate]


class HealthResponse(BaseModel):
    status: str
    data: dict