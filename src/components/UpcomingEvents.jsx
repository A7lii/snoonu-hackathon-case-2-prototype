
import { useMemo, useEffect } from "react";


// IMPORTANT: UI shows UPCOMING events, not “selected-day only”.
const EVENTS = [
  { id: 1, title: "Football Match", tag: "Tickets", city: "Qatar", venue: "Stadium", date: "2026-01-18" },
  { id: 2, title: "Live Concert Night", tag: "Tickets", city: "Doha", venue: "Arena", date: "2026-01-20" },
  { id: 3, title: "Comedy Show", tag: "Tickets", city: "Doha", venue: "Theatre", date: "2026-01-22" },
  { id: 4, title: "Family Festival", tag: "Book", city: "Doha", venue: "Outdoor event", date: "2026-01-25" },
];

function prettyDate(ymd) {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function UpcomingEvents({ selectedDate, onHasEventsChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = useMemo(() => {
    const sorted = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    
    return sorted.filter((e) => new Date(e.date + "T00:00:00") >= today).slice(0, 6);
  }, []);

  const hasEventOnSelectedDate = useMemo(() => {
    if (!selectedDate) return false;
    return EVENTS.some((e) => e.date === selectedDate);
  }, [selectedDate]);

  
  useEffect(() => {
    onHasEventsChange?.(hasEventOnSelectedDate);
  }, [hasEventOnSelectedDate, onHasEventsChange]);

  return (
    <div className="bg-snoonuCard rounded-2xl p-4 shadow border border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-snoonuText">Upcoming Events</h3>
        <div className="text-xs text-gray-400">Qatar · Tickets</div>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {upcoming.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between border border-white/10 rounded-2xl p-4 bg-black/20"
          >
            <div>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-snoonuText">{e.title}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-snoonu text-white">
                  {e.tag}
                </span>
              </div>

              <div className="text-sm text-gray-400">
                {e.city} · {e.venue} · {prettyDate(e.date)}
              </div>

              {}
              {selectedDate === e.date && (
                <div className="mt-1 text-xs text-white/80">
                  Matches selected day ✓
                </div>
              )}
            </div>

            <button className="px-4 py-1.5 rounded-full bg-snoonu text-white text-sm font-semibold">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
