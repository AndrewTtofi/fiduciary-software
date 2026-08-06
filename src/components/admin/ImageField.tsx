"use client";

import { useRef, useState } from "react";

/* Card/header image picker. Replaces a bare "paste a URL here" text box: a
   non-technical writer has a file on their laptop, not a URL. The pasted-path
   case still works for the starter guides, whose images ship with the app. */
export function ImageField({
  value,
  onChange,
  label = "Card image",
  help = "Shown on the Insights list and at the top of the article. Optional.",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  help?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) throw new Error(j.error ?? "Upload failed");
      onChange(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <span className="flabel">{label}</span>
      <div className="imgfield">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="imgfield-preview" />
        ) : (
          <div className="imgfield-preview imgfield-empty">No image</div>
        )}
        <div className="row gap-2 wrap">
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <div className="help">{error ? <span style={{ color: "var(--danger)" }}>{error}</span> : `${help} PNG, JPEG, WEBP, GIF or SVG, under 5MB.`}</div>
    </div>
  );
}
