import Link from "next/link";

export function Footer() {
  return (
    <footer className="text-bone relative" style={{ background: "var(--ink)" }}>
      {/* Top gold hairline */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(176,141,62,0.55) 50%, transparent)" }}
      />

      <div className="container py-20">
        <div className="grid gap-16 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="block mb-6">
              <span
                className="font-display text-[40px] leading-none tracking-[-0.03em] text-accent"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60', fontWeight: 400 }}
              >
                ORO
              </span>
            </Link>
            <p className="max-w-[36ch] text-bone/55 text-[15px] leading-[1.75]">
              Private corporate counsel for international principals. By engagement,
              by invitation.
            </p>
            <div className="mt-8 font-mono text-[10px] tracking-[0.3em] uppercase text-bone/35">
              Est. MMV · Limassol · Nicosia
            </div>
          </div>

          {/* Practice */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] uppercase text-accent mb-6">Practice</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-bone/55">
              <li><Link href="#services" className="link-gold">Incorporation</Link></li>
              <li><Link href="#services" className="link-gold">Tax Residency</Link></li>
              <li><Link href="#services" className="link-gold">Immigration</Link></li>
              <li><Link href="#services" className="link-gold">Banking</Link></li>
            </ul>
          </div>

          {/* Firm */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] uppercase text-accent mb-6">The Firm</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-bone/55">
              <li><Link href="#about" className="link-gold">About</Link></li>
              <li><Link href="#counsel" className="link-gold">Counsel</Link></li>
              <li><Link href="#news" className="link-gold">Notes</Link></li>
              <li><Link href="#careers" className="link-gold">Careers</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] uppercase text-accent mb-6">Contact</h4>
            <ul className="flex flex-col gap-3 text-[14px] text-bone/55 leading-relaxed">
              <li>Stadiou 15<br />Nicosia 1010, Cyprus</li>
              <li className="figure pt-2">+357 22 037 060</li>
              <li>info@oro.cy</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-bone/10 flex justify-between flex-wrap gap-3 text-[11px] font-mono tracking-[0.18em] uppercase text-bone/40">
          <span>© MMXXVI · ORO Corporate Services Limited</span>
          <span className="flex gap-8">
            <Link href="#" className="link-gold">Privacy</Link>
            <Link href="#" className="link-gold">Terms</Link>
            <Link href="#" className="link-gold">Regulatory</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
