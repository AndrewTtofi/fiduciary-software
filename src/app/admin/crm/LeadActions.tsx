"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LeadActions({ leadId, converted }: { leadId: string; converted: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<{ email: string; password?: string; existing?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (converted && !issued) return <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>—</span>;

  function convert() {
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/leads/${leadId}/convert`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string; email?: string; tempPassword?: string; existing?: boolean };
      if (!res.ok) { setError(j.error ?? "Failed"); return; }
      setIssued({ email: j.email ?? "", password: j.tempPassword, existing: j.existing });
      router.refresh();
    });
  }

  if (issued) {
    return issued.password ? (
      <span style={{ fontSize: "var(--fs-xs)" }}>
        One-time password: <code className="mono" style={{ userSelect: "all" }}>{issued.password}</code>
      </span>
    ) : (
      <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>Account already existed</span>
    );
  }

  return (
    <span>
      <button type="button" onClick={convert} disabled={pending} className="btn btn-ghost btn-sm">
        {pending ? "Creating…" : "Create account →"}
      </button>
      {error && <span className="badge badge-danger" style={{ marginLeft: ".5rem" }}>{error}</span>}
    </span>
  );
}
