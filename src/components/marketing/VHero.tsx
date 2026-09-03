"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Stat } from "@/lib/services/content";
import { TaxCalculator, type CalcRates } from "@/components/marketing/TaxCalculator";
import { WhatsAppButton } from "@/components/marketing/mk";

/* Full-height home hero: per-character headline reveal, staggered fades,
   the compact tax calculator on the right (so the visitor has something to
   engage with immediately instead of a blank half), and a stats rail of
   three equal figures on one baseline with the registration line beneath.
   Content-managed copy comes in via props using the usual conventions
   ("\n" line breaks, *gold* spans). Rendered as a client component so the
   character spans are produced deterministically on both server and client
   (hydration-safe); the entrance simply adds .go classes after mount. */

const CH_DELAY = 26; // ms per character

function chars(text: string, offset: number, gold: boolean, keyBase: string): { nodes: ReactNode[]; count: number } {
  let i = 0;
  const nodes = text.split(" ").map((word, wi) => {
    const inner = [...word].map((c, ci) => (
      <span key={ci} className={`ch${gold ? " gold" : ""}`} style={{ transitionDelay: `${(offset + i++) * CH_DELAY}ms` }}>
        {c}
      </span>
    ));
    i++; // breathe between words, like the prototype
    // The space must live OUTSIDE the inline-block word span — a trailing
    // space inside an inline-block is collapsed and the words run together.
    return (
      <span key={`${keyBase}-${wi}`}>
        <span className="wd">{inner}</span>{" "}
      </span>
    );
  });
  return { nodes, count: i };
}

function splitHeadline(headline: string): ReactNode[] {
  let offset = 0;
  return headline.split("\n").map((line, li) => {
    const parts = line.split(/\*([^*]+)\*/g).map((seg, si) => {
      if (!seg) return null;
      const { nodes, count } = chars(seg, offset, si % 2 === 1, `l${li}s${si}`);
      offset += count;
      return <span key={si}>{nodes}</span>;
    });
    return (
      <span key={li}>
        {parts}
        {li < headline.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export function VHero({
  eyebrow,
  headline,
  sub,
  primaryCta,
  stats,
  registration,
  whatsapp,
  rates,
  calcBreakdown = true,
}: {
  eyebrow: string;
  headline: string;
  sub: string;
  primaryCta: string;
  stats: Stat[];
  /** "Legal Name · HE 123456 · Nicosia, Cyprus" — small and discreet under the stats. */
  registration: string;
  whatsapp: string;
  rates: CalcRates;
  /** Whether the effective-rate tool page is enabled on this deployment. */
  calcBreakdown?: boolean;
}) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 120), // eyebrow
      setTimeout(() => setPhase(2), 200), // headline characters
      setTimeout(() => setPhase(3), 800), // sub
      setTimeout(() => setPhase(4), 1100), // buttons + calculator
      setTimeout(() => setPhase(5), 1350), // rail
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <section className="vhero" id="vhero">
      <div className="vh-in vh-pad">
        <div className="vh-main">
          <div className="vh-copy">
            <span className={`kicker vh-fade${phase >= 1 ? " go" : ""}`}>{eyebrow}</span>
            <h1 className={`vh-h1${phase >= 2 ? " go" : ""}`}>{splitHeadline(headline)}</h1>
            <p className={`vh-sub vh-fade${phase >= 3 ? " go" : ""}`}>{sub}</p>
            <div className={`vh-btns vh-fade${phase >= 4 ? " go" : ""}`}>
              <Link href="/book" className="pill">{primaryCta}</Link>
              <WhatsAppButton number={whatsapp} />
            </div>
          </div>
          <div className={`vh-calc vh-fade${phase >= 4 ? " go" : ""}`}>
            <TaxCalculator rates={rates} compact breakdown={calcBreakdown} />
          </div>
        </div>
        <div className={`vh-rail vh-fade${phase >= 5 ? " go" : ""}`}>
          <div className="vh-stats">
            {stats.map((s, i) => (
              <div className="vh-stat" key={i}>
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
          {registration && <div className="vh-reg">{registration}</div>}
        </div>
      </div>
    </section>
  );
}
