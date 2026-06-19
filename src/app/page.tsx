import Link from "next/link";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";
import { ServiceIcons, SERVICES } from "@/components/marketing/ServiceIcons";

const STEPS = [
  { n: "01", t: "Apply", d: "Create an account and submit your details and documents through a short, guided application — tailored to the services you need." },
  { n: "02", t: "Review", d: "Our compliance team reviews each application with KYC and sanctions screening, then approves — usually within one business day." },
  { n: "03", t: "Onboard", d: "Once approved you unlock booking and a full workspace: documents, messaging, deadlines and your dedicated advisor." },
];

const TESTIMONIALS = [
  { q: "Incorporated and banked in under three weeks. The portal made the document back-and-forth painless.", n: "Daniel Roth", r: "Founder, fintech · Germany" },
  { q: "Finally a corporate-services firm that feels like software. I always knew exactly what was outstanding.", n: "Aisha Karim", r: "Director · UAE" },
  { q: "Tax residency and banking handled together, with one point of contact. Exactly what we needed relocating.", n: "Elena Pappas", r: "Private client · Cyprus" },
];

const STATS = [
  { v: "150+", l: "Companies incorporated" },
  { v: "4.9★", l: "Client rating · 87 reviews" },
  { v: "25+", l: "Banking relationships" },
];

export default function LandingPage() {
  return (
    <div className="shell-marketing">
      <TopNav />
      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="hero">
          <div className="mx-auto max-w-[1200px]">
            <span className="hero-seal" />
            <div className="eyebrow"><span className="seal">—</span> CORPORATE SERVICES · CYPRUS</div>
            <h1>Your Cyprus company, handled end to end.</h1>
            <p className="lead">
              Incorporation, tax residency, banking and ongoing compliance — set up
              and run from one branded platform, with a dedicated advisor and full
              visibility at every step.
            </p>
            <div className="hero-cta">
              <Link href="/login" className="btn btn-primary btn-lg">Start an application →</Link>
              <Link href="/services" className="btn btn-secondary btn-lg">Explore services</Link>
            </div>
          </div>
        </header>

        {/* ── 3-step ───────────────────────────────────────────── */}
        <section id="how" className="section-sm">
          <div className="mx-auto max-w-[1200px] grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────────── */}
        <section id="services" className="section">
          <div className="mx-auto max-w-[1200px]">
            <div className="sec-head">
              <div className="eyebrow">WHAT WE HANDLE</div>
              <h2>One platform across the whole engagement.</h2>
              <p>Six core corporate-services lines, each with its own guided intake and required-document logic.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <Link key={s.key} href="/services" className="svc-card block">
                  <div className="svc-ic">{ServiceIcons[s.key]}</div>
                  <h3>{s.title}</h3>
                  <p>{s.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof bar ────────────────────────────────────────── */}
        <section className="section-sm">
          <div className="mx-auto max-w-[1200px]">
            <div className="proof-bar">
              {STATS.map((s) => (
                <div key={s.l} className="proof-stat">
                  <div className="v">{s.v}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
              <div style={{ marginLeft: "auto" }}>
                <div className="l" style={{ marginBottom: 6 }}>Trusted by founders from</div>
                <div className="flags">🇬🇧 🇩🇪 🇫🇷 🇳🇱 🇺🇸 🇦🇪 🇮🇳 🇨🇭 🇸🇪 🇮🇹</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section className="section">
          <div className="mx-auto max-w-[1200px]">
            <div className="sec-head">
              <div className="eyebrow">IN THEIR WORDS</div>
              <h2>Principals run their setup on it.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.n} className="testi">
                  <div className="stars">★★★★★</div>
                  <p>“{t.q}”</p>
                  <div className="who">
                    <div className="avatar">{t.n.split(" ").map((w) => w[0]).join("")}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.n}</div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>{t.r}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA band ─────────────────────────────────────────── */}
        <section className="section">
          <div className="mx-auto max-w-[1200px]">
            <div className="cta-band">
              <h2>Start your application today.</h2>
              <p>An initial consultation is offered without obligation. Submit a brief application and counsel will be in touch within one business day.</p>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{ marginTop: 32, background: "#fff", color: "var(--brand-dark)", borderColor: "#fff" }}>
                Start an application →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
