"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function WelcomeForm({
  fullName: initialName,
  email,
  phone: initialPhone,
  hasPassword,
}: {
  fullName: string;
  email: string;
  phone: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    if (fullName.trim().length < 2) { setError("Please enter your name."); return; }
    if (password && password.length < 8) { setError("A password needs at least 8 characters — or leave it empty for now."); return; }
    start(async () => {
      const profile = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() || null }),
      });
      if (!profile.ok) { setError("We could not save your details. Please try again."); return; }
      // Keep the application's legal-name field in step with the account name.
      await fetch("/api/onboarding/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullLegalName: fullName.trim() }),
      }).catch(() => undefined);
      if (password) {
        const pw = await fetch("/api/account/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!pw.ok) {
          const body = (await pw.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? "We could not set that password.");
          return;
        }
      }
      router.push("/onboarding/checklist");
      router.refresh();
    });
  }

  return (
    <div className="surface rounded-card p-8 lg:p-10 flex flex-col gap-7">
      <Field label="Full name" tag="from booking">
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email" tag="locked" hint="This is the address your link was sent to — it is your sign-in identity, so it cannot be changed here.">
        <input className="input" value={email} readOnly aria-readonly style={{ opacity: 0.7 }} />
      </Field>
      <Field label="Phone / WhatsApp" tag={initialPhone ? "from booking" : "optional"}>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+357 99 123456" />
      </Field>
      {!hasPassword && (
        <Field label="Set a password" tag="optional" hint="You're already in. Add one so you can return later with email + password; otherwise you can skip this.">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
        </Field>
      )}

      {error && (
        <div className="rounded-elem p-4 text-meta" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>{error}</div>
      )}

      <div className="flex justify-between items-center gap-3 flex-wrap border-t border-token pt-6">
        {!hasPassword && !password ? (
          <span className="text-meta text-muted">No password yet — that&apos;s fine, you can add one any time from Settings.</span>
        ) : <span />}
        <button type="button" onClick={submit} disabled={pending} className="btn btn-primary px-8 py-3 disabled:opacity-50">
          {pending ? "Saving…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, tag, hint, children }: { label: string; tag?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-meta font-semibold flex items-center gap-2">
        {label}
        {tag && <span className="text-[11px] uppercase tracking-widest text-muted font-normal">{tag === "locked" ? "🔒 locked" : `✓ ${tag}`}</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
