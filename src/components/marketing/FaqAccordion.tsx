"use client";

import { useState } from "react";
import type { Faq } from "@/lib/services/content";

/* Prototype-v2 FAQ: two columns of soft-cream cards, one open at a time,
   clicking the open one closes it. Content comes from SiteContent.faq. */

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const cols: [number, Faq][][] = [[], []];
  faqs.forEach((f, i) => cols[i % 2].push([i, f]));

  return (
    <div className="faq4-grid">
      {cols.map((col, ci) => (
        <div className="faq4-col" key={ci}>
          {col.map(([i, f]) => (
            <div className={`fq4${open === i ? " open" : ""}`} key={i}>
              <button
                type="button"
                className="qh"
                aria-expanded={open === i}
                onClick={() => setOpen((o) => (o === i ? null : i))}
              >
                <span>{f.q}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="qb">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
