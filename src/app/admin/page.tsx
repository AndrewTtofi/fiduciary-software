import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompletenessChip } from "@/components/admin/CompletenessChip";
import { DataTable, type DataRow } from "@/components/admin/DataTable";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { ProspectStatus } from "@prisma/client";
import type { Completeness } from "@/lib/services/prospect-intel";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const ic = (d: React.ReactNode) => (
  <svg className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONS = {
  clock: ic(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  check: ic(<path d="M5 13l4 4L19 7" />),
  docs: ic(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>),
  scale: ic(<><path d="M12 3v18M7 7h10" /><path d="M7 7l-3 6a3 3 0 0 0 6 0z M17 7l3 6a3 3 0 0 1-6 0z" /></>),
};

function statusClass(s: string) {
  return s === "approved" ? "badge-approved" : s === "needs_info" ? "badge-info" : s === "rejected" ? "badge-danger" : "badge-pending";
}
function prettyStatus(s: string) {
  return s === "pending" ? "Pending" : s === "needs_info" ? "Needs info" : s === "approved" ? "Approved" : "Rejected";
}
function prettyAction(a: string) {
  const m: Record<string, string> = {
    "submission.submitted": "Application submitted", "submission.created": "Application created",
    "submission.approved": "Approved", "submission.rejected": "Rejected",
    "submission.info_requested": "More info requested", "submission.status_changed": "Status changed",
    "document.uploaded": "Document uploaded", "note.added": "Note added", "client.created": "Client created",
  };
  return m[a] ?? a;
}

export default async function AdminDashboardPage() {
  await requireRole("staff");

  // Trends compare the last 30 days against the 30 before it, so the arrow on
  // a card means something specific rather than "up and to the right".
  const now = new Date().getTime();
  const WINDOW = 30 * 24 * 60 * 60 * 1000;
  const thisPeriod = { gte: new Date(now - WINDOW) };
  const lastPeriod = { gte: new Date(now - 2 * WINDOW), lt: new Date(now - WINDOW) };

  const [
    total, pending, approved, recent, activity,
    newThis, newLast, okThis, okLast, pendingThis, pendingLast,
  ] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: ProspectStatus.pending } }),
    prisma.prospect.count({ where: { status: ProspectStatus.approved } }),
    prisma.prospect.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } }),
    prisma.prospect.count({ where: { createdAt: thisPeriod } }),
    prisma.prospect.count({ where: { createdAt: lastPeriod } }),
    prisma.prospect.count({ where: { status: ProspectStatus.approved, createdAt: thisPeriod } }),
    prisma.prospect.count({ where: { status: ProspectStatus.approved, createdAt: lastPeriod } }),
    prisma.prospect.count({ where: { status: ProspectStatus.pending, createdAt: thisPeriod } }),
    prisma.prospect.count({ where: { status: ProspectStatus.pending, createdAt: lastPeriod } }),
  ]);
  const conversion = total ? Math.round((approved / total) * 100) : 0;

  const delta = (a: number, b: number, unit = "") => {
    const d = a - b;
    return { text: d === 0 ? "=" : `${d > 0 ? "+" : "\u2212"}${Math.abs(d)}${unit}`, dir: d === 0 ? "flat" : d > 0 ? "up" : "down" };
  };
  const rate = (ok: number, all: number) => (all ? Math.round((ok / all) * 100) : 0);

  const kpis = [
    { label: "Awaiting review", value: pending, icon: ICONS.clock, rail: "var(--st-wait-fg)", trend: delta(pendingThis, pendingLast) },
    { label: "Approved", value: approved, icon: ICONS.check, rail: "var(--st-ok-fg)", trend: delta(okThis, okLast) },
    { label: "Total submissions", value: total, icon: ICONS.docs, rail: "var(--brand)", trend: delta(newThis, newLast) },
    { label: "Conversion", value: `${conversion}%`, icon: ICONS.scale, rail: "var(--accent-deep)", trend: delta(rate(okThis, newThis), rate(okLast, newLast), "pt") },
  ];

  const recentRows: DataRow[] = recent.map((p) => {
    const eff = (p.completenessOverride ?? p.completeness) as Completeness | null;
    return {
      key: p.id,
      href: `/admin/submissions/${p.referenceNumber}`,
      cells: [
        <span className="mono" key="r">{p.referenceNumber}</span>,
        <div key="a"><div style={{ fontWeight: 500 }}>{p.user.fullName}</div><div className="sub">{p.user.email}</div></div>,
        eff ? <CompletenessChip value={eff} key="b" /> : <span className="muted" key="b">—</span>,
        <span className={`badge ${statusClass(p.status)}`} key="s">{prettyStatus(p.status)}</span>,
      ],
    };
  });

  return (
    <AdminShell active="dashboard">
      <div className="mb-8">
        <div className="eyebrow mb-2">Firm overview</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Dashboard</h2>
      </div>

      <div className="grid grid-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="kpi" style={{ "--kpi-rail": k.rail } as React.CSSProperties}>
            <div className="kpi-top"><span className="eyebrow">{k.label}</span><span className="kpi-tile">{k.icon}</span></div>
            <div className="kpi-value">
              <span>{k.value}</span>
              <span className={`kpi-trend ${k.trend.dir}`} title="Compared with the previous 30 days">{k.trend.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="twocol">
        <DataTable
          title="Recent submissions"
          count={`${total} total`}
          columns={[{ label: "Ref" }, { label: "Applicant" }, { label: "Brief" }, { label: "Status" }]}
          rows={recentRows}
          emptyTitle="No submissions yet"
          emptyBody="Applications appear here as they arrive."
          foot={<><span>Showing {recent.length} of {total}</span><Link href="/admin/submissions" className="link-gold">View all →</Link></>}
        />

        <div className="card">
          <h3 className="card-title">Recent activity</h3>
          <div className="timeline">
            {activity.length === 0 ? <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>No activity yet.</p> : activity.map((a) => (
              <div key={a.id} className="tl-item done" style={{ paddingBottom: "var(--space-4)" }}>
                <div className="node" />
                <div className="tl-title" style={{ fontWeight: 500, fontSize: "var(--fs-sm)" }}>{prettyAction(a.action)}</div>
                <div className="tl-meta">{a.actor?.fullName ?? "System"} · {a.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
