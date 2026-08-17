"use client";

import { useState } from "react";
import { incomeTax, type ToolSettings, fmtPct } from "@/lib/data/tax-rates";
import { AnimNum } from "@/components/marketing/TaxCalculator";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 2 — Salary Calculator. Gross salary (monthly or annual) with an
   employee / employer switch. Employee view: net monthly pay with income
   tax, social insurance and GESY itemised. Employer view: total cost to the
   company, monthly and annual, itemised — the number a company hiring a
   third-country national needs before it commits. Contributions based on
   insurable earnings respect the annual ceiling; GESY respects its cap. */

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");

export function SalaryCalc({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const [amount, setAmount] = useState(3_000);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [view, setView] = useState<"employee" | "employer">("employee");

  const annual = period === "monthly" ? amount * 12 : amount;
  const insurable = Math.min(annual, rates.socialInsurance.ceiling);
  const gesyBase = Math.min(annual, rates.gesy.cap);

  // Employee
  const tax = incomeTax(annual, rates.incomeTaxBands).total;
  const siEmp = insurable * rates.socialInsurance.employee;
  const gesyEmp = gesyBase * rates.gesy.employee;
  const netAnnual = annual - tax - siEmp - gesyEmp;

  // Employer
  const siEr = insurable * rates.socialInsurance.employer;
  const gesyEr = gesyBase * rates.gesy.employer;
  const cohesion = annual * rates.employerFunds.socialCohesion;
  const redundancy = insurable * rates.employerFunds.redundancy;
  const hrda = insurable * rates.employerFunds.hrda;
  const onCost = siEr + gesyEr + cohesion + redundancy + hrda;
  const totalCost = annual + onCost;
  const onCostPct = rates.socialInsurance.employer + rates.gesy.employer + rates.employerFunds.socialCohesion + rates.employerFunds.redundancy + rates.employerFunds.hrda;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">Salary {rates.taxYear}</span>
        <h3>{view === "employee" ? "What the employee takes home" : "What the salary costs the company"}</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="sc-amount">
            Gross salary
            <span className="val">
              €<input id="sc-amount" className="val-input" type="number" min={0} step={100} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} aria-label="Gross salary" />
            </span>
          </label>
          <div className="seg" role="radiogroup" aria-label="Salary period">
            <button type="button" role="radio" aria-checked={period === "monthly"} className={period === "monthly" ? "on" : undefined} onClick={() => setPeriod("monthly")}>Per month</button>
            <button type="button" role="radio" aria-checked={period === "annual"} className={period === "annual" ? "on" : undefined} onClick={() => setPeriod("annual")}>Per year</button>
          </div>
        </div>
        <div className="cfield">
          <span className="lbl">Show me the</span>
          <div className="seg" role="radiogroup" aria-label="View">
            <button type="button" role="radio" aria-checked={view === "employee"} className={view === "employee" ? "on" : undefined} onClick={() => setView("employee")}>Employee view</button>
            <button type="button" role="radio" aria-checked={view === "employer"} className={view === "employer" ? "on" : undefined} onClick={() => setView("employer")}>Employer view</button>
          </div>
        </div>

        {view === "employee" ? (
          <>
            <div className="result">
              <div className="big"><AnimNum value={eur(netAnnual / 12)} /></div>
              <div className="cap">net pay per month ({eur(netAnnual)} a year)</div>
              <div className="breakdown">
                <div className="r"><span>Gross salary</span><span>{eur(annual)} / yr</span></div>
                <div className="r"><span>Income tax</span><span>− {eur(tax)}</span></div>
                <div className="r"><span>Social insurance ({fmtPct(rates.socialInsurance.employee)})</span><span>− {eur(siEmp)}</span></div>
                <div className="r"><span>GESY ({fmtPct(rates.gesy.employee)})</span><span>− {eur(gesyEmp)}</span></div>
                <div className="r total"><span>Net for the year</span><span>{eur(netAnnual)}</span></div>
              </div>
            </div>
            <ResultCta
              answer={<AnimNum value={((tax + siEmp + gesyEmp) / Math.max(annual, 1) * 100).toFixed(1)} />}
              unit="% total deductions"
              context={`Deductions are ${fmtPct(rates.socialInsurance.employee + rates.gesy.employee)} for social insurance and GESY, plus income tax on the bands. Relocation exemptions for new residents can lower the tax line substantially.`}
              whatsapp={whatsapp}
            />
          </>
        ) : (
          <>
            <div className="result">
              <div className="big"><AnimNum value={eur(totalCost / 12)} /></div>
              <div className="cap">total cost to the company per month ({eur(totalCost)} a year)</div>
              <div className="breakdown">
                <div className="r"><span>Gross salary</span><span>{eur(annual)} / yr</span></div>
                <div className="r"><span>Social insurance ({fmtPct(rates.socialInsurance.employer)})</span><span>{eur(siEr)}</span></div>
                <div className="r"><span>GESY ({fmtPct(rates.gesy.employer)})</span><span>{eur(gesyEr)}</span></div>
                <div className="r"><span>Social Cohesion Fund ({fmtPct(rates.employerFunds.socialCohesion)})</span><span>{eur(cohesion)}</span></div>
                <div className="r"><span>Redundancy Fund ({fmtPct(rates.employerFunds.redundancy)})</span><span>{eur(redundancy)}</span></div>
                <div className="r"><span>Human Resource Development Authority ({fmtPct(rates.employerFunds.hrda)})</span><span>{eur(hrda)}</span></div>
                <div className="r total"><span>Total cost for the year</span><span>{eur(totalCost)}</span></div>
              </div>
            </div>
            <ResultCta
              answer={<>gross + <AnimNum value={(onCost / Math.max(annual, 1) * 100).toFixed(1)} /></>}
              unit="% employer contributions"
              context={`Employer contributions add roughly ${fmtPct(onCostPct)} above gross salary (less once the insurable-earnings ceiling of ${eur(rates.socialInsurance.ceiling)} is reached). This is the figure to budget before making an offer, especially for a permit-based hire.`}
              whatsapp={whatsapp}
            />
          </>
        )}
      </div>
    </div>
  );
}
