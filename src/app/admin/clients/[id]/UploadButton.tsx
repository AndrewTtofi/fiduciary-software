"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocPurpose } from "@prisma/client";

export function UploadButton({ clientId, serviceTypeKey, defaultPurpose }: {
  clientId: string;
  serviceTypeKey: string | null;
  defaultPurpose: DocPurpose;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", defaultPurpose);
      if (serviceTypeKey) fd.append("serviceTypeKey", serviceTypeKey);
      const res = await fetch(`/api/admin/clients/${clientId}/documents`, { method: "POST", body: fd });
      if (res.ok) router.refresh();
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Upload failed"); }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onChange} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className="btn btn-primary px-3 py-1.5 text-meta disabled:opacity-50">
        {pending ? "Uploading…" : "Upload"}
      </button>
    </>
  );
}
