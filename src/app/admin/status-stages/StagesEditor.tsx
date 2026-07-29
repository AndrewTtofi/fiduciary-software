"use client";

import { useState, useTransition } from "react";

type Stages = { pending: string; in_progress: string; completed: string };
type ServiceRow = { key: string; label: string; stages: Stages };

const STAGE_FIELDS: { field: keyof Stages; title: string }[] = [
  { field: "pending", title: "Stage 1 · shown while pending" },
  { field: "in_progress", title: "Stage 2 · shown while in progress" },
  { field: "completed", title: "Stage 3 · shown when completed" },
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
    <div className="grid gap-4 max-w-[760px]">
      {rows.map((r) => {
        const valid = STAGE_FIELDS.every(({ field }) => r.stages[field].trim().length >= 2);
        return (
          <div key={r.key} className="bg-admin-surface border border-admin-border rounded-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="font-semibold">{r.label}</div>
              <div className="flex items-center gap-3">
                {saved[r.key] === "ok" && <span className="text-meta text-admin-muted">Saved</span>}
                {saved[r.key] === "err" && <span className="text-meta text-[#DC2626]">Save failed</span>}
                <button
                  type="button"
                  onClick={() => save(r)}
                  disabled={!valid || (pending && busyKey === r.key)}
                  className="btn btn-primary px-3 py-1.5 text-meta"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {STAGE_FIELDS.map(({ field, title }) => (
                <label key={field} className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-widest text-admin-muted">{title}</span>
                  <input
                    value={r.stages[field]}
                    maxLength={60}
                    onChange={(e) => edit(r.key, field, e.target.value)}
                    className="input"
                  />
                </label>
              ))}
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-meta text-admin-muted">No active services.</p>}
    </div>
  );
}
