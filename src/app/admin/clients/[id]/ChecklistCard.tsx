"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ChecklistRow = { id: string; label: string; done: boolean };

/** Staff-only manual checklist ("Passport received", …). Internal record
 *  keeping — this card lives only in /admin; clients never see it. */
export function ChecklistCard({ clientId, initial }: { clientId: string; initial: ChecklistRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle(id: string, done: boolean) {
    // Optimistic tick; roll back on failure.
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, done } : r)));
    const res = await fetch(`/api/admin/checklist-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, done: !done } : r)));
  }

  async function remove(id: string) {
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== id));
    const res = await fetch(`/api/admin/checklist-items/${id}`, { method: "DELETE" });
    if (!res.ok) setRows(prev);
  }

  async function add() {
    const label = adding.trim();
    if (label.length < 2 || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/clients/${clientId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setBusy(false);
    if (res.ok) {
      setAdding("");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="text-[12px] font-bold uppercase text-admin-muted tracking-widest mb-3">Internal Checklist</div>
      <div className="bg-admin-surface border border-admin-border rounded-card p-4">
        <div className="flex flex-col gap-2">
          {rows.length === 0 && <p className="text-meta text-admin-muted">No items yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 group">
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-[13px]">
                <input type="checkbox" checked={r.done} onChange={(e) => toggle(r.id, e.target.checked)} />
                <span className={r.done ? "line-through text-admin-muted" : ""}>{r.label}</span>
              </label>
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="text-admin-muted opacity-0 group-hover:opacity-100 hover:text-accent text-[12px]"
                aria-label={`Remove ${r.label}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder="Add item…"
            className="input flex-1 min-w-0 text-[13px]"
          />
          <button type="button" onClick={add} disabled={busy || adding.trim().length < 2} className="btn btn-primary px-3 py-1.5 text-meta">+</button>
        </div>
        <p className="text-[11px] text-admin-muted mt-3">Staff only. Clients never see this checklist.</p>
      </div>
    </div>
  );
}
