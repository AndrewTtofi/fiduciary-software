"use client";

import { useState } from "react";
import { fmtPct, type ToolSettings } from "@/lib/data/tax-rates";
import { COMPARE_COUNTRIES, DEFAULT_COMPARE } from "@/lib/data/tax-compare";
import { AnimNum, ASlider } from "@/components/marketing/TaxCalculator";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 3 — Non-Dom Savings Calculator. Annual dividend income and the
   country you are tax resident in now (same fifteen as the effective-rate
   tool). Now: that country's dividend tax rate. Cyprus as a Non-Dom: 0%
   dividend tax, GESY on dividends capped, so never more than the cap ×
   rate. The difference over the life of the status is the largest figure. */

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");

export function NonDomCalc({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const [dividends, setDividends] = useState(100_000);
  const [country, setCountry] = useState(DEFAULT_COMPARE);
  const cmp = COMPARE_COUNTRIES[country];
  const now = dividends * cmp.dividend;
  const gesy = Math.min(dividends, rates.gesy.cap) * rates.gesy.passive;
  const cy = gesy;
  const diff = now - cy;
  const life = diff * rates.nonDomYears;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">Non-Dom savings</span>
        <h3>Dividend tax now, versus Cyprus as a Non-Dom</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="nd-div">
            Annual dividend income <span className="val"><AnimNum value={eur(dividends)} /></span>
          </label>
          <ASlider id="nd-div" min={10_000} max={2_000_000} step={5_000} value={dividends} onChange={setDividends} label="Annual dividend income" />
        </div>
        <div className="cfield">
          <label htmlFor="nd-country">Country where you are tax resident now</label>
          <select id="nd-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.entries(COMPARE_COUNTRIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
        </div>

        <div className="result">
          <div className="big"><AnimNum value={eur(life)} /></div>
          <div className="cap">the difference over {rates.nonDomYears} years of Non-Dom status</div>
          <div className="breakdown">
            <div className="r"><span>What you pay now in {cmp.label} ({fmtPct(cmp.dividend)} on dividends)</span><span>{eur(now)}</span></div>
            <div className="r"><span>What you would pay in Cyprus (0% dividend tax + GESY {fmtPct(rates.gesy.passive)}, capped at {eur(rates.gesy.cap)})</span><span>{eur(cy)}</span></div>
            <div className="r total"><span>Annual difference</span><span>{eur(diff)}</span></div>
          </div>
          <p className="fine mt-3">
            {cmp.label}: {cmp.basis}{" "}
            <a href={cmp.sourceUrl} target="_blank" rel="noreferrer noopener" className="link-gold">Source ↗</a>
          </p>
        </div>

        <ResultCta
          answer={<AnimNum value={eur(diff)} />}
          unit=" a year"
          context={`Non-Dom status can only be obtained once Cyprus tax residency is established - residency first, then Non-Dom. GESY on dividends can never exceed ${eur(rates.gesy.cap * rates.gesy.passive)} a year.`}
          whatsapp={whatsapp}
        />
      </div>
    </div>
  );
}
