import Link from "next/link";

type Service = { id: string; serviceType: string; status: string };
type KeyDate = { id: string; description: string; dueDate: Date; status: string };
type DocReq  = { id: string; description: string; dueAt: Date | null };
type Activity = { id: string; action: string; createdAt: Date };

export function ClientDashboard({
  name, since, complianceStatus, riskRating,
  services, upcomingKeyDates, openRequests, unreadMessageCount,
  recentActivity, hasUpcomingBookingWithin14Days,
}: {
  name: string;
  since: Date;
  complianceStatus: "open" | "in_review" | "cleared" | "blocked" | null;
  riskRating: "low" | "standard" | "high" | null;
  services: Service[];
  upcomingKeyDates: KeyDate[];
  openRequests: DocReq[];
  unreadMessageCount: number;
  recentActivity: Activity[];
  hasUpcomingBookingWithin14Days: boolean;
}) {
  return (
    <>
      <div className="mb-10">
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-3xl">{name}</h1>
        <p className="text-muted mt-2 text-meta">
          Active client since {since.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        {complianceStatus && (
          <div className="mt-3 flex gap-2 items-center text-meta">
            <span className={`badge ${complianceStatus === "cleared" ? "badge-approved" : "badge-pending"} capitalize`}>
              {complianceStatus.replace("_", " ")}
            </span>
            {riskRating && (
              <span className="text-muted">risk: <span className="font-semibold capitalize">{riskRating}</span></span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-10">
        <Stat label="Active services" value={services.filter((s) => s.status !== "completed").length} />
        <Stat label="Upcoming dates (30d)" value={upcomingKeyDates.length} />
        <Stat label="Open requests" value={openRequests.length} />
        <Stat label="Messages from us (7d)" value={unreadMessageCount} />
      </div>

      {openRequests.length > 0 && (
        <Section title="ORO has requested">
          <ul className="flex flex-col gap-2">
            {openRequests.slice(0, 5).map((r) => (
              <li key={r.id} className="flex justify-between text-meta">
                <span>{r.description}</span>
                {r.dueAt && <span className="font-mono text-muted">due {new Date(r.dueAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
          <Link href="/app/documents" className="text-meta underline mt-3 inline-block">Open documents →</Link>
        </Section>
      )}

      <Section title="Upcoming key dates">
        {upcomingKeyDates.length === 0
          ? <p className="text-muted text-meta">None in the next 30 days.</p>
          : <ul className="flex flex-col gap-2">{upcomingKeyDates.slice(0, 5).map((kd) => (
              <li key={kd.id} className="flex justify-between text-meta">
                <span>{kd.description}</span>
                <span className="font-mono text-muted">{new Date(kd.dueDate).toLocaleDateString()}</span>
              </li>
            ))}</ul>}
      </Section>

      {!hasUpcomingBookingWithin14Days && (
        <div className="mt-6 bg-[var(--client-surface)] border border-token rounded-card p-4 flex justify-between items-center">
          <span className="text-meta">Need to talk? Book a follow-up consultation.</span>
          <Link href="/app/booking" className="btn btn-primary px-4 py-2">Book</Link>
        </div>
      )}

      {recentActivity.length > 0 && (
        <Section title="Recent activity">
          <ul className="flex flex-col gap-2">{recentActivity.slice(0, 5).map((a) => (
            <li key={a.id} className="text-meta">
              <span className="font-mono text-[11px] text-muted mr-2">{new Date(a.createdAt).toLocaleDateString()}</span>
              {a.action.replace(/_/g, " ")}
            </li>
          ))}</ul>
        </Section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--client-surface)] border border-token rounded-elem p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 bg-[var(--client-surface)] border border-token rounded-card p-6">
      <h2 className="text-meta font-bold uppercase tracking-widest text-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}
