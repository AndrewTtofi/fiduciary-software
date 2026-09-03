"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ServiceIcons } from "@/components/marketing/ServiceIcons";
import type { ServiceKey } from "@/lib/schema/onboarding";

/* The onboarding picker lists the PLATFORM service lines (the keys the
   application, lead flags and client services key on — lib/schema/onboarding),
   not the public marketing catalogue, so a copy change on the website never
   breaks an in-flight application. Icons are borrowed from the marketing set. */
const PLATFORM_SERVICES: { key: ServiceKey; title: string; blurb: string; icon: keyof typeof ServiceIcons }[] = [
  { key: "company_formation", title: "Company Formation", blurb: "Full incorporation and registered office setup.", icon: "company-formation" },
  { key: "accounting", title: "Accounting and VAT", blurb: "Ongoing bookkeeping, VAT and annual filings.", icon: "accounting-vat" },
  { key: "tax_residency", title: "Tax Residency and Non-Dom", blurb: "Non-Dom status and individual tax planning.", icon: "tax-residency" },
  { key: "immigration", title: "Immigration and Work Permits", blurb: "Residency permits, work permits and citizenship.", icon: "immigration" },
  { key: "licensing", title: "International Companies and Licensing", blurb: "Company formation and licensing abroad.", icon: "international" },
  { key: "banking", title: "Business Accounts", blurb: "Business account applications, prepared and submitted.", icon: "company-formation" },
];

export function ServicesPicker({
  initialSelected,
  reference,
  nextHref = "/onboarding/details",
}: {
  initialSelected: string[];
  reference: string;
  nextHref?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function onContinue() {
    if (selected.size === 0) return;
    start(async () => {
      const res = await fetch("/api/onboarding/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: Array.from(selected) }),
      });
      if (res.ok) router.push(nextHref);
    });
  }

  return (
    <>
      <p className="text-center text-meta text-muted mb-6 font-mono">
        Application: <span className="text-fg">{reference}</span>
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_SERVICES.map((s) => {
          const k = s.key;
          const isSel = selected.has(k);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(k)}
              aria-pressed={isSel}
              className={`relative text-left surface rounded-card p-8 flex flex-col gap-4 transition-all hover:-translate-y-0.5 ${
                isSel ? "ring-2" : ""
              }`}
              style={isSel ? { borderColor: "var(--accent)", boxShadow: "0 4px 12px rgba(200,164,90,0.1)" } : {}}
            >
              <span
                className="absolute top-4 right-4 w-6 h-6 rounded-full grid place-items-center text-xs border-2 transition-all"
                style={
                  isSel
                    ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--dark)" }
                    : { borderColor: "var(--border)", color: "transparent" }
                }
              >
                ✓
              </span>
              <span
                className="w-11 h-11 grid place-items-center rounded-elem transition-colors"
                style={
                  isSel
                    ? { background: "var(--dark)", color: "var(--accent)" }
                    : { background: "var(--bg)", color: "var(--fg)" }
                }
              >
                <span className="w-5 h-5 block">{ServiceIcons[s.icon]}</span>
              </span>
              <h3 className="font-display text-xl">{s.title}</h3>
              <p className="text-meta text-muted">{s.blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="border-t border-token mt-16 pt-10 flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={selected.size === 0 || pending}
          className="btn btn-primary px-10 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </>
  );
}
