"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

export function ArbitraryUploadModal({ folders }: { folders: { key: string | null; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) { alert("Pick a file first."); return; }
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      if (folder) fd.append("serviceTypeKey", folder);
      const res = await fetch("/api/account/documents", { method: "POST", body: fd });
      if (res.ok) { setOpen(false); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Upload failed"); }
    });
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary px-4 py-2">Upload a document</button>;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-[var(--client-surface)] p-6 rounded-card w-[420px] max-w-[90vw] flex flex-col gap-3">
        <h3 className="font-display text-xl">Upload a document</h3>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="input">
          <option value="">General correspondence</option>
          {folders.map((f) => f.key && <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="text-meta" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="btn px-4 py-2">Cancel</button>
          <button type="button" onClick={submit} disabled={pending} className="btn btn-primary px-4 py-2">{pending ? "Uploading…" : "Upload"}</button>
        </div>
      </div>
    </div>
  );
}
