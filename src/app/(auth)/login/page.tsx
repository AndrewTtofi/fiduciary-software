import Link from "next/link";
import { AuthTabs } from "./AuthTabs";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { BrandMark } from "@/components/BrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ brandName, brandMark, logo }, clientLogin] = await Promise.all([
    getBranding(),
    getClientLoginEnabled(),
  ]);
  return (
    <main className="auth-wrap">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="wordmark justify-center mb-8" style={{ justifyContent: "center" }}>
          <span className="seal" />
          <BrandMark logo={logo} mark={brandMark} />
          <span>{brandName}</span>
        </Link>

        <div className="auth-card">
          <div className="mb-6">
            <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Welcome back</h2>
            <p className="text-muted mt-1" style={{ fontSize: "0.875rem" }}>
              {clientLogin
                ? "Sign in to access your engagements, documents and messages."
                : "Team and partner sign-in."}
            </p>
          </div>

          {!clientLogin && (
            <div
              className="mb-5 px-4 py-3"
              style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", fontSize: "0.8125rem" }}
            >
              Client accounts are currently disabled.{" "}
              <Link href="/contact" className="text-brand">Book a consultation</Link> instead.
            </div>
          )}

          <AuthTabs initial="signin" searchParamsPromise={searchParams} allowSignup={clientLogin} />

          <div className="divider">Secure sign-in</div>

          <p className="text-center text-muted" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
            By continuing you agree to our{" "}
            <Link href="/terms" className="text-brand">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-brand">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
