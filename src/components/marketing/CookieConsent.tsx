"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent";

/** Build-time analytics IDs; either may be absent. Consent is recorded even
 *  when no pixel is configured, so enabling one later respects prior choices. */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
  }
}

/** Inject GA4 + Meta pixel. Called only after explicit consent — the site and
 *  every tool on it work fully without these. */
function loadPixels() {
  if (GA4_ID && !document.getElementById("ga4-src")) {
    const s = document.createElement("script");
    s.id = "ga4-src";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: unknown[]) => window.dataLayer!.push(args);
    gtag("js", new Date());
    gtag("config", GA4_ID);
  }
  if (META_PIXEL_ID && !window.fbq) {
    const fbq: NonNullable<Window["fbq"]> = (...args: unknown[]) => {
      fbq.queue!.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    window.fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
}

/** GDPR cookie-consent banner. Analytics and marketing pixels load only after
 *  an explicit accept; a decline is remembered and nothing loads. The choice
 *  persists in localStorage so the banner shows once per browser. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let choice: string | null = null;
    try {
      choice = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable (e.g. some in-app browsers): show nothing rather than nag every visit */
      return;
    }
    if (choice === "accept") {
      loadPixels();
      return;
    }
    if (choice === "decline") return;
    // No stored choice: reveal after a beat so the banner doesn't compete
    // with the page's first paint.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  function choose(accept: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, accept ? "accept" : "decline");
    } catch {
      /* best effort */
    }
    setVisible(false);
    if (accept) loadPixels();
  }

  if (!visible) return null;

  return (
    <div className="cookie-bar" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use cookies for analytics and to improve your experience. Analytics and marketing
        pixels only load after you accept. Everything on the site works either way.
      </p>
      <div className="row">
        <button className="pill sm" onClick={() => choose(true)}>Accept</button>
        <button className="pill ghost sm" onClick={() => choose(false)}>Decline</button>
      </div>
    </div>
  );
}
