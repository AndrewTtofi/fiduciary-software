"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMPARE_COUNTRIES,
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
   effective 15.48%. */

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");
const pct = (n: number) => (n * 100).toFixed(2) + "%";

export function TaxCalculator({ brandName }: { brandName?: string }) {
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
  const otherCost = profit * cmp.rate;
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
            Annual company profit <span className="val">{profit.toLocaleString("en-US")}</span>
          </label>
          <input
            id="tc-profit"
            type="range"
            min={50_000}
            max={5_000_000}
            step={10_000}
            value={profit}
            onInput={(e) => setProfit(Number(e.currentTarget.value))}
            aria-label="Annual company profit"
            aria-valuetext={eur(profit)}
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
                Share of profit from qualifying IP <span className="val">{ipShare}%</span>
              </label>
              <input
                id="tc-ipshare"
                type="range"
                min={0}
                max={100}
                step={5}
                value={ipShare}
                onInput={(e) => setIpShare(Number(e.currentTarget.value))}
                aria-label="Share of profit from qualifying IP"
                aria-valuetext={`${ipShare}%`}
              />
            </div>
          )}
        </div>

        <div className="result">
          <div className="big">{(eff * 100).toFixed(2)}<small>%</small></div>
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
          <div className="row"><span>{cmp.label}</span><span>{eur(otherCost)} ({pct(cmp.rate)})</span></div>
          <div className="bar-track"><div className="bar-fill other" style={{ width: "100%" }}>{cmp.label}</div></div>
          <div className="row"><span>Cyprus with {brandName ?? "us"}</span><span>{eur(total)} ({pct(eff)})</span></div>
          <div className="bar-track"><div className="bar-fill cy" style={{ width: `${Math.max(8, (eff / cmp.rate) * 100).toFixed(0)}%` }}>Cyprus</div></div>
          <div className="keep">You keep <b>{eur(keep)}</b> more every year</div>
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
