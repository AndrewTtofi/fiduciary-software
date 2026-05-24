"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ReassignModal({ clientId, currentPrimaryId, staff }: {
  clientId: string;
  currentPrimaryId: string;
  staff: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pick, setPick] = useState(currentPrimaryId);
  const router = useRouter();

  function save() {
    start(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryStaffId: pick }),
      });
      if (res.ok) { setOpen(false); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Failed"); }
    });
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-meta underline text-[12px]">Reassign primary staff</button>;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-admin-surface p-6 rounded-card w-[400px] max-w-[90vw] flex flex-col gap-3">
        <h3 className="font-display text-xl">Reassign primary staff</h3>
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="input">
          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <p className="text-[12px] text-admin-muted">To change assigned partners per service, edit them inline in the Services Engaged section.</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="btn px-4 py-2">Cancel</button>
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary px-4 py-2">Save</button>
        </div>
      </div>
    </div>
  );
}
