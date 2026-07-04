import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export default function VerifySentPage() {
  return (
    <main className="auth-wrap">
      <div className="auth-card text-center">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-6 text-2xl"
             style={{ background: "var(--accent)", color: "var(--dark)" }}>✓</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Check your inbox</h1>
        <div className="note mt-4 mb-8 text-left">
          We&apos;ve sent a verification link to your email. Click it to activate your
          account and continue with onboarding. The link expires in 24 hours.
        </div>
        <Link href="/login" className="btn btn-outline btn-block">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
