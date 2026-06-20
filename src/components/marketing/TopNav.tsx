import Link from "next/link";

export function TopNav() {
  return (
    <nav className="pubnav">
      <div className="pubnav-inner">
        <Link href="/" className="wordmark">
          <span className="seal" />
          <span className="mk">O</span>
          <span>ORO</span>
        </Link>
        <div className="pubnav-links">
          <Link href="/services">Services</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
        </div>
        <div className="pubnav-right">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </div>
    </nav>
  );
}
