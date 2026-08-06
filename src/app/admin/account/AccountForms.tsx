"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* Personal account settings for staff and partners.

   Until now the only change-password form lived at /app/settings — the client
   portal. Staff could reach it, but sending a colleague into the customer
   portal to change their own password is a strange thing to ask, and nothing
   in the admin linked there. Same API, somewhere that makes sense. */
export function AccountForms({ fullName, email, phone }: { fullName: string; email: string; phone: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState(false);

  function saveProfile(fd: FormData) {
    start(async () => {
      setProfileMsg(null);
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fd.get("fullName"), phone: String(fd.get("phone") ?? "") || null }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setProfileMsg(res.ok ? "Saved." : j.error ?? "Could not save.");
      if (res.ok) router.refresh();
    });
  }

  function changePassword(form: HTMLFormElement) {
    const fd = new FormData(form);
    start(async () => {
      setPwdMsg(null);
      setPwdOk(false);
      if (String(fd.get("newPassword")) !== String(fd.get("confirmPassword"))) {
        setPwdMsg("The new passwords do not match.");
        return;
      }
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: fd.get("currentPassword"),
          newPassword: fd.get("newPassword"),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) { setPwdOk(true); setPwdMsg("Password updated."); form.reset(); }
      else setPwdMsg(j.error ?? "Could not update the password.");
    });
  }

  return (
    <div className="stack" style={{ gap: "var(--space-6)", maxWidth: 620 }}>
      <section className="card">
        <h3 className="card-title">Your details</h3>
        <form onSubmit={(e) => { e.preventDefault(); saveProfile(new FormData(e.currentTarget)); }}>
          <label className="field">
            <span className="flabel">Full name</span>
            <input name="fullName" defaultValue={fullName} required minLength={2} className="input" />
          </label>
          <label className="field">
            <span className="flabel">Email</span>
            <input value={email} readOnly disabled className="input" />
            <span className="help">Ask a colleague with admin access to change your sign-in email.</span>
          </label>
          <label className="field">
            <span className="flabel">Phone (optional)</span>
            <input name="phone" defaultValue={phone ?? ""} className="input" />
          </label>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save details"}
            </button>
            {profileMsg && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{profileMsg}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h3 className="card-title">Password</h3>
        <form onSubmit={(e) => { e.preventDefault(); changePassword(e.currentTarget); }}>
          <label className="field">
            <span className="flabel">Current password</span>
            <input name="currentPassword" type="password" required autoComplete="current-password" className="input" />
          </label>
          <label className="field">
            <span className="flabel">New password</span>
            <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
            <span className="help">At least 8 characters.</span>
          </label>
          <label className="field">
            <span className="flabel">Confirm new password</span>
            <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </label>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </button>
            {pwdMsg && (
              <span style={{ fontSize: "var(--fs-sm)", color: pwdOk ? "var(--success)" : "var(--danger)" }}>{pwdMsg}</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
