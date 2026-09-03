"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** Redeems the activation token the moment the page loads. The server has
 *  already classified the token as valid; redemption itself happens inside the
 *  "activation" credentials provider so next-auth owns the session cookie. */
export function ActivateClient({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"working" | "failed">("working");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // StrictMode double-invokes effects in dev; the token is single-use.
    fired.current = true;
    (async () => {
      const res = await signIn("activation", { token, redirect: false });
      if (!res || res.error) { setState("failed"); return; }
      router.push("/onboarding/welcome");
      router.refresh();
    })();
  }, [token, router]);

  if (state === "failed") {
    return (
      <div className="mt-6">
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          That did not work — the link may have just been used on another device. Try signing in, or request a new link.
        </p>
        <Link href="/login" className="btn btn-primary btn-block mt-4">Sign in</Link>
        <ResendLink token={token} secondary />
      </div>
    );
  }
  return (
    <div className="mt-6 flex items-center gap-3 text-muted" style={{ fontSize: "0.875rem" }} aria-live="polite">
      <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      Opening your onboarding…
    </div>
  );
}

/** "Request a new link" for expired / used tokens. */
export function ResendLink({ token, secondary }: { token: string; secondary?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  async function resend() {
    if (state !== "idle") return;
    setState("busy");
    await fetch("/api/auth/activation/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => undefined);
    setState("sent");
  }
  if (state === "sent") {
    return (
      <p className="mt-4 text-muted" style={{ fontSize: "0.875rem" }}>
        If this link was yours, a fresh one is on its way to your inbox.
      </p>
    );
  }
  return (
    <button type="button" onClick={resend} disabled={state === "busy"} className={`btn ${secondary ? "btn-ghost" : "btn-primary"} btn-block ${secondary ? "mt-2" : "mt-6"}`}>
      {state === "busy" ? "Sending…" : "Request a new link"}
    </button>
  );
}
