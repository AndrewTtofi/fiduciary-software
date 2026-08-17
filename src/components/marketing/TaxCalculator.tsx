"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPARE_COUNTRIES, effectiveRate, DEFAULT_COMPARE } from "@/lib/data/tax-compare";
import { WhatsAppButton } from "@/components/marketing/mk";

/* Effective-tax-rate calculator: Cyprus vs [country] on the same fully
   distributed profit, showing the savings — not just the rate. Pure
   client-side; the Cyprus rates arrive as props from the editable tool
   settings, the comparison figures live in lib/data/tax-compare.ts.

   Cyprus engine: corporate tax on profit, GESY on the distribution capped at
   the GESY income cap, nothing else — a Non-Dom owner pays 0% Special
   Defence Contribution on dividends. Director salary and personal income
   tax are outside the model, and the headline says so.

   Rebuilt per the review: default €200,000 (not €1,000,000), default
   comparison United Kingdom, no IP Box toggle (IP Box is its own tool), and
   a `compact` variant for the homepage hero — slider, country, result, one
   button — with the full breakdown on the dedicated tool page. */

export type CalcRates = {
  corporateTax: number;
  gesyRate: number;
  gesyCap: number;
};

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");
const pct = (n: number) => (n * 100).toFixed(2) + "%";

const THUMB = 52; // px, matches .aslider height

function sliderColor(p: number): string {
  if (p < 40) return "linear-gradient(90deg,#E7C878,#D8B368)";
  if (p < 70) return "linear-gradient(90deg,#D8B368,#C49E54)";
  return "linear-gradient(90deg,#C49E54,#1A273F)";
}

/** Per-character animated number: a changed character remounts its span
 *  (position+char key), replaying the pop-in animation. */
