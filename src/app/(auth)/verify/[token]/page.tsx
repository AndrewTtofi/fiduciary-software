import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";
import { verifyEmailByToken } from "@/lib/services/auth-flows";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyEmailByToken(token);
  const ok = result.ok;
  const expired = !ok && (result.reason === "EXPIRED");

  return (
    <main className="auth-wrap">
      <div className="auth-card text-center">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        {ok ? (
          <>
            <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-6 text-2xl"
                 style={{ background: "var(--accent)", color: "var(--dark)" }}>✓</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Email verified</h1>
            <p className="text-muted mt-2 mb-8" style={{ fontSize: "0.875rem" }}>
              Welcome. Sign in to continue your onboarding.
            </p>
            <Link href="/login" className="btn btn-primary btn-block">Sign in</Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-6 text-2xl"
                 style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>!</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
              {expired ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-muted mt-2 mb-8" style={{ fontSize: "0.875rem" }}>
              {expired
                ? "This verification link has expired. Sign in and we'll send you a new one."
                : "We couldn't verify this link. Please sign in to request a new email."}
            </p>
            <Link href="/login" className="btn btn-primary btn-block">← Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
