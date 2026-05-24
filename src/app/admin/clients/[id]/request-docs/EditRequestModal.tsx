"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface EditRequestModalProps {
  id: string;
  description: string;
  dueAt: string | null;
  onClose: () => void;
}

export function EditRequestModal({ id, description, dueAt, onClose }: EditRequestModalProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [desc, setDesc] = useState(description);
  const [due, setDue] = useState(dueAt ? new Date(dueAt).toISOString().slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (desc.trim().length < 3) { setError("Description must be at least 3 characters."); return; }
    setError(null);
    start(async () => {
      const res = await fetch(`/api/admin/document-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc.trim(),
          dueAt: due || null,
        }),
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Save failed");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-5 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-admin-surface rounded-card w-full max-w-[480px] overflow-hidden">
        <div className="px-6 py-5 border-b border-admin-border flex justify-between items-center">
          <h3 className="font-display text-xl">Edit document request</h3>
          <button type="button" onClick={onClose} className="text-admin-muted hover:text-admin-fg">✕</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-widest text-admin-muted font-semibold">Description</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="input"
              placeholder="What should the client upload?"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-widest text-admin-muted font-semibold">Due date (optional)</span>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="input"
            />
          </label>
          {error && <p className="text-[13px]" style={{ color: "#DC2626" }}>{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-admin-border flex justify-end gap-3" style={{ background: "var(--bg)" }}>
          <button type="button" onClick={onClose} className="btn btn-ghost px-5 py-2.5">Cancel</button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="btn btn-primary px-5 py-2.5 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