export function AnimNum({ value }: { value: string }) {
  return (
    <span className="animnum">
      {[...value].map((c, i) => (
        <span key={`${i}:${c}`} className="pop">
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

/** Adaptive pill slider (ported from the prototype's AdaptiveSlider). */
export function ASlider({
  id,
  min,
  max,
  step,
  value,
  onChange,
  label,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const f = (value - min) / (max - min);
  return (
    <div className="aslider">
      <div className="dots" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div
        className="fill"
        style={{ width: `calc(${f} * (100% - ${THUMB}px) + ${THUMB}px)`, background: sliderColor(f * 100) }}
      />
      <div className="thumb" style={{ left: `calc(${f} * (100% - ${THUMB}px))` }}>
        <b />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange(Number(e.currentTarget.value))}
        aria-label={label}
      />
    </div>
  );
}

export function TaxCalculator({
  rates,
  compact = false,
  whatsapp = "",
}: {
  rates: CalcRates;
  /** Homepage hero variant: slider, country, result, one button. */
  compact?: boolean;
  whatsapp?: string;
}) {
  const [profit, setProfit] = useState(200_000);
  const [country, setCountry] = useState(DEFAULT_COMPARE);

  const corp = profit * rates.corporateTax;
  const distributed = profit - corp;
  const gesy = Math.min(distributed, rates.gesyCap) * rates.gesyRate;
  const total = corp + gesy;
  const eff = total / profit;

  const cmp = COMPARE_COUNTRIES[country];
  const cmpRate = effectiveRate(cmp);
  const otherCost = profit * cmpRate;
  const keep = otherCost - total;
  const corpPct = Math.round(rates.corporateTax * 1000) / 10;
  const gesyPct = Math.round(rates.gesyRate * 10000) / 100;

  const idp = compact ? "hc" : "tc";

  return (
    <div className={`calc${compact ? " calc-compact" : ""}`}>
      <div className="calc-head">
        <span className="eyebrow">Effective Tax Rate</span>
        <h3>{compact ? "What would your company pay in Cyprus?" : "Your effective tax rate in Cyprus"}</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor={`${idp}-profit`}>
            Annual company profit <span className="val"><AnimNum value={profit.toLocaleString("en-US")} /></span>
          </label>
          <ASlider
            id={`${idp}-profit`}
            min={50_000}
            max={5_000_000}
            step={10_000}
            value={profit}
            onChange={setProfit}
            label="Annual company profit"
          />
        </div>
        <div className="cfield">
          <label htmlFor={`${idp}-country`}>Compare against</label>
          <select id={`${idp}-country`} value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.entries(COMPARE_COUNTRIES).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="result">
          <div className="big"><AnimNum value={(eff * 100).toFixed(2)} /><small>%</small></div>
          <div className="cap">effective tax on distributed profit - Non-Dom resident, no salary drawn</div>
          {!compact && (
            <div className="breakdown">
              <div className="r"><span>Corporate tax ({corpPct}%)</span><span>{eur(corp)}</span></div>
              <div className="r"><span>GESY ({gesyPct}% on the distribution, capped at {eur(rates.gesyCap)})</span><span>{eur(gesy)}</span></div>
              <div className="r total"><span>Total tax</span><span>{eur(total)}</span></div>
            </div>
          )}
          {compact && (
            <div className="crow" style={{ marginTop: 12, color: "var(--mk-grey)" }}>
              <span>{cmp.label} on the same profit</span><b>{pct(cmpRate)}</b>
            </div>
          )}
        </div>

        {compact ? (
          <>
            <div className="keepbox keep-light">
              <div className="kl">You keep</div>
              <div className="keep-val"><AnimNum value={eur(keep)} /></div>
              <div className="kl">more every year than in {cmp.label}</div>
            </div>
            <div className="calc-cta">
              <Link href={"/tools/effective-tax-rate-calculator"} className="pill">See the full breakdown</Link>
            </div>
            <p className="fine">Illustrative estimate, not advice. Excludes director salary and personal income tax.</p>
          </>
        ) : (
          <>
            <div className="tc-compare">
              <div className="crow"><span>{cmp.label}</span><b>{eur(otherCost)} ({pct(cmpRate)})</b></div>
              <div className="bar-track"><div className="bar-fill other" style={{ width: "100%" }}>{cmp.label}</div></div>
              {/* The figure is plain Cyprus corporate tax plus GESY — nothing about
                  it depends on who you engage, so it is labelled "Cyprus", not
                  "Cyprus with us". */}
              <div className="crow" style={{ marginTop: 9 }}><span>Cyprus</span><b>{eur(total)} ({pct(eff)})</b></div>
              <div className="bar-track"><div className="bar-fill cy" style={{ width: `${Math.max(8, (eff / cmpRate) * 100).toFixed(0)}%` }}>Cyprus</div></div>
              <div className="keepbox">
                <div className="kl">You keep</div>
                <div className="keep-val"><AnimNum value={eur(keep)} /></div>
                <div className="kl">more every year</div>
              </div>
              {/* The comparison is a modelled figure, so show how it is built
                  rather than asserting a bare percentage. */}
              <p className="fine mt-3">
                {cmp.label}: {cmp.basis}{" "}
                <a href={cmp.sourceUrl} target="_blank" rel="noreferrer noopener" className="link-gold">Source ↗</a>
              </p>
            </div>

            <div className="calc-cta">
              <Link href="/book" className="pill">Book a Free Consultation</Link>
              <WhatsAppButton number={whatsapp} />
            </div>
            <p className="fine">
              This is an estimate, not advice. The figure is corporate tax plus GESY on the
              distributed profit for a Non-Dom resident who draws no salary. It excludes director
              salary and personal income tax, which change the picture. Non-Dom status can only be
              obtained after Cyprus tax residency is established. GESY is charged at {gesyPct}% on
              dividends, capped at {eur(rates.gesyCap)} of annual income, so it can never exceed{" "}
              {eur(rates.gesyCap * rates.gesyRate)} a year. Your exact position is confirmed on a call.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
