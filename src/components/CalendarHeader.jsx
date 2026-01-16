import { useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON } from "../lib/storage";
import PrayerWidget from "./PrayerWidget";
import snoonuLogo from "../assets/snoonu-logo.png";
<img
  src={snoonuLogo}
  alt="Snoonu"
  className="h-12 w-auto object-contain"
/>



function ymd(d) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function CalendarHeader({ selectedDate, onSelectDate }) {
  const today = new Date();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const strip = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + (i - 3));
      return d;
    });
  }, []); 

return (
  <>
    <div className="flex items-start justify-between">
      <div className="flex items-center">
        <img
          src={snoonuLogo}
          alt="Snoonu"
          className="h-12 w-auto object-contain"
        />
      </div>
      <PrayerWidget />
    </div>

    <div className="flex justify-between gap-2">
      {strip.map((d, i) => {
        const key = ymd(d);
        const isSelected = key === selectedDate;
        const dow = days[(d.getDay() + 6) % 7];

        return (
          <button
            key={i}
            onClick={() => onSelectDate(key)}
            className={`flex-1 rounded-xl py-2 text-center border transition
              ${
                isSelected
                  ? "border-snoonu bg-snoonuCard"
                  : "border-snoonuStroke bg-snoonuCard/60 hover:bg-snoonuCard"
              }`}
          >
            <div className="text-xs text-gray-400">{dow}</div>
            <div className={`text-sm font-semibold ${isSelected ? "text-snoonu" : "text-snoonuText"}`}>
              {d.getDate()}
            </div>
          </button>
        );
      })}
    </div>
  </>
);
}
