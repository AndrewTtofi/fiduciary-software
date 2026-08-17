"use client";

import { useState } from "react";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 9 — Cyprus Tax Calendar. Every deadline in date order, filtered for
   individuals / companies / employers, with the next upcoming deadline
   highlighted at the top. Dates come from the editable calendar in the tool
   settings (rolled forward each year by the firm) and the next due date is
   computed server-side and passed in. No links to any filing portal. */

export type CalendarItem = {
  id: string;
  title: string;
  applies: ("individuals" | "companies" | "employers")[];
  frequency: "monthly" | "quarterly" | "annual";
  detail: string;
  /** ISO date of the next occurrence, or null when not derivable. */
  nextDue: string | null;
};

const FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "individuals", label: "Individuals" },
  { key: "companies", label: "Companies" },
  { key: "employers", label: "Employers" },
] as const;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export function TaxCalendar({ items, whatsapp }: { items: CalendarItem[]; whatsapp: string }) {
  const [f, setF] = useState<(typeof FILTERS)[number]["key"]>("all");
  const list = items
    .filter((i) => f === "all" || i.applies.includes(f))
    .slice()
    .sort((a, b) => (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999"));
  const next = list.find((i) => i.nextDue);

  return (
    <div className="calc">
      <div className="calc-head">
        <span className="eyebrow">Filing calendar</span>
        <h3>Deadlines in date order</h3>
      </div>
      <div className="calc-body">
        <div className="seg" role="radiogroup" aria-label="Who this applies to" style={{ marginBottom: 18 }}>
          {FILTERS.map((x) => (
            <button key={x.key} type="button" role="radio" aria-checked={f === x.key} className={f === x.key ? "on" : undefined} onClick={() => setF(x.key)}>{x.label}</button>
          ))}
        </div>
        {next && (
          <div className="cal-next">
            <span className="kicker" style={{ marginBottom: 4 }}>Next deadline</span>
            <b>{fmt(next.nextDue!)}</b>
            <span>{next.title}</span>
          </div>
        )}
        <ol className="cal-list">
          {list.map((i) => (
            <li key={i.id} className={i === next ? "on" : undefined}>
              <div className="cal-date">{i.nextDue ? fmt(i.nextDue) : "Date depends on your year end"}</div>
              <div className="cal-body">
                <b>{i.title}</b>
                <span className="cal-tags">
                  <em>{i.frequency}</em>
                  {i.applies.map((a) => <em key={a}>{a}</em>)}
                </span>
                <p>{i.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <ResultCta
          answer={next ? fmt(next.nextDue!) : "Your deadlines"}
          context="These are the standard statutory dates; your company's own annual return date depends on its incorporation, and extensions are announced year by year. We track every date for our accounting clients so nothing arrives as a surprise."
          whatsapp={whatsapp}
        />
      </div>
    </div>
  );
}
