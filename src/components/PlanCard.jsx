import { useMemo, useState, useEffect } from "react";
import { loadJSON, saveJSON } from "../lib/storage";

function isWeekendFromYMD(ymd) {
  const d = new Date(ymd + "T00:00:00");
  const day = d.getDay();
  return day === 0 || day === 6;
}

function todayYMD() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function PlanCard({ selectedDate, hasEvents }) {
  const verticals = useMemo(
    () => [
      { id: "marketplace", name: "Marketplace", desc: "Shop essentials fast with quick, curated picks." },
      { id: "city", name: "Snoonu City", desc: "Discover nearby places, activities and quick stops." },
      { id: "laundry", name: "Laundry", desc: "Pickup + drop-off scheduled — no trips, no waiting." },
      { id: "snoosend", name: "Snoosend", desc: "Send or receive items quickly with same-day options." },
      { id: "mycar", name: "My Car", desc: "Car wash and services that fit into your schedule." },
      { id: "myhouse", name: "My House", desc: "Home essentials and quick fixes delivered on demand." },
    ],
    []
  );

  const gameDefault = useMemo(
    () => ({
      points: 0,
      streak: 0,
      lastCompletedYMD: null,
      badges: { first2: false, explorer: false, streak3: false },
    }),
    []
  );

  const [mode, setMode] = useState("Errands");
  const [selected, setSelected] = useState(() => loadJSON("plan_selected_v4", []));
  const [toast, setToast] = useState("");
  const [game, setGame] = useState(() => loadJSON("plan_game_v1", gameDefault));
  const [routines, setRoutines] = useState(() => loadJSON("plan_routines_v1", []));
  const [routineName, setRoutineName] = useState("");

  const setAndSaveSelected = (next) => {
    setSelected((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      saveJSON("plan_selected_v4", resolved);
      return resolved;
    });
  };

  const setAndSaveGame = (next) => {
    setGame((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      saveJSON("plan_game_v1", resolved);
      return resolved;
    });
  };

  const setAndSaveRoutines = (next) => {
    setRoutines((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      saveJSON("plan_routines_v1", resolved);
      return resolved;
    });
  };

  useEffect(() => {
    const flag = sessionStorage.getItem("demo_reset_done");
    if (flag) return;

    sessionStorage.setItem("demo_reset_done", "1");

    saveJSON("plan_selected_v4", []);
    saveJSON("plan_game_v1", gameDefault);
    saveJSON("plan_routines_v1", []);

    setMode("Errands");
    setSelected([]);
    setGame(gameDefault);
    setRoutines([]);
    setRoutineName("");
  }, [gameDefault]);

  const goal = 2;
  const count = selected.length;
  const progress = Math.min(100, Math.round((count / goal) * 100));
  const completed = count >= goal;

  const toggleVertical = (id) => {
    setAndSaveSelected((prev) => {
      const has = prev.includes(id);
      const updated = has ? prev.filter((x) => x !== id) : [...prev, id];

      if (!has) {
        setAndSaveGame((g) => ({ ...g, points: g.points + 10 }));
        setToast("+10 points ✓");
        setTimeout(() => setToast(""), 900);
      } else {
        setToast("Removed");
        setTimeout(() => setToast(""), 600);
      }
      return updated;
    });
  };

  const completePlan = () => {
    if (!completed) {
      setToast("Add one more service to complete ✓");
      setTimeout(() => setToast(""), 900);
      return;
    }

    const today = todayYMD();

    setAndSaveGame((g) => {
      if (g.lastCompletedYMD === today) return g;

      const yesterday = new Date(today + "T00:00:00");
      yesterday.setDate(yesterday.getDate() - 1);
      const ymdYesterday = yesterday.toISOString().slice(0, 10);

      const newStreak = g.lastCompletedYMD === ymdYesterday ? g.streak + 1 : 1;

      const badges = { ...g.badges };
      if (!badges.first2) badges.first2 = true;
      if (!badges.explorer && selected.length >= 4) badges.explorer = true;
      if (!badges.streak3 && newStreak >= 3) badges.streak3 = true;

      return {
        ...g,
        points: g.points + 50,
        streak: newStreak,
        lastCompletedYMD: today,
        badges,
      };
    });

    setToast("Plan completed! +50 points 🎉");
    setTimeout(() => setToast(""), 1200);
  };

  const badgeList = useMemo(() => {
    const out = [];
    if (game.badges.first2) out.push("2+ Services");
    if (game.badges.explorer) out.push("Explorer");
    if (game.badges.streak3) out.push("3-Day Streak");
    return out;
  }, [game.badges]);

  const weekend = useMemo(() => (selectedDate ? isWeekendFromYMD(selectedDate) : false), [selectedDate]);

  const recommendedId = useMemo(() => {
    if (hasEvents) {
      if (mode === "Chill") return "city";
      if (mode === "Busy") return "snoosend";
      return "marketplace";
    }

    if (weekend) {
      if (mode === "Busy") return "myhouse";
      if (mode === "Chill") return "city";
      return "mycar";
    }

    if (mode === "Busy") return "laundry";
    if (mode === "Chill") return "marketplace";
    return "snoosend";
  }, [mode, weekend, hasEvents]);

  const recommended = useMemo(() => verticals.find((v) => v.id === recommendedId), [verticals, recommendedId]);

  const recReason = hasEvents ? "Event day support" : weekend ? "Weekend fit" : "Weekday efficiency";

  const sharePlan = async () => {
    const planLines = [
      "My Snoonu plan:",
      "• Lunch: Sorted ✅",
      ...selected.map((id) => `• ${verticals.find((v) => v.id === id)?.name || id}`),
      `Mode: ${mode}`,
      `Activation: ${progress}%`,
    ];
    const text = planLines.join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "My Snoonu Plan", text });
        setToast("Shared ✓");
        setTimeout(() => setToast(""), 800);
        return;
      }
    } catch (e) {}

    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard ✓");
      setTimeout(() => setToast(""), 1000);
    } catch (e) {
      setToast("Share not supported");
      setTimeout(() => setToast(""), 1000);
    }
  };

  const modeCopy = useMemo(() => {
    if (mode === "Busy") return "We’ll help you finish tasks with minimum effort.";
    if (mode === "Chill") return "Light plan — convenience without thinking.";
    return "Quick wins that fit into your afternoon.";
  }, [mode]);

  const rewardProgress = useMemo(() => {
    const tiers = [50, 100, 150];
    const next = tiers.find((t) => game.points < t) ?? null;
    if (next === null) return { next: null, remaining: 0, pct: 100 };
    const prev = tiers.filter((t) => t < next).pop() ?? 0;
    const span = next - prev;
    const done = game.points - prev;
    const pct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
    return { next, remaining: Math.max(0, next - game.points), pct };
  }, [game.points]);

  const saveRoutine = () => {
    const name = routineName.trim() || "My routine";
    const payload = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      name,
      mode,
      verticalIds: selected,
      createdAt: Date.now(),
    };

    setAndSaveRoutines((prev) => [payload, ...prev].slice(0, 5));
    setRoutineName("");
    setToast("Routine saved ✓");
    setTimeout(() => setToast(""), 900);
  };

  const applyRoutine = (r) => {
    setMode(r.mode);
    setAndSaveSelected(r.verticalIds || []);
    setToast(`Applied: ${r.name}`);
    setTimeout(() => setToast(""), 900);
  };

  return (
    <div className="bg-snoonuCard rounded-2xl p-4 shadow border border-white/10 relative overflow-hidden">
      {toast && (
        <div className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full bg-black/60 border border-white/10 text-white/90">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg text-snoonuText">Your afternoon, handled</h2>
          <p className="text-sm text-gray-400">12pm – 5pm · {modeCopy}</p>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-snoonuText">Activation: {progress}%</div>
          <div className="text-xs text-gray-400">
            {game.points} pts · 🔥 {game.streak} streak
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {["Busy", "Errands", "Chill"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              mode === m ? "bg-snoonu text-white border-snoonu" : "bg-black/30 text-gray-300 border-white/10 hover:bg-black/40"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
          <div className="bg-snoonu h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Goal: adopt <span className="text-snoonuText font-semibold">2+</span> services · You’re at{" "}
          <span className="text-snoonuText font-semibold">{count}</span>
          {completed && <span className="ml-2 text-white/90">Nice — unlocked 🎉</span>}
        </div>

        {badgeList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {badgeList.map((b) => (
              <span key={b} className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/90">
                🏅 {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl p-4 border border-white/10 bg-black/20">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-snoonuText">Rewards</div>
          <div className="text-sm text-gray-300">{game.points} pts</div>
        </div>

        <div className="mt-2 w-full bg-black/40 rounded-full h-2 overflow-hidden">
          <div className="bg-snoonu h-2 rounded-full transition-all" style={{ width: `${rewardProgress.pct}%` }} />
        </div>

        <div className="mt-2 text-xs text-gray-400">
          {rewardProgress.next === null ? <span>All offers unlocked</span> : <span>{rewardProgress.remaining} pts to unlock next offer</span>}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className={`flex items-center justify-between rounded-xl p-3 ${game.points >= 50 ? "bg-snoonu/10 border border-snoonu/60" : "bg-black/30 border border-white/10"}`}>
            <div>
              <div className="text-sm font-medium text-snoonuText">Free delivery on any service</div>
              <div className="text-xs text-gray-400">Unlocks at 50 points</div>
            </div>
            <div className="text-xs font-semibold">{game.points >= 50 ? "Unlocked ✓" : "Locked"}</div>
          </div>

          <div className={`flex items-center justify-between rounded-xl p-3 ${game.points >= 100 ? "bg-snoonu/10 border border-snoonu/60" : "bg-black/30 border border-white/10"}`}>
            <div>
              <div className="text-sm font-medium text-snoonuText">10% off a new service</div>
              <div className="text-xs text-gray-400">Unlocks at 100 points</div>
            </div>
            <div className="text-xs font-semibold">{game.points >= 100 ? "Unlocked ✓" : "Locked"}</div>
          </div>

          <div className={`flex items-center justify-between rounded-xl p-3 ${game.points >= 150 ? "bg-snoonu/10 border border-snoonu/60" : "bg-black/30 border border-white/10"}`}>
            <div>
              <div className="text-sm font-medium text-snoonuText">Priority access to offers</div>
              <div className="text-xs text-gray-400">Unlocks at 150 points</div>
            </div>
            <div className="text-xs font-semibold">{game.points >= 150 ? "Unlocked ✓" : "Locked"}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl p-4 border border-white/10 bg-black/20">
        <div className="font-semibold text-snoonuText">Lunch: Sorted ✅</div>
        <div className="text-sm text-gray-400">Arrives ~12:45 · Add one more thing while you wait</div>
      </div>

      {recommended && (
        <button
          onClick={() => toggleVertical(recommended.id)}
          className="mt-4 w-full text-left rounded-2xl p-4 border border-snoonu/60 bg-snoonu/10 hover:bg-snoonu/15 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-white/80 mb-1">Recommended next · {recReason}</div>
              <div className="font-semibold text-snoonuText">{recommended.name}</div>
              <div className="text-sm text-gray-300">{recommended.desc}</div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${selected.includes(recommended.id) ? "bg-black/40 text-gray-300" : "bg-snoonu text-white"}`}>
              {selected.includes(recommended.id) ? "Added ✓" : "Add"}
            </div>
          </div>
        </button>
      )}

      <div className="mt-4">
        <div className="text-sm font-semibold text-snoonuText mb-2">Explore more (tap to add)</div>

        <div className="flex flex-col gap-3">
          {verticals.map((v) => {
            const active = selected.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleVertical(v.id)}
                className={`flex items-center justify-between border rounded-2xl p-4 transition ${active ? "border-snoonu/60 bg-snoonu/10" : "border-white/10 bg-black/20 hover:bg-black/30"}`}
              >
                <div>
                  <p className="font-medium text-snoonuText">{v.name}</p>
                  <p className="text-sm text-gray-400">{v.desc}</p>
                </div>

                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${active ? "bg-black/40 text-gray-200" : "bg-snoonu text-white"}`}>
                  {active ? "Added ✓" : "Add"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-snoonuText">Routines</div>
          <button onClick={saveRoutine} className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 transition">
            Save this plan
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <input
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="Name (e.g., Weekday reset)"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          />
          <button onClick={saveRoutine} className="px-4 py-2 rounded-xl bg-snoonu text-white text-sm font-semibold">
            Save
          </button>
        </div>

        {routines.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => applyRoutine(r)}
                className="w-full text-left rounded-2xl p-3 border border-white/10 bg-black/20 hover:bg-black/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-snoonuText">{r.name}</div>
                    <div className="text-xs text-gray-400">
                      {r.mode} · {r.verticalIds?.length || 0} services
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10">Apply</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={sharePlan} className="rounded-2xl py-3 font-semibold bg-white/10 hover:bg-white/15 transition">
          Share my plan
        </button>

        <button
          onClick={completePlan}
          className={`rounded-2xl py-3 font-semibold transition ${completed ? "bg-snoonu text-white" : "bg-black/40 text-gray-300 hover:bg-black/50"}`}
        >
          {completed ? "Complete plan (+50)" : "Complete plan"}
        </button>
      </div>
    </div>
  );
}
