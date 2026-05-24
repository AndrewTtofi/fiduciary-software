import Link from "next/link";

export function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "color-mix(in oklch, var(--bg) 92%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="container flex items-center justify-between py-6">
        <Link href="/" className="group flex items-baseline gap-3">
          <span
            className="font-display text-[26px] leading-none tracking-[-0.025em] text-ink transition-colors group-hover:text-accent-deep"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50', fontWeight: 400 }}
          >
            ORO
          </span>
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted hidden sm:inline">
            Private Counsel
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-10 font-mono text-[11px] tracking-[0.18em] uppercase">
          <Link href="/#how" className="link-gold text-ink/80 hover:text-ink">Procedure</Link>
          <Link href="/#services" className="link-gold text-ink/80 hover:text-ink">Practice</Link>
          <Link href="/#why" className="link-gold text-ink/80 hover:text-ink">Cyprus</Link>
        </nav>
        <Link href="/login" className="btn btn-primary">
          Start Application →
        </Link>
      </div>
    </header>
  );
}
