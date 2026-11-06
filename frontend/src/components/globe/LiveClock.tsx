"use client";

import { useEffect, useState } from "react";
import "./LiveClock.css";

export default function LiveClock({ tzid }: { tzid: string }) {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!now) return null;

    const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: tzid,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(now);

    const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: tzid,
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(now);

    const offset = new Intl.DateTimeFormat("en-US", {
        timeZone: tzid,
        timeZoneName: "shortOffset",
    })
        .formatToParts(now)
        .find((p) => p.type === "timeZoneName")?.value;

    return (
        <div className="live-clock">
            <div className="live-clock__zone">{tzid}</div>
            <div className="live-clock__time">{time}</div>
            <div className="live-clock__meta">
                {date} · {offset}
            </div>
        </div>
    );
}