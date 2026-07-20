"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronIc } from "@/components/marketing/mk";

export type NavService = { key: string; title: string };

const RESOURCES: { href: string; label: string }[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/tools/calculator", label: "Tax Calculator" },
  { href: "/tools/compare", label: "Compare Jurisdictions" },
  { href: "/marketplace", label: "Partner Network" },
  { href: "/advisor", label: "AI Advisor" },
];

/** Desktop nav links + mobile hamburger panel. Client-side so the active link
 *  and the mobile toggle work; branding stays in the server-rendered header. */
export function HeaderNav({ services, clientLogin }: { services: NavService[]; clientLogin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const on = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cls = (href: string) => (on(href) ? "on" : undefined);

  return (
    <>
      <nav className="nav-links" aria-label="Main">
        <Link href="/" className={cls("/")}>Home</Link>
        <Link href="/about" className={cls("/about")}>About</Link>
        <span className="drop">
          <Link href="/services" className={cls("/services")}>Our Services {ChevronIc}</Link>
          <span className="dmenu">
            {services.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`}>{s.title}</Link>
            ))}
          </span>
        </span>
        <span className="drop">
          <a>Resources {ChevronIc}</a>
          <span className="dmenu">
            {RESOURCES.map((r) => (
              <Link key={r.href} href={r.href}>{r.label}</Link>
            ))}
          </span>
        </span>
        <Link href="/insights" className={cls("/insights")}>Insights</Link>
        <Link href="/contact" className={cls("/contact")}>Contact us</Link>
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
          <Link href="/about">About</Link>
          <Link href="/services">Our Services</Link>
          {services.map((s) => (
            <Link key={s.key} href={`/services/${s.key}`} className="sub">{s.title}</Link>
          ))}
          {RESOURCES.map((r) => (
            <Link key={r.href} href={r.href}>{r.label}</Link>
          ))}
          <Link href="/insights">Insights</Link>
          <Link href="/contact">Contact us</Link>
          {clientLogin && <Link href="/login">Client Login</Link>}
        </div>
      )}
    </>
  );
}
