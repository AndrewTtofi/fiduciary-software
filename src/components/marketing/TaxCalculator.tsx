"use client";

import { useState } from "react";
import Link from "next/link";

/* Effective-tax-rate calculator modelled on the tax.one homepage widget:
   a country segment (Cyprus / UAE), an annual-profit slider, an IP Box
   switch and a line-item breakdown. Rates are illustrative:
   — Cyprus: 15% CIT (3% under the IP Box regime) + 2.65% GESY on deemed
     dividends, with the GESY base capped at €180,000.
   — UAE: 0% under Small Business Relief up to AED 3M revenue; otherwise
     0% on the first AED 375,000 and 9% above it. */

const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const aed = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 });

const COUNTRIES = [
  { key: "cyprus", label: "🇨🇾 Cyprus" },
  { key: "uae", label: "🇦🇪 UAE" },
] as const;

type CountryKey = (typeof COUNTRIES)[number]["key"];

const GESY_CAP = 180_000;
const GESY_RATE = 0.0265;
const UAE_SBR_LIMIT = 3_000_000;
const UAE_FREE_BAND = 375_000;

export function TaxCalculator() {
  const [cyProfit, setCyProfit] = useState(1_000_000);
  const [uaeRevenue, setUaeRevenue] = useState(3_000_000);
  const [country, setCountry] = useState<CountryKey>("cyprus");
  const [ipBox, setIpBox] = useState(false);

  const isCy = country === "cyprus";

  const cyCorpTax = cyProfit * (ipBox ? 0.03 : 0.15);
  const cyGesy = GESY_RATE * Math.min(cyProfit, GESY_CAP);
  const cy = {
    corporateTax: cyCorpTax,
    gesy: cyGesy,
    totalTax: cyCorpTax + cyGesy,
    effectiveRate: cyProfit > 0 ? ((cyCorpTax + cyGesy) / cyProfit) * 100 : 0,
  };

  const sbrApplies = uaeRevenue <= UAE_SBR_LIMIT;
  const uaeCorpTax = sbrApplies ? 0 : 0.09 * Math.max(0, uaeRevenue - UAE_FREE_BAND);
  const uae = {
    corporateTax: uaeCorpTax,
    totalTax: uaeCorpTax,
    effectiveRate: uaeRevenue > 0 ? (uaeCorpTax / uaeRevenue) * 100 : 0,
  };

  const result = isCy ? cy : uae;
  const max = isCy ? 1_000_000 : 5_000_000;
  const value = isCy ? cyProfit : uaeRevenue;
  const setValue = isCy ? setCyProfit : setUaeRevenue;
  const sliderLabel = isCy ? "Annual profit" : "Annual revenue";
  const fmt = isCy ? (n: number) => eur.format(n) : (n: number) => aed.format(n);

  return (
    <div className="card card-pad-lg taxcalc">
      <div className="taxcalc-seg" role="radiogroup" aria-label="Country">
        <span aria-hidden className={`taxcalc-seg-thumb${isCy ? "" : " right"}`} />
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={country === c.key}
            className={country === c.key ? "on" : undefined}
            onClick={() => setCountry(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <h3 className="taxcalc-title">Your effective tax rate in {isCy ? "Cyprus" : "the UAE"}</h3>
      <p className="taxcalc-rate">
        <span className="mono">{result.effectiveRate.toFixed(2)}%</span>
        {!isCy && <span className="taxcalc-badge">{sbrApplies ? "SBR" : "Standard rate"}</span>}
      </p>

      <div className="taxcalc-input">
        <div className="taxcalc-row">
          <span className="lbl">{sliderLabel}</span>
          <span className="num mono">{fmt(value)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={isCy ? 5_000 : 50_000}
          value={value}
          onInput={(e) => setValue(Number(e.currentTarget.value))}
          aria-label={sliderLabel}
          aria-valuetext={fmt(value)}
          style={{ "--fill": `${(value / max) * 100}%` } as React.CSSProperties}
          className="taxcalc-slider"
        />
        <p className="taxcalc-note">
          {isCy
            ? "GESY is capped at €180,000, so the more you earn, the lower your effective rate."
            : sbrApplies
              ? "With Small Business Relief (SBR) your corporate tax is 0% up to AED 3M revenue. Income tax in the UAE is always 0%."
              : "Above AED 3M, SBR no longer applies. Standard corporate tax kicks in: 0% on the first AED 375,000, 9% above. Income tax is always 0%."}
        </p>
      </div>

      <ul className="taxcalc-lines">
        {isCy ? (
          <>
            <li className="taxcalc-row">
              <span className="lbl">Corporate tax ({ipBox ? "3%" : "15%"})</span>
              <span className="num mono">{eur.format(cy.corporateTax)}</span>
            </li>
            <li className="taxcalc-row">
              <span className="lbl">IP Box Regime</span>
              <button
                type="button"
                role="switch"
                aria-checked={ipBox}
                aria-label="IP Box Regime"
                className={`taxcalc-switch${ipBox ? " on" : ""}`}
                onClick={() => setIpBox((v) => !v)}
              >
                <span aria-hidden />
              </button>
            </li>
            <li className="taxcalc-row">
              <span className="lbl">GESY (2.65%)</span>
              <span className="num mono">{eur.format(cy.gesy)}</span>
            </li>
          </>
        ) : (
          <>
            {sbrApplies ? (
              <li className="taxcalc-row">
                <span className="lbl">Corporate tax (0% with Small Business Relief)</span>
                <span className="num mono">{aed.format(0)}</span>
              </li>
            ) : (
              <>
                <li className="taxcalc-row">
                  <span className="lbl">First AED 375,000 (0%)</span>
                  <span className="num mono">{aed.format(0)}</span>
                </li>
                <li className="taxcalc-row">
                  <span className="lbl">Above AED 375,000 (9%)</span>
                  <span className="num mono">{aed.format(uae.corporateTax)}</span>
                </li>
              </>
            )}
            <li className="taxcalc-row">
              <span className="lbl">Income tax (0%)</span>
              <span className="num mono">{aed.format(0)}</span>
            </li>
          </>
        )}
        <li className="taxcalc-row total">
          <span>Total tax</span>
          <span className="num mono">{fmt(result.totalTax)}</span>
        </li>
      </ul>

      <Link href="/contact" className="btn btn-primary btn-block mt-6">
        Book a Consultation
      </Link>
      <p className="taxcalc-fine">
        {isCy ? "Illustrative estimate." : "Assumes taxable profit ≈ revenue. Illustrative estimate."}
      </p>
    </div>
  );
}
