"use client";

import { useState } from "react";
import Link from "next/link";
import { LeadActions } from "./LeadActions";

export type CrmRecord = {
  key: string;
  name: string;
  email: string;
  service: string;
  type: "Lead" | "Applicant" | "Client";
  stage: string;
  detail: string;
  href?: string;
  leadId?: string;
  /** Full record fields shown in the detail modal. */
  info: { label: string; value: string }[];
};

export function CrmTable({ records }: { records: CrmRecord[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = records.find((r) => r.key === openKey) ?? null;

  return (
    <>
      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <strong>Pipeline</strong>
          <span className="muted right" style={{ fontSize: "var(--fs-xs)" }}>{records.length} records</span>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Service</th><th>Type</th><th>Stage</th><th>Detail</th><th>Action</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6}><div className="empty"><h3>No records</h3><p>Nothing matches this filter yet.</p></div></td></tr>
            ) : records.map((r) => {
              const initials = r.name === "(anonymous lead)" ? "?" : r.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
              return (
                <tr key={r.key} style={{ cursor: "pointer" }} onClick={() => setOpenKey(r.key)}>
                  <td>
                    <div className="cell-entity">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
                      <div><div style={{ fontWeight: 500 }}>{r.name}</div><div className="sub">{r.email}</div></div>
                    </div>
                  </td>
                  <td>{r.service}</td>
                  <td><span className="tag">{r.type}</span></td>
                  <td><span className={`badge ${stageClass(r.stage)}`}>{stageLabel(r.stage)}</span></td>
                  <td className="muted">{r.detail}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {r.leadId
                      ? <LeadActions leadId={r.leadId} converted={r.stage === "Converted"} />
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="scrim" onClick={() => setOpenKey(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{open.name}</h3>
                <div className="row mt-2" style={{ gap: ".5rem", alignItems: "center" }}>
                  <span className="tag">{open.type}</span>
                  <span className={`badge ${stageClass(open.stage)}`}>{stageLabel(open.stage)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setOpenKey(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body">
              <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: ".65rem", columnGap: "1rem" }}>
                {open.info.map((f) => (
                  <FieldRow key={f.label} label={f.label} value={f.value} />
                ))}
              </dl>
            </div>
            <div className="modal-foot">
              {open.leadId && <span style={{ marginRight: "auto" }}><LeadActions leadId={open.leadId} converted={open.stage === "Converted"} /></span>}
              {open.href && <Link href={open.href} className="btn btn-primary">Open submission →</Link>}
              <button type="button" onClick={() => setOpenKey(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="muted" style={{ fontSize: "var(--fs-xs)", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</dt>
      <dd style={{ fontSize: "var(--fs-sm)", overflowWrap: "anywhere" }}>{value}</dd>
    </>
  );
}

function stageLabel(s: string) {
  return s === "Lead" ? "Lead" : s === "Client" ? "Client" : s.replace("_", " ");
}
function stageClass(s: string) {
  return s === "Client" || s === "Converted" ? "badge-approved"
    : s === "approved" ? "badge-approved"
    : s === "needs_info" ? "badge-info"
    : s === "rejected" ? "badge-danger"
    : s === "pending" ? "badge-pending"
    : "badge-neutral";
}
