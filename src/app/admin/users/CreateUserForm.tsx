"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  function create(fd: FormData) {
    start(async () => {
      setError(null);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          fullName: fd.get("fullName"),
          phone: fd.get("phone") || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; email?: string; tempPassword?: string };
      if (!res.ok) { setError(j.error ?? "Failed to create account"); return; }
      if (j.email && j.tempPassword) setIssued({ email: j.email, password: j.tempPassword });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      <div className="row-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
          Client accounts created here are email-verified immediately — no verification email round-trip.
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-primary">
          {open ? "Cancel" : "+ Create client account"}
        </button>
      </div>

      {open && (
        <form
          className="card mt-4 row"
          style={{ gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}
          onSubmit={(e) => { e.preventDefault(); create(new FormData(e.currentTarget)); }}
        >
          <Field label="Full name">
            <input name="fullName" required minLength={2} className="input" style={{ width: "220px" }} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className="input" style={{ width: "260px" }} />
          </Field>
          <Field label="Phone (optional)">
            <input name="phone" className="input" style={{ width: "180px" }} />
          </Field>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {issued && (
        <div className="card mt-4">
          <div style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>One-time password for {issued.email}</div>
          <code className="mono" style={{ display: "inline-block", marginTop: ".5rem", padding: ".25rem .5rem", background: "var(--surface-2, #f5f5f5)", borderRadius: "6px" }}>
            {issued.password}
          </code>
          <button type="button" onClick={() => setIssued(null)} className="btn btn-ghost btn-sm" style={{ marginLeft: ".75rem" }}>
            Dismiss
          </button>
          <p className="muted mt-2" style={{ fontSize: "var(--fs-xs)" }}>
            Share it securely — it is shown only once. The client signs in with it and completes onboarding.
          </p>
        </div>
      )}

      {error && <div className="badge badge-danger mt-4">{error}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="row" style={{ flexDirection: "column", alignItems: "flex-start", gap: ".35rem" }}>
      <span className="eyebrow" style={{ fontSize: "var(--fs-2xs)" }}>{label}</span>
      {children}
    </label>
  );
}
