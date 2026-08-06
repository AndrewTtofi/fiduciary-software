"use client";

import { useState, useTransition } from "react";

type Stages = { pending: string; in_progress: string; completed: string };
type ServiceRow = { key: string; label: string; stages: Stages };

/* "Stage 1 · shown while pending" described the database, not the situation.
   These say when the client actually sees each line. */
const STAGE_FIELDS: { field: keyof Stages; title: string; when: string; badge: string }[] = [
  { field: "pending", title: "Not started yet", when: "Before anyone has picked the work up", badge: "badge-pending" },
  { field: "in_progress", title: "Under way", when: "While your team is working on it", badge: "badge-info" },
  { field: "completed", title: "Finished", when: "Once the service is delivered", badge: "badge-approved" },
];

/** Per-service stage wording editor. Each card saves independently so a typo
 *  fix on one service never blocks the rest. */
export function StagesEditor({ initial }: { initial: ServiceRow[] }) {
  const [rows, setRows] = useState(initial);
  const [saved, setSaved] = useState<Record<string, "ok" | "err">>({});
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function edit(key: string, field: keyof Stages, value: string) {
    setSaved((s) => ({ ...s, [key]: undefined as never }));
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, stages: { ...r.stages, [field]: value } } : r)));
  }

  function save(row: ServiceRow) {
    setBusyKey(row.key);
    start(async () => {
      const res = await fetch("/api/admin/status-stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: row.key, stageLabels: row.stages }),
      });
      setSaved((s) => ({ ...s, [row.key]: res.ok ? "ok" : "err" }));
      setBusyKey(null);
    });
  }

  return (
    <div className="stack" style={{ gap: "var(--space-6)", maxWidth: 820 }}>
      {rows.map((r) => {
        const valid = STAGE_FIELDS.every(({ field }) => r.stages[field].trim().length >= 2);
        return (
          <section key={r.key} className="card">
            <div className="row-between mb-4" style={{ flexWrap: "wrap", gap: 12 }}>
              <strong>{r.label}</strong>
              <div className="row gap-3" style={{ alignItems: "center" }}>
                {saved[r.key] === "ok" && <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>Saved</span>}
                {saved[r.key] === "err" && <span style={{ fontSize: "var(--fs-xs)", color: "var(--danger)" }}>Save failed</span>}
                <button
                  type="button"
                  onClick={() => save(r)}
                  disabled={!valid || (pending && busyKey === r.key)}
                  className="btn btn-primary btn-sm"
                >
                  Save
                </button>
              </div>
            </div>

            {/* The point of the page, made visible: this is the client's row. */}
            <div className="stage-preview mb-4">
              <span className="where-lbl">Your client sees</span>
              <div className="stage-preview-rows">
                {STAGE_FIELDS.map(({ field, badge }) => (
                  <div className="stage-preview-row" key={field}>
                    <span>{r.label}</span>
                    <span className={`badge ${badge}`}>{r.stages[field] || "…"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {STAGE_FIELDS.map(({ field, title, when }) => (
                <label key={field} className="field" style={{ marginBottom: 0 }}>
                  <span className="flabel">{title}</span>
                  <input
                    value={r.stages[field]}
                    maxLength={60}
                    onChange={(e) => edit(r.key, field, e.target.value)}
                    className="input"
                  />
                  <span className="help">{when}</span>
                </label>
              ))}
            </div>
          </section>
        );
      })}
      {rows.length === 0 && <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>No active services.</p>}
    </div>
  );
}
