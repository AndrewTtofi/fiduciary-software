"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronIc } from "@/components/marketing/mk";

export type NavService = { key: string; title: string };
export type NavTool = { slug: string; name: string };

/** Desktop nav links + mobile hamburger panel. The bar is site navigation,
 *  not a list of services: Services · Tools · Insights · About · Contact,
 *  with the service pages inside the Services dropdown and the ten tools
 *  inside Tools. Client-side so the active link and the mobile toggle work;
 *  branding stays in the server-rendered header.
 *
 *  Dropdown behaviour (kept from the previous build, per the review):
 *  hovering opens the list, clicking an item opens that page, clicking the
 *  label itself opens the landing page. State-controlled (not CSS :hover) so
 *  menus close as soon as a destination is picked. */
export function HeaderNav({
  services,
  tools,
  clientLogin,
}: {
  services: NavService[];
  tools: NavTool[];
  clientLogin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState<"services" | "tools" | null>(null);

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
        {/* A deployment with every tool switched off hides the section entirely. */}
        {tools.length > 0 && (
          <span
            className="drop"
            onMouseEnter={() => setDrop("tools")}
            onMouseLeave={() => setDrop((d) => (d === "tools" ? null : d))}
          >
            <Link href="/tools" className={cls("/tools")} onClick={close}>Tools {ChevronIc}</Link>
            {drop === "tools" && (
              <span className="dmenu">
                {tools.map((t) => (
                  <Link key={t.slug} href={`/tools/${t.slug}`} onClick={close}>{t.name}</Link>
                ))}
              </span>
            )}
          </span>
        )}
        <Link href="/insights" className={cls("/insights")}>Insights</Link>
        <Link href="/about" className={cls("/about")}>About</Link>
        <Link href="/contact" className={cls("/contact")}>Contact</Link>
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
          {tools.length > 0 && <Link href="/tools">Tools</Link>}
          {tools.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="sub">{t.name}</Link>
          ))}
          <Link href="/insights">Insights</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          {clientLogin && <Link href="/login">Client Login</Link>}
          <Link href="/book" className="mnav-cta">Book a Free Consultation</Link>
        </div>
      )}
    </>
  );
}
