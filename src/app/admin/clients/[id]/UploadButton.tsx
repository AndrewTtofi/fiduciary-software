"use client";
import { useRef, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocPurpose } from "@prisma/client";

const PURPOSE_OPTIONS: { value: DocPurpose; label: string }[] = [
  { value: "passport", label: "Passport / ID" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "sof", label: "Source of funds" },
  { value: "other", label: "Other" },
];

export function UploadButton({ clientId, serviceTypeKey, defaultPurpose }: {
  clientId: string;
  serviceTypeKey: string | null;
  defaultPurpose: DocPurpose;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showPopover, setShowPopover] = useState(false);
  const [purpose, setPurpose] = useState<DocPurpose>(defaultPurpose);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowPopover(false);
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", purpose);
      if (serviceTypeKey) fd.append("serviceTypeKey", serviceTypeKey);
      const res = await fetch(`/api/admin/clients/${clientId}/documents`, { method: "POST", body: fd });
      if (res.ok) router.refresh();
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Upload failed"); }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="relative inline-block">
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onFileChange} className="hidden" />
      <button
        type="button"
        onClick={() => setShowPopover((v) => !v)}
        disabled={pending}
        className="btn btn-primary px-3 py-1.5 text-meta disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {showPopover && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-admin-surface border border-admin-border rounded-card shadow-lg p-4 w-56">
          <label className="flex flex-col gap-1 mb-3">
            <span className="text-[11px] uppercase tracking-widest text-admin-muted font-semibold">Purpose</span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as DocPurpose)}
              className="input text-meta"
            >
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-primary w-full py-2 text-meta"
          >
            Choose file…
          </button>
        </div>
      )}
    </div>
  );
}
