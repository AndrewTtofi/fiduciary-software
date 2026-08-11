"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronIc } from "@/components/marketing/mk";

export type NavService = { key: string; title: string };

const RESOURCES: { href: string; label: string }[] = [
  { href: "/pricing", label: "Packages" },
  { href: "/faq", label: "FAQ" },
  { href: "/tools/compare", label: "Compare Jurisdictions" },
  { href: "/marketplace", label: "Partner Network" },
  { href: "/advisor", label: "AI Advisor" },
];

/** Desktop nav links + mobile hamburger panel. Client-side so the active link
 *  and the mobile toggle work; branding stays in the server-rendered header.
 *  Dropdowns are state-controlled (not CSS :hover) so they close as soon as a
 *  destination is picked instead of lingering over the new page. */
export function HeaderNav({ services, clientLogin }: { services: NavService[]; clientLogin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<"services" | "more" | null>(null);

  // Route changed: whatever menu was used to get here is done. Adjusting
  // state during render (not in an effect) avoids a flash of the open menu.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setDrop(null);
  }

  const on = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cls = (href: string) => (on(href) ? "on" : undefined);
  const close = () => setDrop(null);

  return (
    <>
      <nav className="nav-links" aria-label="Main">
        <span
          className="drop"
          onMouseEnter={() => setDrop("services")}
          onMouseLeave={() => setDrop((d) => (d === "services" ? null : d))}
        >
          <Link href="/services" className={cls("/services")} onClick={close}>Services {ChevronIc}</Link>
          {drop === "services" && (
            <span className="dmenu">
              {services.map((s) => (
                <Link key={s.key} href={`/services/${s.key}`} onClick={close}>{s.title}</Link>
              ))}
            </span>
          )}
        </span>
        <Link href="/tools/calculator" className={cls("/tools/calculator")}>Tax Calculator</Link>
        <Link href="/insights" className={cls("/insights")}>Insights</Link>
        <Link href="/your-consultation" className={cls("/your-consultation")}>Your Call</Link>
        <span
          className="drop"
          onMouseEnter={() => setDrop("more")}
          onMouseLeave={() => setDrop((d) => (d === "more" ? null : d))}
        >
          <a
            role="button"
            tabIndex={0}
            aria-expanded={drop === "more"}
            onClick={() => setDrop((d) => (d === "more" ? null : "more"))}
            onKeyDown={(e) => e.key === "Enter" && setDrop((d) => (d === "more" ? null : "more"))}
          >
            More {ChevronIc}
          </a>
          {drop === "more" && (
            <span className="dmenu">
              <Link href="/about" onClick={close}>About Us</Link>
              {RESOURCES.map((r) => (
                <Link key={r.href} href={r.href} onClick={close}>{r.label}</Link>
              ))}
            </span>
          )}
        </span>
        {clientLogin && <Link href="/login">Client Login</Link>}
      </nav>
      <button
        className="mnav-btn"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="mnav open" onClick={() => setOpen(false)}>
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          {services.map((s) => (
            <Link key={s.key} href={`/services/${s.key}`} className="sub">{s.title}</Link>
          ))}
          <Link href="/tools/calculator">Tax Calculator</Link>
          <Link href="/insights">Insights</Link>
          <Link href="/your-consultation">Your Call</Link>
          <Link href="/about">About Us</Link>
          {RESOURCES.map((r) => (
            <Link key={r.href} href={r.href}>{r.label}</Link>
          ))}
          <Link href="/contact">Contact</Link>
          {clientLogin && <Link href="/login">Client Login</Link>}
        </div>
      )}
    </>
  );
}
