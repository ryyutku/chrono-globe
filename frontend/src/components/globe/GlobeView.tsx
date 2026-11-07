"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from "next/dynamic";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCountry, getAllTimezones } from "countries-and-timezones";
import tzlookup from "tz-lookup";
import { GlassCard } from "../ui/GlassCard";
import LiveClock from "./LiveClock";
import "./GlobeView.css";

// The globe only works in the browser, so it is loaded client-side only
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Pin = { id: string; lat: number; lng: number; tz: string };
type Selected = { name: string; tzs: string[]; lat: number; lng: number };

function HourglassIcon({ className = "" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            className={className}
        >
            <defs>
                <linearGradient id="hourglass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
            </defs>
            {/* Hourglass Outer Frame */}
            <path
                d="M8 4h16M8 28h16M10 4c0 6 6 8 6 12s-6 6-6 12h12c0-6-6-8-6-12s6-6 6-12H10z"
                stroke="url(#hourglass-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Upper Sand Reservoir */}
            <path
                d="M12 9c1.5 2 3.5 3 4 3s2.5-1 4-3H12z"
                fill="url(#hourglass-gradient)"
                opacity="0.9"
            />
            {/* Flowing Sand Stream */}
            <line
                x1="16"
                y1="13"
                x2="16"
                y2="23"
                stroke="url(#hourglass-gradient)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="hourglass-stream"
            />
            {/* Lower Sand Mound */}
            <path
                d="M11 27c1.5-2 3.5-3 5-3s3.5 1 5 3H11z"
                fill="url(#hourglass-gradient)"
                opacity="0.9"
            />
        </svg>
    );
}

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
    const [isLoading, setIsLoading] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const [countries, setCountries] = useState<any[]>([]);
    const [pins, setPins] = useState<Pin[]>([]);
    const [selected, setSelected] = useState<Selected | null>(null);
    const [hovered, setHovered] = useState<any>(null);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [chosenZone, setChosenZone] = useState("");

    const allZones = useMemo(() => Object.keys(getAllTimezones()).sort(), []);

    // One label per country, placed at the country's centre
    const countryLabels = useMemo(
        () =>
            countries.map((f) => {
                const c = center(f.geometry);
                return {
                    id: "country-" + f.properties.NAME,
                    lat: c.lat,
                    lng: c.lng,
                    name: f.properties.NAME,
                    isCountry: true,
                };
            }),
        [countries]
    );

    // Zoom limits: minDistance prevents clipping into surface, maxDistance prevents earth becoming tiny
    const configureControls = () => {
        if (!globeRef.current) return;
        const controls = globeRef.current.controls?.();
        if (controls) {
            controls.minDistance = 130; // Close-up zoom limit (sphere radius = 100)
            controls.maxDistance = 380; // Zoom-out limit so earth stays well-sized
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.4;
        }
    };

    const handleGlobeReady = () => {
        configureControls();
        globeRef.current?.pointOfView?.({ altitude: 2.2 });

        const material = globeRef.current?.globeMaterial?.();
        if (material) {
            material.color.setRGB(1.35, 1.35, 1.35);
        }

        // Smooth transition out of loading overlay
        setIsFading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        configureControls();

        // Safety fallback timer so loader never gets stuck indefinitely
        const timer = setTimeout(() => {
            setIsFading(true);
            setTimeout(() => setIsLoading(false), 500);
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    // Pause the spin while a country popup is open
    useEffect(() => {
        const controls = globeRef.current?.controls?.();
        if (controls) controls.autoRotate = !selected;
    }, [selected]);

    const [pinsLoaded, setPinsLoaded] = useState(false);

    // Load saved pins when the page opens
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem("globe-pins");
            if (saved) setPins(JSON.parse(saved));
        } catch {
            // ignore broken or blocked storage
        }
        setPinsLoaded(true);
    }, []);

    // Save pins every time they change
    useEffect(() => {
        if (!pinsLoaded) return;
        try {
            sessionStorage.setItem("globe-pins", JSON.stringify(pins));
        } catch {
            // ignore broken or blocked storage
        }
    }, [pins, pinsLoaded]);

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
            {isLoading && (
                <div className={`globe-loading-overlay ${isFading ? "globe-loading-overlay--fade" : ""}`}>
                    <div className="globe-loading-card">
                        <div className="globe-hourglass-wrapper">
                            <HourglassIcon className="globe-hourglass-icon" />
                        </div>
                        <div className="globe-loading-text">
                            <span className="globe-loading-title">Rendering 3D Globe</span>
                            <span className="globe-loading-subtitle">Synchronizing timezones and planetary data...</span>
                        </div>
                    </div>
                </div>
            )}

            <Globe
                ref={globeRef}
                width={size.w}
                height={size.h}
                globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
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
                polygonStrokeColor={() => "rgba(255, 255, 255, 0.12)"}
                polygonAltitude={0.005}
                polygonsTransitionDuration={150}
                polygonLabel={(p: any) =>
                    `<div style="background: rgba(9,9,11,0.9); color: #f4f4f5; padding: 4px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #27272a; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">${p.properties.NAME}</div>`
                }
                onPolygonHover={(p: any) => setHovered(p)}
                onPolygonClick={(poly: any, _event: MouseEvent, coords: any) => {
                    const country = getCountry(codeOf(poly.properties));
                    let tzs: string[] = country?.timezones ?? [];
                    try {
                        // Use the time zone of the exact spot that was clicked
                        tzs = [tzlookup(coords.lat, coords.lng)];
                    } catch {
                        // If the lookup fails, fall back to the country's zone list
                    }
                    setSelected({ name: poly.properties.NAME, tzs, lat: coords.lat, lng: coords.lng });
                }}
                labelsData={countryLabels}
                labelLat="lat"
                labelLng="lng"
                labelText="name"
                labelSize={0.6}
                labelIncludeDot={false}
                labelColor={() => "rgba(255, 255, 255, 1)"}
                labelAltitude={0.012}
                labelResolution={2}
                htmlElementsData={pins}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={0.01}
                htmlElement={(d: any) => {
                    const el = document.createElement("div");
                    el.style.cssText = "position:relative;width:0;height:0;pointer-events:none;";
                    el.innerHTML = `
        <svg width="24" height="32" viewBox="0 0 24 32" style="position:absolute;left:-12px;top:-32px;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.5));">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#f43f5e"/>
            <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
        </svg>
        <div style="position:absolute;left:16px;top:-26px;white-space:nowrap;font-size:12px;font-weight:600;color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,0.9);">${d.tz}</div>
    `;
                    return el;
                }}
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
                    {selected.tzs.length > 0 && (
                        <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
                            <button
                                className="globe-btn"
                                onClick={() => addPin(selected.lat, selected.lng, selected.tzs[0])}
                            >
                                Pin this location
                            </button>
                            <button className="globe-btn globe-btn--ghost" onClick={() => setSelected(null)}>
                                Don't pin
                            </button>
                        </div>
                    )}
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
