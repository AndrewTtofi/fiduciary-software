"use client";

import { useState } from "react";
import { incomeTax, type ToolSettings, fmtPct } from "@/lib/data/tax-rates";
import { AnimNum, ASlider } from "@/components/marketing/TaxCalculator";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 1 — Personal Income Tax Calculator. Bands applied progressively;
   employed: social insurance capped at the insurable-earnings ceiling plus
   GESY; self-employed: the higher SI rate on insurable earnings plus the
   self-employed GESY rate. Output: income tax, band-by-band, SI and GESY as
   separate lines, net income, effective rate. */

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");

export function IncomeTaxCalc({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const [income, setIncome] = useState(45_000);
  const [mode, setMode] = useState<"employed" | "self">("employed");

  const tax = incomeTax(income, rates.incomeTaxBands);
  const siRate = mode === "employed" ? rates.socialInsurance.employee : rates.socialInsurance.selfEmployed;
  const si = Math.min(income, rates.socialInsurance.ceiling) * siRate;
  const gesyRate = mode === "employed" ? rates.gesy.employee : rates.gesy.selfEmployed;
  const gesy = Math.min(income, rates.gesy.cap) * gesyRate;
  const net = income - tax.total - si - gesy;
  const eff = income > 0 ? (tax.total + si + gesy) / income : 0;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">Personal income tax {rates.taxYear}</span>
        <h3>Your income tax, band by band</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="it-income">
            Annual income
            <span className="val">
              €<input
                className="val-input"
                type="number"
                min={0}
                step={500}
                value={income}
                onChange={(e) => setIncome(Math.max(0, Math.min(2_000_000, Number(e.target.value) || 0)))}
                aria-label="Annual income, typed"
              />
            </span>
          </label>
          <ASlider id="it-income" min={0} max={300_000} step={1_000} value={Math.min(income, 300_000)} onChange={setIncome} label="Annual income" />
        </div>
        <div className="cfield">
          <span className="lbl">I am</span>
          <div className="seg" role="radiogroup">
            <button type="button" role="radio" aria-checked={mode === "employed"} className={mode === "employed" ? "on" : undefined} onClick={() => setMode("employed")}>Employed</button>
            <button type="button" role="radio" aria-checked={mode === "self"} className={mode === "self" ? "on" : undefined} onClick={() => setMode("self")}>Self-employed</button>
          </div>
        </div>

        <div className="result">
          <div className="big"><AnimNum value={eur(tax.total)} /></div>
          <div className="cap">income tax due for the year</div>
          <div className="breakdown">
            {tax.rows.map((r, i) => (
              <div className="r" key={i}>
                <span>
                  {r.to === null ? `Above ${eur(r.from)}` : `${eur(r.from)} to ${eur(r.to)}`} at {fmtPct(r.rate)}
                  {r.amount > 0 && r.rate > 0 ? ` (on ${eur(r.amount)})` : ""}
                </span>
                <span>{eur(r.tax)}</span>
              </div>
            ))}
            <div className="r"><span>Social insurance ({fmtPct(siRate)}{income > rates.socialInsurance.ceiling ? `, capped at ${eur(rates.socialInsurance.ceiling)}` : ""})</span><span>{eur(si)}</span></div>
            <div className="r"><span>GESY ({fmtPct(gesyRate)}{income > rates.gesy.cap ? `, capped at ${eur(rates.gesy.cap)}` : ""})</span><span>{eur(gesy)}</span></div>
            <div className="r total"><span>Net income after everything</span><span>{eur(net)}</span></div>
          </div>
        </div>

        <ResultCta
          answer={<AnimNum value={(eff * 100).toFixed(1)} />}
          unit="% effective rate on gross"
          context={`On ${eur(income)} a year you keep about ${eur(net)} after income tax, social insurance and GESY. Allowances, pension contributions and the 50% relocation exemption can change this.`}
          whatsapp={whatsapp}
        />
      </div>
    </div>
  );
}
