"use client";
import { useState, useTransition } from "react";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  async function onSubmit(formData: FormData) {
    start(async () => {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="note">
        If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}
    >
      <div className="flex flex-col gap-2">
        <label className="flabel" style={{ marginBottom: 0 }}>Email Address</label>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary btn-block disabled:opacity-50">
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
