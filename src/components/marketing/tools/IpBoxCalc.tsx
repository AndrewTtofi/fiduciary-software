"use client";

import { useState } from "react";
import type { ToolSettings } from "@/lib/data/tax-rates";
import { AnimNum, ASlider } from "@/components/marketing/TaxCalculator";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 6 — IP Box Calculator. Annual qualifying IP income and the nexus
   ratio. Without IP Box: income × corporate rate. With: the qualifying
   portion (income × nexus) has 80% exempt and 20% taxed at the corporate
   rate; the non-qualifying portion is taxed in full. Effective rate ~3% at
   full nexus. The 2.5% figure is out of date and never appears. */

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");

export function IpBoxCalc({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const [income, setIncome] = useState(500_000);
  const [nexus, setNexus] = useState(100);

  const without = income * rates.corporateTax;
  const qualifying = income * (nexus / 100);
  const withBox = qualifying * (1 - rates.ipBoxExemption) * rates.corporateTax + (income - qualifying) * rates.corporateTax;
  const saving = without - withBox;
  const eff = income > 0 ? withBox / income : 0;
  const fullNexusRate = (1 - rates.ipBoxExemption) * rates.corporateTax;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">IP Box</span>
        <h3>Tax with and without the IP Box regime</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="ip-income">Annual qualifying IP income <span className="val"><AnimNum value={eur(income)} /></span></label>
          <ASlider id="ip-income" min={50_000} max={5_000_000} step={10_000} value={income} onChange={setIncome} label="Annual qualifying IP income" />
        </div>
        <div className="cfield">
          <label htmlFor="ip-nexus">Nexus ratio <span className="val"><AnimNum value={`${nexus}%`} /></span></label>
          <ASlider id="ip-nexus" min={0} max={100} step={5} value={nexus} onChange={setNexus} label="Nexus ratio" />
          <p className="fine" style={{ marginTop: 8 }}>
            The nexus ratio is, roughly, the share of the research and development behind the IP that
            your company did itself (or paid unrelated parties to do). Buying IP in from a related
            party collapses the benefit.
          </p>
        </div>
        <div className="result">
          <div className="big"><AnimNum value={eur(saving)} /></div>
          <div className="cap">saved a year, compared with paying the full corporate rate</div>
          <div className="breakdown">
            <div className="r"><span>Tax without IP Box ({Math.round(rates.corporateTax * 100)}%)</span><span>{eur(without)}</span></div>
            <div className="r"><span>Tax with IP Box ({Math.round(rates.ipBoxExemption * 100)}% of the qualifying portion exempt)</span><span>{eur(withBox)}</span></div>
            <div className="r total"><span>Effective rate</span><span>{(eff * 100).toFixed(1)}%</span></div>
          </div>
        </div>
        <ResultCta
          answer={<AnimNum value={(eff * 100).toFixed(1)} />}
          unit="% effective rate"
          context={`Approximately ${(fullNexusRate * 100).toFixed(0)}% at full nexus - the ${Math.round(rates.ipBoxExemption * 100)}% exemption applied to the ${Math.round(rates.corporateTax * 100)}% corporate rate. The rate depends on the nexus calculation and is not automatic; a tax ruling from the Cyprus Tax Department is normally obtained before relying on the regime.`}
          whatsapp={whatsapp}
        />
      </div>
    </div>
  );
}
