import { Logo } from "@/components/marketing/Logo";
import { ForgotForm } from "./ForgotForm";
import Link from "next/link";

export default function ForgotPage() {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Reset your password</h1>
        <p className="text-muted mt-1 mb-6" style={{ fontSize: "0.875rem" }}>
          We&apos;ll email you a link to set a new password. The link expires in 1 hour.
        </p>
        <ForgotForm />
        <p className="text-center mt-6" style={{ fontSize: "0.75rem" }}>
          <Link href="/login">← Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}
