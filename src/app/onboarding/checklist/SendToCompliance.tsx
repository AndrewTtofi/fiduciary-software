"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SendToCompliance({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function send() {
    setError(null);
    start(async () => {
      const res = await fetch("/api/onboarding/submit", { method: "PUT" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error === "MISSING_DOCS" ? "Please upload your passport and proof of address first." : "Could not send right now. Please try again.");
        return;
      }
      router.push("/onboarding/success");
    });
  }
  return (
    <div className="flex flex-col items-end gap-2">
      <button type="button" onClick={send} disabled={disabled || pending} className="btn btn-primary px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed">
        {pending ? "Sending…" : "Send to compliance →"}
      </button>
      {error && <span className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
