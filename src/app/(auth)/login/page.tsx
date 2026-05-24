import Link from "next/link";
import { AuthTabs } from "./AuthTabs";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <main className="shell-marketing min-h-screen grid lg:grid-cols-[1.1fr_1fr] overflow-hidden">
      {/* ─── Left: editorial side ──────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between p-16 text-bone relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 0%, rgba(176,141,62,0.18) 0%, transparent 50%), linear-gradient(170deg, #1A1612 0%, #2A2118 60%, #1A1612 100%)",
        }}
      >
        {/* Decorative hairlines */}
        <div
          aria-hidden
          className="absolute top-0 left-16 right-16 h-px opacity-30"
          style={{ background: "linear-gradient(90deg, transparent, #B08D3E 50%, transparent)" }}
        />
        <div
          aria-hidden
          className="absolute bottom-16 left-16 right-16 h-px opacity-20"
          style={{ background: "linear-gradient(90deg, transparent, rgba(229,221,201,0.6) 50%, transparent)" }}
        />

        {/* Brand mark */}
        <div className="animate-fade-in">
          <div className="font-display text-[34px] leading-none tracking-[-0.02em] text-accent">
            ORO
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.32em] uppercase text-bone/50">
            Private&nbsp;Counsel&nbsp;·&nbsp;Cyprus
          </div>
        </div>

        {/* Editorial blockquote */}
        <div className="max-w-[480px] animate-fade-rise" style={{ animationDelay: "200ms" }}>
          <div className="eyebrow text-accent mb-6 font-mono">Est. MMV</div>
          <h1
            className="font-display text-[clamp(40px,4.5vw,64px)] leading-[1.05] tracking-[-0.025em] text-bone"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
          >
            Discretion,<br />
            <span className="italic font-light text-accent" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              codified.
            </span>
          </h1>
          <p className="mt-8 text-[15px] leading-[1.75] text-bone/70 max-w-[420px]">
            Two decades of corporate counsel for principals who require privacy as
            standard, not as exception. Incorporation, fiduciary administration,
            tax residency.
          </p>
        </div>

        {/* Footer line */}
        <div className="flex items-center justify-between text-[11px] tracking-[0.18em] uppercase font-mono text-bone/40 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <span>Limassol · Nicosia</span>
          <span>Member · Cyprus Bar</span>
        </div>
      </aside>

      {/* ─── Right: form ───────────────────────────────────────────── */}
      <section className="flex flex-col justify-center px-8 sm:px-14 py-14 relative">
        <div className="absolute top-10 right-10 hidden lg:block font-mono text-[10px] tracking-[0.22em] uppercase text-admin-muted">
          Secure Sign-In
        </div>

        <div className="w-full max-w-[420px] mx-auto animate-fade-rise">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <div className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink">ORO</div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.28em] uppercase text-muted">
              Private Counsel · Cyprus
            </div>
          </div>

          <div className="mb-10">
            <div className="eyebrow eyebrow-line">Welcome</div>
            <h2 className="font-display text-[40px] leading-[1.05] tracking-[-0.025em] mt-3 text-ink">
              Welcome{" "}
              <span className="italic font-light text-accent-deep" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
                back.
              </span>
            </h2>
            <p className="mt-3 text-[14px] text-muted leading-relaxed">
              Sign in to access your engagements, correspondence, and documents.
            </p>
          </div>

          <AuthTabs initial="signin" searchParamsPromise={searchParams} />

          <hr className="hairline my-8" />

          <p className="text-center text-[11px] text-muted tracking-[0.03em] leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link href="#" className="link-gold text-ink">Terms of Service</Link>{" "}
            and{" "}
            <Link href="#" className="link-gold text-ink">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
