"use client";

import { useState } from "react";
import type { ToolSettings } from "@/lib/data/tax-rates";
import { AnimNum } from "@/components/marketing/TaxCalculator";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 5 — VAT Calculator. Amount, direction (add VAT to a net figure or
   extract it from a gross one), rate. Net, VAT and gross as three figures. */

const eur = (n: number) => "€" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function VatCalc({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const [amount, setAmount] = useState(1_000);
  const [dir, setDir] = useState<"add" | "extract">("add");
  const [rate, setRate] = useState(rates.vatRates[0] ?? 0.19);

  const net = dir === "add" ? amount : amount / (1 + rate);
  const gross = dir === "add" ? amount * (1 + rate) : amount;
  const vat = gross - net;

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">VAT</span>
        <h3>{dir === "add" ? "Add VAT to a net figure" : "Take VAT out of a gross figure"}</h3>
      </div>
      <div className="calc-body">
        <div className="cfield">
          <label htmlFor="vat-amount">
            {dir === "add" ? "Net amount" : "Gross amount"}
            <span className="val">€<input id="vat-amount" className="val-input" type="number" min={0} step={10} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} aria-label="Amount" /></span>
          </label>
          <div className="seg" role="radiogroup" aria-label="Direction">
            <button type="button" role="radio" aria-checked={dir === "add"} className={dir === "add" ? "on" : undefined} onClick={() => setDir("add")}>Add VAT</button>
            <button type="button" role="radio" aria-checked={dir === "extract"} className={dir === "extract" ? "on" : undefined} onClick={() => setDir("extract")}>Remove VAT</button>
          </div>
        </div>
        <div className="cfield">
          <span className="lbl">Rate</span>
          <div className="seg" role="radiogroup" aria-label="VAT rate">
            {rates.vatRates.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={rate === r} className={rate === r ? "on" : undefined} onClick={() => setRate(r)}>
                {Math.round(r * 100)}%
              </button>
            ))}
          </div>
        </div>
        <div className="result">
          <div className="three">
            <div><span className="lbl">Net</span><b><AnimNum value={eur(net)} /></b></div>
            <div><span className="lbl">VAT at {Math.round(rate * 100)}%</span><b><AnimNum value={eur(vat)} /></b></div>
            <div><span className="lbl">Gross</span><b><AnimNum value={eur(gross)} /></b></div>
          </div>
        </div>
        <ResultCta
          answer={<AnimNum value={eur(vat)} />}
          unit=" VAT"
          context="Cyprus applies 19% as the standard rate, 9% and 5% reduced rates and a 0% zero rate. Which one applies, and when you must register, depends on what you sell and to whom."
          whatsapp={whatsapp}
        />
      </div>
    </div>
  );
}
