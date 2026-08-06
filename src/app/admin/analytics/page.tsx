import { AdminShell } from "@/components/admin/AdminShell";
import { Kpi } from "@/components/admin/Kpi";
import { Jurisdiction } from "@/components/admin/Flag";
import { prisma } from "@/lib/db";
import { ProspectStatus, BookingStatus } from "@prisma/client";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [
    total, pending, approved, rejected,
    bookingsTotal, noShows, completed,
  ] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: ProspectStatus.pending } }),
    prisma.prospect.count({ where: { status: ProspectStatus.approved } }),
    prisma.prospect.count({ where: { status: ProspectStatus.rejected } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.no_show } }),
    prisma.booking.count({ where: { status: BookingStatus.completed } }),
  ]);

  // By service
  const allProspects = await prisma.prospect.findMany({ select: { servicesSelected: true } });
  const serviceCounts = new Map<string, number>();
  for (const p of allProspects) {
    for (const s of Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : []) {
      serviceCounts.set(s, (serviceCounts.get(s) ?? 0) + 1);
    }
  }
  const byService = Array.from(serviceCounts.entries()).sort((a, b) => b[1] - a[1]);

  // By country (residence)
  const detailsByCountry = await prisma.prospectDetail.findMany({
    where: { fieldName: "residenceCountry" },
    select: { fieldValue: true },
  });
  const countryCounts = new Map<string, number>();
  for (const d of detailsByCountry) {
    countryCounts.set(d.fieldValue, (countryCounts.get(d.fieldValue) ?? 0) + 1);
  }
  const topCountries = Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Average time to consultation = submission → that applicant's FIRST
  // consultation. Public (lead) hard-bookings have no prospect and are excluded.
  //
  // Two things this has to get right, both of which used to produce a negative
  // or inflated figure: only the earliest booking per applicant counts (an
  // applicant with three consultations is still one wait), and a consultation
  // scheduled before the application was submitted has no "time to consult" at
  // all — it is excluded rather than averaged in as negative days.
  const bookingsWithProspect = (await prisma.booking.findMany({
    select: { startsAt: true, prospectId: true, prospect: { select: { createdAt: true } } },
  })).filter((b): b is typeof b & { prospectId: string; prospect: { createdAt: Date } } =>
    b.prospectId !== null && b.prospect !== null,
  );

  const firstBookingPerProspect = new Map<string, { startsAt: Date; createdAt: Date }>();
  for (const b of bookingsWithProspect) {
    const seen = firstBookingPerProspect.get(b.prospectId);
    if (!seen || b.startsAt < seen.startsAt) {
      firstBookingPerProspect.set(b.prospectId, { startsAt: b.startsAt, createdAt: b.prospect.createdAt });
    }
  }
  const waits = [...firstBookingPerProspect.values()]
    .map((b) => b.startsAt.getTime() - b.createdAt.getTime())
    .filter((ms) => ms >= 0);
  const avgDays = waits.length
    ? Math.round(waits.reduce((sum, ms) => sum + ms, 0) / waits.length / (1000 * 60 * 60 * 24))
    : null;

  const busiest = Math.max(0, ...byService.map(([, n]) => n));

  return (
    <AdminShell active="analytics">
      <div className="mb-6">
        <div className="eyebrow mb-2">Firm</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Analytics</h2>
        <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)" }}>Headline metrics derived from the application database.</p>
      </div>

      <div className="grid grid-4 mb-6">
        <Kpi label="Submissions (all-time)" value={total} icon="documents" />
        <Kpi label="Pending review" value={pending} icon="flag" />
        <Kpi label="Approval rate" value={total ? `${Math.round((approved / total) * 100)}%` : "—"} icon="check" />
        <Kpi label="Rejections" value={rejected} icon="x" />
        <Kpi label="Consultations booked" value={bookingsTotal} icon="calendar" />
        <Kpi label="Completed" value={completed} icon="check" />
        <Kpi label="No-shows" value={noShows} icon="flag" />
        <Kpi label="Avg time to consult." value={avgDays === null ? "—" : `${avgDays} d`} icon="clock" />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Submissions by service</h3>
          {byService.length === 0 ? <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>No data yet.</p> :
            <div>
              {byService.map(([service, count]) => (
                // Bars scale against the busiest service, not the total, so the
                // shape of the mix stays readable when one service dominates.
                <div className="bar-row" key={service}>
                  <span style={{ fontSize: "var(--fs-sm)" }}>{pretty(service)}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${busiest ? Math.round((count / busiest) * 100) : 0}%` }} />
                  </span>
                  <span className="bar-n">{count}</span>
                </div>
              ))}
            </div>
          }
        </div>

        <div className="card">
          <h3 className="card-title">Top jurisdictions</h3>
          {topCountries.length === 0 ? <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>No data yet.</p> :
            <ul className="row" style={{ flexDirection: "column", gap: 8, alignItems: "stretch" }}>
              {topCountries.map(([country, count]) => (
                <li key={country} className="row-between" style={{ fontSize: "var(--fs-sm)" }}>
                  <Jurisdiction country={country} />
                  <span className="bar-n">{count}</span>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    </AdminShell>
  );
}

function pretty(s: string) {
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
