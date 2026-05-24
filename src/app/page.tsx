import Link from "next/link";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";
import { ServiceIcons, SERVICES } from "@/components/marketing/ServiceIcons";

export default function LandingPage() {
  return (
    <div className="shell-marketing">
      <TopNav />
      <main>
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Atmospheric gradient + grain */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, rgba(176,141,62,0.10) 0%, transparent 60%)",
            }}
          />
          <div className="container py-28 lg:py-40 relative">
            <div className="max-w-[920px] mx-auto text-center">
              <div className="eyebrow eyebrow-line inline-block mb-10 animate-fade-in">
                Est. MMV · Private Counsel · Cyprus
              </div>
              <h1
                className="font-display mb-10 animate-fade-rise text-ink"
                style={{
                  fontSize: "clamp(56px, 8.5vw, 132px)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.04em",
                  fontVariationSettings: '"opsz" 144, "SOFT" 60, "WONK" 0',
                  fontWeight: 400,
                }}
              >
                Discretion,
                <br />
                <span
                  className="italic text-accent-deep"
                  style={{
                    fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
                    fontWeight: 300,
                  }}
                >
                  codified.
                </span>
              </h1>
              <p
                className="text-lead text-muted max-w-[58ch] mx-auto mb-14 animate-fade-rise"
                style={{ animationDelay: "200ms" }}
              >
                Two decades of corporate counsel for international principals who
                require privacy as standard. Incorporation, fiduciary administration,
                tax residency — handled with the gravity they deserve.
              </p>
              <div
                className="flex items-center gap-4 flex-wrap justify-center animate-fade-rise"
                style={{ animationDelay: "350ms" }}
              >
                <Link href="/login" className="btn btn-primary">
                  Start Application →
                </Link>
                <Link href="#services" className="btn btn-outline">
                  Engagements
                </Link>
              </div>
            </div>

            {/* Gilded hairline that draws on load */}
            <div className="container mt-24 lg:mt-32">
              <div
                aria-hidden
                className="h-px origin-center animate-draw-line"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(176,141,62,0.55) 30%, rgba(176,141,62,0.55) 70%, transparent)",
                  animationDelay: "500ms",
                }}
              />
            </div>
          </div>
        </section>

        {/* ─── How it works (the editorial process) ─────────────────── */}
        <section id="how" className="py-24 lg:py-32">
          <div className="container">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-16 mb-20">
              <div>
                <div className="eyebrow eyebrow-line mb-6">The Procedure</div>
                <h2 className="text-h2 font-display text-ink">
                  In three
                  <br />
                  <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}>
                    measured
                  </span>
                  <br />
                  acts.
                </h2>
              </div>
              <p className="text-lead text-muted max-w-[52ch] lg:pt-12">
                The intake protocol mirrors how a private bank would receive a new
                principal. Considered, never rushed; documented at every step.
              </p>
            </div>

            <ol className="grid gap-px md:grid-cols-3" style={{ background: "var(--border)" }}>
              {[
                {
                  n: "I",
                  title: "Engage",
                  body: "Submit a brief application. Select the services that fit. We respond within one business day.",
                },
                {
                  n: "II",
                  title: "Review",
                  body: "Compliance counsel performs due diligence on your file. KYC and sanctions screening run in parallel.",
                },
                {
                  n: "III",
                  title: "Convene",
                  body: "Once approved, meet your advisor. Strategy, scope, and timeline are agreed in counsel.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="bg-surface p-10 lg:p-14 flex flex-col gap-6 lift"
                  style={{ border: 0 }}
                >
                  <div
                    className="font-display text-accent-deep"
                    style={{
                      fontSize: 64,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      fontVariationSettings: '"opsz" 144, "SOFT" 100',
                    }}
                  >
                    {s.n}
                  </div>
                  <h3 className="text-h3 text-ink">{s.title}</h3>
                  <p className="text-muted leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Services ─────────────────────────────────────────────── */}
        <section
          id="services"
          className="py-24 lg:py-32 relative"
          style={{ background: "var(--admin-bg)" }}
        >
          <div className="container">
            <div className="max-w-[60ch] mb-20">
              <div className="eyebrow eyebrow-line mb-6">Practice Areas</div>
              <h2 className="text-h2 font-display text-ink">
                Comprehensive
                <br />
                <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}>
                  counsel,
                </span>{" "}
                singular focus.
              </h2>
            </div>
            <div className="grid gap-px md:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--border)" }}>
              {SERVICES.map((s) => (
                <article
                  key={s.key}
                  className="flex flex-col gap-6 p-10 lg:p-12 bg-surface lift"
                  style={{ border: 0 }}
                >
                  <div
                    className="w-12 h-12 grid place-items-center text-accent"
                    style={{
                      background: "var(--ink)",
                      border: "1px solid var(--ink)",
                    }}
                  >
                    <span className="w-5 h-5 block">{ServiceIcons[s.key]}</span>
                  </div>
                  <h3 className="text-h3 text-ink">{s.title}</h3>
                  <p className="text-muted leading-relaxed">{s.blurb}</p>
                  <div className="hairline-gold mt-2" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stats band — ink, gold figures ───────────────────────── */}
        <section className="py-28 relative" style={{ background: "var(--ink)" }}>
          {/* Decorative top hairline */}
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(176,141,62,0.5) 50%, transparent)" }}
          />
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { n: "150", suffix: "+", label: "Companies Incorporated", note: "Across 14 jurisdictions" },
              { n: "100", suffix: "%", label: "Compliance Standing", note: "No material findings, 2020–" },
              { n: "25", suffix: "+", label: "Banking Relationships", note: "Tier-1 EU & EMEA partners" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-4">
                <div
                  className="font-display text-accent figure"
                  style={{
                    fontSize: "clamp(72px, 8vw, 112px)",
                    lineHeight: 0.9,
                    fontVariationSettings: '"opsz" 144, "SOFT" 60',
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.n}
                  <span style={{ fontSize: "0.42em", verticalAlign: "0.5em", marginLeft: "0.05em", color: "rgba(176,141,62,0.7)" }}>
                    {s.suffix}
                  </span>
                </div>
                <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-bone/60">
                  {s.label}
                </p>
                <p className="text-[14px] text-bone/45 italic leading-relaxed">
                  {s.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────────────── */}
        <section className="py-32 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(60% 60% at 50% 100%, rgba(176,141,62,0.08), transparent 70%)",
            }}
          />
          <div className="container relative">
            <div className="eyebrow eyebrow-line inline-block mb-8">By Appointment</div>
            <h2
              className="text-h2 font-display mb-8 text-ink"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70' }}
            >
              Begin a{" "}
              <span className="italic text-accent-deep" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}>
                conversation.
              </span>
            </h2>
            <p className="text-lead text-muted mb-12 max-w-[52ch] mx-auto">
              An initial consultation is offered without obligation. Submit a brief
              application and counsel will be in touch within one business day.
            </p>
            <Link href="/login" className="btn btn-primary">Start Application →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
