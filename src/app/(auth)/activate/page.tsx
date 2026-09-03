import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { peekLeadActivation } from "@/lib/services/lead-activation";
import { ActivateClient, ResendLink } from "./ActivateClient";

export const metadata = { title: "Activate your account" };
export const dynamic = "force-dynamic";

/**
 * Landing page for the post-call activation link. A valid token signs the
 * prospect straight in (see ActivateClient); every other state gets a friendly
 * page with the one sensible next step — never a blank sign-up form.
 */
export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const [{ brandName }, portalOn] = await Promise.all([getBranding(), getClientLoginEnabled()]);
  const peek = token ? await peekLeadActivation(token) : ({ status: "invalid" } as const);

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>

        {!portalOn ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>The client portal is not open yet</h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Your link is fine, but {brandName} has not switched the portal on for clients. Our team will be in touch.
            </p>
            <Link href="/contact" className="btn btn-primary btn-block mt-6">Contact us</Link>
          </>
        ) : peek.status === "valid" ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
              Welcome back{peek.name ? `, ${peek.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Signing you in securely from your link. No password needed — you can add one later from inside your portal.
            </p>
            <ActivateClient token={token} />
          </>
        ) : peek.status === "expired" ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>This link has expired</h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              For your security the link only works for a limited time. Request a fresh one and we will email it straight away.
            </p>
            <ResendLink token={token} />
          </>
        ) : peek.status === "used" ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>This link has already been used</h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Each link works once. If you have set a password, sign in below; otherwise request a new link and we will email it to you.
            </p>
            <Link href="/login" className="btn btn-primary btn-block mt-6">Sign in</Link>
            {peek.canResend && <ResendLink token={token} secondary />}
          </>
        ) : peek.status === "registered" ? (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Your account is already active</h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Sign in with your email and password to pick up where you left off.
            </p>
            <Link href="/login" className="btn btn-primary btn-block mt-6">Sign in</Link>
            <Link href="/login?forgot=1" className="btn btn-ghost btn-block mt-2">Forgot your password?</Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>We could not recognise this link</h1>
            <p className="text-muted mt-2" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Check that the whole link was copied from the email. If it still does not work, reply to the email and we will send a new one.
            </p>
            <Link href="/login" className="btn btn-ghost btn-block mt-6">Go to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
