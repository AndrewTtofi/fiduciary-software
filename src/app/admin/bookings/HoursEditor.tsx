"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
// Import from the pure module: settings.ts pulls in Prisma, and with it the
// pg driver, which must never reach the browser bundle.
import { expandRanges, type ConsultationHours } from "@/lib/services/consultation-hours";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A short list of zones covers most firms; anything else can be typed. */
const COMMON_ZONES = [
  "Europe/Nicosia", "Europe/Athens", "Europe/London", "Europe/Dublin", "Europe/Lisbon",
  "Europe/Madrid", "Europe/Paris", "Europe/Berlin", "Europe/Zurich", "Europe/Rome",
  "Europe/Amsterdam", "Europe/Brussels", "Europe/Luxembourg", "Europe/Malta",
  "Europe/Bucharest", "Europe/Sofia", "Europe/Warsaw", "Europe/Stockholm",
  "Asia/Dubai", "Asia/Jerusalem", "Asia/Singapore", "Asia/Hong_Kong",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
];

export function HoursEditor({ initial }: { initial: ConsultationHours }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cfg, setCfg] = useState<ConsultationHours>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  /** Exactly the expansion the server does, so the preview cannot drift. */
  const generated = useMemo(
    () => expandRanges(cfg.ranges, cfg.intervalMins, cfg.minutes),
    [cfg.ranges, cfg.intervalMins, cfg.minutes],
  );

  function setRange(i: number, next: { start: string; end: string }) {
    setCfg((p) => ({ ...p, ranges: p.ranges.map((r, j) => (j === i ? next : r)) }));
  }

  function toggleDay(d: number) {
    setCfg((p) => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d].sort((a, b) => a - b),
    }));
  }

  function save() {
    start(async () => {
      setMsg(null);
      setOk(false);
      const res = await fetch("/api/admin/consultation-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: cfg.days,
          ranges: cfg.ranges.map((r) => `${r.start}-${r.end}`),
          intervalMins: cfg.intervalMins,
          minutes: cfg.minutes,
          noticeMins: cfg.noticeMins,
          horizonDays: cfg.horizonDays,
          timezone: cfg.timezone,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) { setOk(true); setMsg("Saved — the booking page now offers these times."); router.refresh(); }
      else setMsg(j.error ?? "Could not save.");
    });
  }

  // Mirrors the server's grid so you can see the effect before saving.
  const preview = useMemo(() => {
    const perDay = generated.length;
    const daysAWeek = cfg.days.length;
    const weeks = cfg.horizonDays / 7;
    return { perDay, daysAWeek, approx: Math.round(perDay * daysAWeek * weeks) };
  }, [generated.length, cfg.days.length, cfg.horizonDays]);

  return (
    <div className="stack" style={{ gap: "var(--space-6)", maxWidth: 760 }}>
      <section className="card">
        <h3 className="card-title">Days you take consultations</h3>
        <div className="chips">
          {DAY_NAMES.map((name, d) => (
            <button
              key={d}
              type="button"
              className={`chip${cfg.days.includes(d) ? " active" : ""}`}
              aria-pressed={cfg.days.includes(d)}
              onClick={() => toggleDay(d)}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
        {cfg.days.length === 0 && (
          <p className="help" style={{ color: "var(--danger)" }}>Pick at least one day, or nobody can book.</p>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Working windows</h3>
        <p className="help" style={{ marginTop: -8, marginBottom: 12 }}>
          On your own clock ({cfg.timezone.replace(/_/g, " ")}). Slots are generated inside each
          window, so a second window is how you keep a lunch break clear. Visitors see the times
          converted to their own zone.
        </p>

        <div className="stack gap-3 mb-4">
          {cfg.ranges.map((r, i) => (
            <div className="row gap-2" key={i} style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              <label className="field" style={{ marginBottom: 0, width: 140 }}>
                <span className="flabel">From</span>
                <input
                  type="time" className="input" value={r.start}
                  onChange={(e) => setRange(i, { ...r, start: e.target.value })}
                />
              </label>
              <label className="field" style={{ marginBottom: 0, width: 140 }}>
                <span className="flabel">To</span>
                <input
                  type="time" className="input" value={r.end}
                  onChange={(e) => setRange(i, { ...r, end: e.target.value })}
                />
              </label>
              {cfg.ranges.length > 1 && (
                <button
                  type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}
                  onClick={() => setCfg((p) => ({ ...p, ranges: p.ranges.filter((_, j) => j !== i) }))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="row gap-3 wrap" style={{ alignItems: "flex-end" }}>
          <button
            type="button" className="btn btn-secondary btn-sm"
            onClick={() => setCfg((p) => ({ ...p, ranges: [...p.ranges, { start: "18:00", end: "20:00" }] }))}
          >
            + Add a window
          </button>
          <label className="field" style={{ marginBottom: 0, width: 210 }}>
            <span className="flabel">Start a slot every</span>
            <select
              className="select"
              value={cfg.intervalMins}
              onChange={(e) => setCfg((p) => ({ ...p, intervalMins: Number(e.target.value) }))}
            >
              {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">
          Slots this produces
          <span className="tag" style={{ marginLeft: 10, verticalAlign: "middle" }}>{generated.length} a day</span>
        </h3>
        {generated.length === 0 ? (
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--danger)" }}>
            No slots — check the windows, or shorten the interval.
          </p>
        ) : (
          <div className="chips">
            {generated.map((t) => <span key={t} className="chip" style={{ cursor: "default" }}>{t}</span>)}
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Length and notice</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="flabel">Consultation length</span>
            <select
              className="select"
              value={cfg.minutes}
              onChange={(e) => setCfg((p) => ({ ...p, minutes: Number(e.target.value) }))}
            >
              {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="flabel">Minimum notice</span>
            <select
              className="select"
              value={cfg.noticeMins}
              onChange={(e) => setCfg((p) => ({ ...p, noticeMins: Number(e.target.value) }))}
            >
              {[0, 30, 60, 120, 240, 1440, 2880].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "None"
                    : m < 60 ? `${m} minutes`
                    : m < 1440 ? `${m / 60} hour${m === 60 ? "" : "s"}`
                    : `${m / 1440} day${m === 1440 ? "" : "s"}`}
                </option>
              ))}
            </select>
            <span className="help">How much warning your advisers get before a call.</span>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="flabel">Open the calendar</span>
            <select
              className="select"
              value={cfg.horizonDays}
              onChange={(e) => setCfg((p) => ({ ...p, horizonDays: Number(e.target.value) }))}
            >
              {[7, 14, 21, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days ahead</option>)}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span className="flabel">Your time zone</span>
            <input
              className="input"
              list="tz-options"
              value={cfg.timezone}
              onChange={(e) => setCfg((p) => ({ ...p, timezone: e.target.value }))}
            />
            <datalist id="tz-options">
              {COMMON_ZONES.map((z) => <option key={z} value={z} />)}
            </datalist>
          </label>
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">What visitors will see</h3>
        <p style={{ fontSize: "var(--fs-sm)" }}>
          {preview.perDay === 0 || preview.daysAWeek === 0 ? (
            <span style={{ color: "var(--danger)" }}>
              Nobody can book: you need at least one day and one start time.
            </span>
          ) : (
            <>
              <strong>{preview.perDay}</strong> slot{preview.perDay === 1 ? "" : "s"} a day on{" "}
              <strong>{preview.daysAWeek}</strong> day{preview.daysAWeek === 1 ? "" : "s"} a week — roughly{" "}
              <strong>{preview.approx}</strong> over the next {cfg.horizonDays} days, before anything already
              in your calendar is removed.
            </>
          )}
        </p>
        <p className="help">
          Slots already taken, and time marked busy on a connected Google or Outlook calendar, are
          hidden automatically.
        </p>
      </section>

      <div className="save-bar">
        <button type="button" className="btn btn-primary" onClick={save} disabled={pending || !cfg.days.length || !generated.length}>
          {pending ? "Saving…" : "Save hours"}
        </button>
        <a href="/contact" target="_blank" rel="noreferrer" className="btn btn-secondary">
          View booking form ↗
        </a>
        {msg && (
          <span style={{ fontSize: "var(--fs-sm)", color: ok ? "var(--success)" : "var(--danger)" }}>{msg}</span>
        )}
      </div>
    </div>
  );
}
