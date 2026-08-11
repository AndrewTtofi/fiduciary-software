"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMPARE_COUNTRIES,
  effectiveRate,
  DEFAULT_COMPARE,
  CY_CORPORATE_RATE,
  CY_IP_BOX_EFFECTIVE_RATE,
  CY_GESY_RATE,
  CY_GESY_CAP,
} from "@/lib/data/tax-compare";

/* Effective-tax-rate calculator, leading with the country comparison:
   Cyprus vs [country] on the same fully distributed profit, showing the
   savings — not just the rate. Pure client-side; comparison figures live
   in lib/data/tax-compare.ts (config, not code).

   Cyprus engine (2026 rules): 15% corporate tax, 2.5% effective on
   qualifying IP under the IP Box regime, 2.65% GESY capped at €180,000.
   Verified: €1,000,000 profit, IP off → €150,000 + €4,770 = €154,770,
   effective 15.48%.

   Prototype-v2 UI: adaptive pill sliders (fill + thumb smoothed by CSS
   transitions, colour shifting with the position) and per-character
   animated figures — only changed digits re-animate. */

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
function AnimNum({ value }: { value: string }) {
  return (
    <span className="animnum">
      {[...value].map((c, i) => (
        <span key={`${i}:${c}`} className="pop">
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

/** Adaptive pill slider (ported from the prototype's AdaptiveSlider). */
function ASlider({
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

export function TaxCalculator({}: {
  /** Accepted but unused: the comparison is plain Cyprus tax, not a
   *  firm-specific outcome. Kept so the two call sites need no change. */
  brandName?: string;
}) {
  const [profit, setProfit] = useState(1_000_000);
  const [country, setCountry] = useState(DEFAULT_COMPARE);
  const [ipOn, setIpOn] = useState(false);
  const [ipShare, setIpShare] = useState(100);

  const share = ipOn ? ipShare / 100 : 0;
  const ipProfit = profit * share;
  const stdProfit = profit - ipProfit;
  const corp = stdProfit * CY_CORPORATE_RATE + ipProfit * CY_IP_BOX_EFFECTIVE_RATE;
  const gesy = Math.min(profit, CY_GESY_CAP) * CY_GESY_RATE;
  const total = corp + gesy;
  const eff = total / profit;

  const cmp = COMPARE_COUNTRIES[country];
  const cmpRate = effectiveRate(cmp);
  const otherCost = profit * cmpRate;
  const keep = otherCost - total;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">Effective Tax Rate</span>
        <h3>Your effective tax rate in Cyprus</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="tc-profit">
            Annual company profit <span className="val"><AnimNum value={profit.toLocaleString("en-US")} /></span>
          </label>
          <ASlider
            id="tc-profit"
            min={50_000}
            max={5_000_000}
            step={10_000}
            value={profit}
            onChange={setProfit}
            label="Annual company profit"
          />
        </div>
        <div className="cfield">
          <label htmlFor="tc-country">Compare against</label>
          <select id="tc-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.entries(COMPARE_COUNTRIES).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="cfield">
          <label className="toggle">
            <input
              type="checkbox"
              checked={ipOn}
              onChange={(e) => setIpOn(e.target.checked)}
            />
            <span className="switch" aria-hidden />
            <span>Include IP Box regime</span>
          </label>
          {ipOn && (
            <div style={{ marginTop: 12 }}>
              <label htmlFor="tc-ipshare" style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", fontWeight: 600, marginBottom: 8 }}>
                Share of profit from qualifying IP <span className="val"><AnimNum value={`${ipShare}%`} /></span>
              </label>
              <ASlider
                id="tc-ipshare"
                min={0}
                max={100}
                step={5}
                value={ipShare}
                onChange={setIpShare}
                label="Share of profit from qualifying IP"
              />
            </div>
          )}
        </div>

        <div className="result">
          <div className="big"><AnimNum value={(eff * 100).toFixed(2)} /><small>%</small></div>
          <div className="cap">effective tax on fully distributed profit</div>
          <div className="breakdown">
            {ipOn ? (
              <>
                <div className="r"><span>Corporate tax (15% on {eur(stdProfit)})</span><span>{eur(stdProfit * CY_CORPORATE_RATE)}</span></div>
                <div className="r"><span>IP Box (2.5% on {eur(ipProfit)})</span><span>{eur(ipProfit * CY_IP_BOX_EFFECTIVE_RATE)}</span></div>
              </>
            ) : (
              <div className="r"><span>Corporate tax (15%)</span><span>{eur(corp)}</span></div>
            )}
            <div className="r"><span>GESY (2.65%, capped)</span><span>{eur(gesy)}</span></div>
            <div className="r total"><span>Total tax</span><span>{eur(total)}</span></div>
          </div>
        </div>

        <div className="tc-compare">
          <div className="crow"><span>{cmp.label}</span><b>{eur(otherCost)} ({pct(cmpRate)})</b></div>
          <div className="bar-track"><div className="bar-fill other" style={{ width: "100%" }}>{cmp.label}</div></div>
          {/* Was "Cyprus with {brandName}". Two problems: with the neutral
              white-label default it read "Cyprus with the platform", and more
              importantly the figure is plain Cyprus corporate tax plus GESY —
              nothing about it depends on who you engage. Implying the firm
              changes the tax outcome is a claim the maths does not support. */}
          <div className="crow" style={{ marginTop: 9 }}><span>Cyprus</span><b>{eur(total)} ({pct(eff)})</b></div>
          <div className="bar-track"><div className="bar-fill cy" style={{ width: `${Math.max(8, (eff / cmpRate) * 100).toFixed(0)}%` }}>Cyprus</div></div>
          <div className="keepbox">
            <div className="kl">You keep</div>
            <div className="kv"><AnimNum value={eur(keep)} /></div>
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
          <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
        </div>
        <p className="fine">
          GESY (General Healthcare System) is Cyprus&apos;s national health contribution, charged at
          2.65% on dividends for Non-Dom residents. It is capped at €180,000 of annual income,
          meaning a maximum contribution of €4,770 per year. The more you earn above the cap, the
          lower your effective rate becomes.
        </p>
        <p className="fine">
          Illustrative estimate based on 2026 Cyprus tax rules. Your exact rate depends on your
          structure, residency, and income type. Your final structure is confirmed on a call.
        </p>
      </div>
    </div>
  );
}
