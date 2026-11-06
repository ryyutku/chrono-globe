"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { getCountry, getAllTimezones } from "countries-and-timezones";
import { GlassCard } from "../ui/GlassCard";
import LiveClock from "./LiveClock";
import "./GlobeView.css";

// The globe only works in the browser, so it is loaded client-side only
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Pin = { id: string; lat: number; lng: number; tz: string };
type Selected = { name: string; tzs: string[] };

// Some countries (like France) have a bad code in the data file, so pick the better one
function codeOf(p: any): string {
    return p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ISO_A2;
}

// Rough center of a country: average of the points of its biggest piece
function center(geometry: any) {
    const polys =
        geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    let best = polys[0];
    for (const p of polys) if (p[0].length > best[0].length) best = p;
    const ring = best[0];
    let lat = 0;
    let lng = 0;
    for (const [x, y] of ring) {
        lng += x;
        lat += y;
    }
    return { lat: lat / ring.length, lng: lng / ring.length };
}

export default function GlobeView() {
    const [countries, setCountries] = useState<any[]>([]);
    // LATER: replace this pins state with the Zustand store (src/lib/store.ts)
    const [pins, setPins] = useState<Pin[]>([]);
    const [selected, setSelected] = useState<Selected | null>(null);
    const [hovered, setHovered] = useState<any>(null);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [chosenZone, setChosenZone] = useState("");

    const allZones = useMemo(() => Object.keys(getAllTimezones()).sort(), []);

    // Load country shapes
    useEffect(() => {
        fetch("/countries.geojson")
            .then((r) => r.json())
            .then((d) => setCountries(d.features));
    }, []);

    // Keep the globe full-screen
    useEffect(() => {
        const update = () =>
            setSize({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    function addPin(lat: number, lng: number, tz: string) {
        setPins((prev) => [...prev, { id: crypto.randomUUID(), lat, lng, tz }]);
    }

    function addZonePin() {
        if (!chosenZone) return;
        const info = getAllTimezones()[chosenZone];
        const firstCountry = info?.countries?.[0];
        const feature = countries.find((f) => codeOf(f.properties) === firstCountry);
        if (!feature) {
            alert("No country location found for this zone yet.");
            return;
        }
        const c = center(feature.geometry);
        addPin(c.lat, c.lng, chosenZone);
    }

    return (
        <div className="globe-page">
            <Globe
                width={size.w}
                height={size.h}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                backgroundColor="rgba(0,0,0,0)"
                polygonsData={countries}
                polygonCapColor={(d: any) =>
                    d === hovered ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.05)"
                }
                polygonSideColor={() => "rgba(0,0,0,0)"}
                polygonStrokeColor={() => "rgba(255,255,255,0.4)"}
                polygonAltitude={0.01}
                polygonsTransitionDuration={150}
                polygonLabel={(p: any) => p.properties.NAME}
                onPolygonHover={(p: any) => setHovered(p)}
                onPolygonClick={(poly: any, _event: MouseEvent, coords: any) => {
                    const country = getCountry(codeOf(poly.properties));
                    const tzs = country?.timezones ?? [];
                    setSelected({ name: poly.properties.NAME, tzs });
                    if (tzs.length) addPin(coords.lat, coords.lng, tzs[0]);
                }}
                labelsData={pins}
                labelLat="lat"
                labelLng="lng"
                labelText={(d: any) => d.tz}
                labelSize={1.3}
                labelDotRadius={0.5}
                labelColor={() => "#f3d77a"}
                labelAltitude={0.02}
            />

            {/* Left panel: time zone selector and pin list */}
            <GlassCard className="globe-panel globe-panel--left">
                <div className="globe-panel__title">Add a time zone</div>
                <select
                    className="globe-select"
                    value={chosenZone}
                    onChange={(e) => setChosenZone(e.target.value)}
                >
                    <option value="">Choose a time zone…</option>
                    {allZones.map((z) => (
                        <option key={z} value={z}>
                            {z}
                        </option>
                    ))}
                </select>
                <button className="globe-btn" onClick={addZonePin}>
                    Add pin
                </button>

                {pins.length > 0 && (
                    <div className="globe-pins">
                        <div className="globe-panel__title">Pins</div>
                        {pins.map((p) => (
                            <div key={p.id} className="globe-pin-row">
                                <span>{p.tz}</span>
                                <button
                                    className="globe-x"
                                    onClick={() => setPins(pins.filter((x) => x.id !== p.id))}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button className="globe-btn globe-btn--ghost" onClick={() => setPins([])}>
                            Clear all
                        </button>
                    </div>
                )}
            </GlassCard>

            {/* Right panel: country popup with live clocks */}
            {selected && (
                <GlassCard className="globe-panel globe-panel--right">
                    <div className="globe-popup__head">
                        <strong>{selected.name}</strong>
                        <button className="globe-x" onClick={() => setSelected(null)}>
                            ✕
                        </button>
                    </div>
                    {selected.tzs.length === 0 && <div>No time zone data found.</div>}
                    {selected.tzs.map((tz) => (
                        <LiveClock key={tz} tzid={tz} />
                    ))}
                </GlassCard>
            )}
        </div>
    );
}