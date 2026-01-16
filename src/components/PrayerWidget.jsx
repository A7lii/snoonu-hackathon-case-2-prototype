
import { useEffect, useMemo, useState } from "react";

const FALLBACK_COORDS = { lat: 25.2854, lon: 51.5310 }; 
const METHOD = 8; 

function toMinutes(hhmm) {
  
  const clean = hhmm.split(" ")[0];
  const [h, m] = clean.split(":").map(Number);
  return h * 60 + m;
}

function format12hFromMinutes(totalMinutes) {
  const d = new Date();
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function PrayerWidget() {
  const [coords, setCoords] = useState(FALLBACK_COORDS);
  const [timings, setTimings] = useState(null);
  const [now, setNow] = useState(() => new Date());

  
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  
  useEffect(() => {
    let cancelled = false;

    async function fetchTimings() {
      try {
        const url = `https://api.aladhan.com/v1/timings?latitude=${coords.lat}&longitude=${coords.lon}&method=${METHOD}`;
        const res = await fetch(url);
        const data = await res.json();

        if (cancelled) return;

        const t = data?.data?.timings;
        if (!t) return;

        
        setTimings({
          Fajr: t.Fajr,
          Dhuhr: t.Dhuhr,
          Asr: t.Asr,
          Maghrib: t.Maghrib,
          Isha: t.Isha,
        });
      } catch (e) {
        
      }
    }

    fetchTimings();
    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon]);

  const nextPrayer = useMemo(() => {
    if (!timings) return null;

    const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    const nowMin = now.getHours() * 60 + now.getMinutes();

    
    const schedule = order.map((name) => ({
      name,
      min: toMinutes(timings[name]),
    }));

    const upcoming = schedule.find((p) => p.min > nowMin);

    
    if (!upcoming) {
      return { name: "Fajr", min: schedule[0].min, isTomorrow: true };
    }

    return { name: upcoming.name, min: upcoming.min, isTomorrow: false };
  }, [timings, now]);

  return (
    <div className="flex items-center">
      <div className="w-14 h-14 rounded-full bg-snoonu flex flex-col items-center justify-center leading-none shadow border border-white/10">
        <span className="text-xs font-semibold text-white">
          {nextPrayer ? nextPrayer.name : "—"}
        </span>
        <span className="text-xs text-white/90">
          {nextPrayer ? format12hFromMinutes(nextPrayer.min) : "Loading"}
        </span>
      </div>
    </div>
  );
}
