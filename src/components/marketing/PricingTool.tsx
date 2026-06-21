"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

type Plan = {
  tier: string;
  name: string;
  monthly: number;
  feat?: boolean;
  features: [boolean, string][];
};

const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    monthly: 550,
    features: [
      [true, "Lead-qualification gate"],
      [true, "Standard intake forms"],
      [true, "Client dashboard"],
      [true, "2 admin logins"],
      [false, "Partner portal"],
      [false, "White-label branding"],
      [false, "AML screening"],
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    monthly: 1100,
    feat: true,
    features: [
      [true, "Everything in Starter"],
      [true, "Dynamic conditional forms"],
      [true, "Full admin + analytics"],
      [true, "Partner portal"],
      [true, "WhatsApp reminders"],
      [true, "CRM layer"],
      [false, "White-label branding"],
    ],
  },
  {
    tier: "scale",
    name: "Scale",
    monthly: 1800,
    features: [
      [true, "Everything in Professional"],
      [true, "Full white-label branding"],
      [true, "Multi-language"],
      [true, "Custom fields & automations"],
      [true, "AML / KYC screening"],
      [true, "API & accounting integrations"],
      [true, "Priority support"],
    ],
  },
];

export function PricingTool() {
  const [annual, setAnnual] = useState(false);
  const price = (m: number) =>
    annual ? `€${Math.round(m * 0.83 * 12).toLocaleString()}` : `€${m.toLocaleString()}`;
  const per = annual ? "/yr (2 months free)" : "/mo";

  return (
    <>
      <div className="center mb-6">
        <div className="toggle-group">
          <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)} type="button">
            Monthly
          </button>
          <button className={annual ? "active" : ""} onClick={() => setAnnual(true)} type="button">
            Annual · save 17%
          </button>
        </div>
      </div>

      <div className="price-grid">
        {PLANS.map((p) => (
          <div key={p.tier} className={`price-card${p.feat ? " feat" : ""}`}>
            <div className="tier">{p.name}</div>
            <div className="amt mono">
              {price(p.monthly)}
              <span> {per}</span>
            </div>
            <ul>
              {p.features.map(([on, label]) => (
                <li key={label} className={on ? undefined : "off"}>
                  <Icon name={on ? "check" : "x"} className="ic-16" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link href="/login" className={`btn btn-block ${p.feat ? "btn-primary" : "btn-secondary"}`}>
              Choose {p.name}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
