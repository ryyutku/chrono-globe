"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
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
    const globeRef = useRef<any>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [pins, setPins] = useState<Pin[]>([]);
    const [selected, setSelected] = useState<Selected | null>(null);
    const [hovered, setHovered] = useState<any>(null);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [chosenZone, setChosenZone] = useState("");

    const allZones = useMemo(() => Object.keys(getAllTimezones()).sort(), []);

    // Zoom limits: minDistance prevents clipping into surface, maxDistance prevents earth becoming tiny
    const configureControls = () => {
        if (!globeRef.current) return;
        const controls = globeRef.current.controls?.();
        if (controls) {
            controls.minDistance = 130; // Close-up zoom limit (sphere radius = 100)
            controls.maxDistance = 380; // Zoom-out limit so earth stays well-sized
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }
    };

    const handleGlobeReady = () => {
        configureControls();
        globeRef.current?.pointOfView?.({ altitude: 2.2 });
    };

    useEffect(() => {
        configureControls();
    }, []);

    // Load country shapes
    useEffect(() => {
        fetch("/countries.geojson")
            .then((r) => r.json())
            .then((d) => setCountries(d.features))
            .catch((err) => console.error("Failed to load countries.geojson", err));
    }, []);

    // Keep the globe full-screen under navbar (h-16 = 64px)
    useEffect(() => {
        const update = () =>
            setSize({ w: window.innerWidth, h: Math.max(window.innerHeight - 64, 400) });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    function addPin(lat: number, lng: number, tz: string) {
        setPins((prev) => [...prev, { id: crypto.randomUUID(), lat, lng, tz }]);
    }

    function addZonePin() {
        if (!chosenZone) return;
        const info = (getAllTimezones() as Record<string, any>)[chosenZone];
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
                ref={globeRef}
                width={size.w}
                height={size.h}
                globeImageUrl="/textures/earth-day.jpg"
                backgroundImageUrl="/textures/night-sky.png"
                atmosphereColor="#60a5fa"
                atmosphereAltitude={0.18}
                onGlobeReady={handleGlobeReady}
                backgroundColor="rgba(0,0,0,0)"
                polygonsData={countries}
                polygonCapColor={(d: any) =>
                    d === hovered ? "rgba(56, 189, 248, 0.35)" : "rgba(0, 0, 0, 0)"
                }
                polygonSideColor={() => "rgba(0,0,0,0)"}
                polygonStrokeColor={() => "rgba(255, 255, 255, 0.4)"}
                polygonAltitude={0.005}
                polygonsTransitionDuration={150}
                polygonLabel={(p: any) =>
                    `<div style="background: rgba(9,9,11,0.9); color: #f4f4f5; padding: 4px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #27272a; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">${p.properties.NAME}</div>`
                }
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
                labelColor={() => "#38bdf8"}
                labelAltitude={0.015}
            />

            {/* Left panel: time zone selector and pin list */}
            <GlassCard className="globe-panel globe-panel--left">
                <div className="globe-panel__title">Pin a Timezone</div>
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
                    Add pin to globe
                </button>

                {pins.length > 0 && (
                    <div className="globe-pins">
                        <div className="globe-panel__title">Pinned Locations ({pins.length})</div>
                        <div className="globe-pins__list">
                            {pins.map((p) => (
                                <div key={p.id} className="globe-pin-row">
                                    <span title={p.tz}>{p.tz}</span>
                                    <button
                                        className="globe-x"
                                        onClick={() => setPins(pins.filter((x) => x.id !== p.id))}
                                        title="Remove pin"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="globe-btn globe-btn--ghost" onClick={() => setPins([])}>
                            Clear all pins
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
                    {selected.tzs.length === 0 ? (
                        <div className="text-xs text-zinc-400 py-2">No time zone data found.</div>
                    ) : (
                        <div className="globe-clocks-scroll">
                            {selected.tzs.map((tz) => (
                                <LiveClock key={tz} tzid={tz} />
                            ))}
                        </div>
                    )}
                </GlassCard>
            )}
        </div>
    );
}
