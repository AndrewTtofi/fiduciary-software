"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddServiceModal({ clientId, taxonomy, partners }: {
  clientId: string;
  taxonomy: { key: string; label: string }[];
  partners: { id: string; fullName: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(fd: FormData) {
    start(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: fd.get("serviceType"),
          assignedPartnerId: fd.get("assignedPartnerId") || null,
          startDate: fd.get("startDate") || null,
          notes: fd.get("notes") || null,
        }),
      });
      if (res.ok) { setOpen(false); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Failed"); }
    });
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary px-3 py-1.5 text-meta">+ Add service</button>;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(new FormData(e.currentTarget)); }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
    >
      <div className="bg-admin-surface p-6 rounded-card w-[480px] max-w-[90vw] flex flex-col gap-3">
        <h3 className="font-display text-xl">Add service</h3>
        <select name="serviceType" required className="input">
          {taxonomy.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select name="assignedPartnerId" defaultValue="" className="input">
          <option value="">Unassigned</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
        </select>
        <input name="startDate" type="date" className="input" />
        <textarea name="notes" rows={2} placeholder="Notes (optional)" className="input" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="btn px-4 py-2">Cancel</button>
          <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2">Add</button>
        </div>
      </div>
    </form>
  );
}
