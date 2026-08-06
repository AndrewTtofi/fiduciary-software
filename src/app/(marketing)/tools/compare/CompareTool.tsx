"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { JURISDICTIONS, RATES_REVIEWED } from "@/lib/data/jurisdictions";
import { Flag } from "@/components/admin/Flag";

type SortKey = "corpTax" | "vat" | "days" | "treaties";

/* Module scope: a component defined during render is a fresh type each time,
   which remounts the header and loses focus mid-sort. */
function SortTh({ k, label, sort, onSort }: {
  k: SortKey; label: string; sort: SortKey; onSort: (k: SortKey) => void;
}) {
  return (
    <th className="t-num" style={{ cursor: "pointer" }} onClick={() => onSort(k)}>
      {label}{sort === k ? " ↓" : ""}
    </th>
  );
}

export function CompareTool({ applyHref = "/login" }: { applyHref?: string }) {
  const [selected, setSelected] = useState<string[]>(["cy", "mt", "ee"]);
  const [sort, setSort] = useState<SortKey>("corpTax");

  const chosen = useMemo(() => {
    const list = JURISDICTIONS.filter((j) => selected.includes(j.id));
    return list.slice().sort((a, b) => (a[sort] as number) - (b[sort] as number));
  }, [selected, sort]);

  const best = useMemo(() => {
    if (!chosen.length) return null;
    return {
      corpTax: Math.min(...chosen.map((j) => j.corpTax)),
      days: Math.min(...chosen.map((j) => j.days)),
      treaties: Math.max(...chosen.map((j) => j.treaties)),
    };
  }, [chosen]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }


  return (
    <>
      {/* Grouped: a flat wall of 30-odd chips is unreadable, and "EU or not"
          is the first cut most people make. */}
      {([
        { title: "EU / EEA", list: JURISDICTIONS.filter((j) => j.eu) },
        { title: "Rest of world", list: JURISDICTIONS.filter((j) => !j.eu) },
      ]).map((group) => (
        <div key={group.title} className="mb-4">
          <div className="eyebrow mb-2">{group.title}</div>
          <div className="jchips">
            {group.list.map((j) => {
              const on = selected.includes(j.id);
              return (
                <button key={j.id} className={`jchip${on ? " on" : ""}`} onClick={() => toggle(j.id)}>
                  <Flag country={j.iso} /> {j.name}{on ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {chosen.length ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Jurisdiction</th>
                <SortTh k="corpTax" label="Corp tax" sort={sort} onSort={setSort} />
                <SortTh k="vat" label="VAT" sort={sort} onSort={setSort} />
                <SortTh k="days" label="Formation" sort={sort} onSort={setSort} />
                <th className="t-num">Min capital</th>
                <SortTh k="treaties" label="Tax treaties" sort={sort} onSort={setSort} />
                <th>Source</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {chosen.map((j) => {
                const hl = (k: "corpTax" | "days" | "treaties") => best && (j[k] as number) === best[k];
                const cell = (k: "corpTax" | "days" | "treaties", v: string) => (
                  <td className="t-num" style={hl(k) ? { color: "var(--success)", fontWeight: 600 } : undefined}>{v}</td>
                );
                return (
                  <tr key={j.id} style={{ cursor: "default" }}>
                    <td>
                      <Flag country={j.iso} />{" "}
                      <strong title={j.note}>{j.name}</strong>
                      {j.note && <span className="muted" title={j.note} style={{ cursor: "help", marginLeft: 4 }}>ⓘ</span>}
                      {j.eu && <span className="tag" style={{ marginLeft: 6 }}>EU</span>}
                    </td>
                    {cell("corpTax", `${j.corpTax}%`)}
                    <td className="t-num">{j.vat}%</td>
                    {cell("days", `${j.days}d`)}
                    <td className="t-num">{j.minCap}</td>
                    {cell("treaties", String(j.treaties))}
                    <td>
                      <a href={j.sourceUrl} target="_blank" rel="noreferrer noopener" className="link-gold" style={{ fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }} title="PwC Worldwide Tax Summaries">
                        PwC ↗
                      </a>
                      {j.pendingReview && (
                        <span
                          className="tag"
                          style={{ marginLeft: 6, color: "var(--warning)", borderColor: "#E9D3A4" }}
                          title="Added recently and not yet reconciled against the source — check before relying on it."
                        >
                          unchecked
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={applyHref} className="btn btn-ghost btn-sm">Apply →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <div className="ec">
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M7 7h10M7 7l-3 6a3 3 0 0 0 6 0z M17 7l3 6a3 3 0 0 1-6 0z M6 21h12" /></svg>
          </div>
          <h3>Pick a jurisdiction</h3>
          <p>Select at least one chip above to build your comparison.</p>
        </div>
      )}
    </>
  );
}
