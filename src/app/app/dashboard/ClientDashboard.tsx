import Link from "next/link";

type Service = { id: string; serviceType: string; status: string };
type KeyDate = { id: string; description: string; dueDate: Date; status: string };
type DocReq = { id: string; description: string; dueAt: Date | null };
type Activity = { id: string; action: string; createdAt: Date };

export function ClientDashboard({
  name,
  since,
  complianceStatus,
  riskRating,
  services,
  upcomingKeyDates,
  openRequests,
  unreadMessageCount,
  recentActivity,
  hasUpcomingBookingWithin14Days,
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
  const first = name.split(" ")[0] ?? "there";
  const sinceFormatted = since.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="eyebrow eyebrow-line mb-6">Engagement</div>
        <h1
          className="font-display text-[clamp(40px,5vw,72px)] leading-[0.98] tracking-[-0.03em] text-ink"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          Welcome,{" "}
          <span
            className="italic text-accent-deep"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}
          >
            {first}.
          </span>
        </h1>
        <p className="mt-4 text-[15px] text-muted">
          Client since <span className="figure">{sinceFormatted}</span>
          {complianceStatus && (
            <>
              <span className="mx-3 text-muted/50">·</span>
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase">
                {complianceStatus.replace("_", " ")}
              </span>
              {riskRating && (
                <>
                  <span className="mx-3 text-muted/50">·</span>
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase">
                    Risk: {riskRating}
                  </span>
                </>
              )}
            </>
          )}
        </p>
      </section>

      {/* ─── Figures ───────────────────────────────────────────── */}
      <section className="grid gap-px md:grid-cols-4 mb-14" style={{ background: "var(--border)" }}>
        <Figure
          label="Active services"
          value={services.filter((s) => s.status !== "completed").length}
        />
        <Figure label="Upcoming (30d)" value={upcomingKeyDates.length} />
        <Figure
          label="Open requests"
          value={openRequests.length}
          accent={openRequests.length > 0}
        />
        <Figure
          label="Messages (7d)"
          value={unreadMessageCount}
          accent={unreadMessageCount > 0}
        />
      </section>

      {/* ─── Requests (only when there are any) ────────────────── */}
      {openRequests.length > 0 && (
        <Section
          title="ORO has requested"
          right={
            <Link
              href="/app/documents"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-deep link-gold"
            >
              Open documents →
            </Link>
          }
        >
          <ul className="flex flex-col">
            {openRequests.slice(0, 5).map((r, i) => (
              <li
                key={r.id}
                className={`py-4 flex justify-between items-baseline gap-6 ${i === 0 ? "" : "border-t"}`}
                style={i === 0 ? {} : { borderColor: "var(--border)" }}
              >
                <span className="text-[15px] text-ink leading-snug">{r.description}</span>
                {r.dueAt && (
                  <span className="font-mono figure text-[12px] text-muted whitespace-nowrap">
                    due {new Date(r.dueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ─── Upcoming dates ─────────────────────────────────────── */}
      <Section title="Upcoming key dates">
        {upcomingKeyDates.length === 0 ? (
          <p
            className="font-display italic text-[20px] text-muted py-2"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}
          >
            None in the next 30 days.
          </p>
        ) : (
          <ul className="flex flex-col">
            {upcomingKeyDates.slice(0, 5).map((kd, i) => (
              <li
                key={kd.id}
                className={`py-4 flex justify-between items-baseline gap-6 ${i === 0 ? "" : "border-t"}`}
                style={i === 0 ? {} : { borderColor: "var(--border)" }}
              >
                <span className="text-[15px] text-ink leading-snug">{kd.description}</span>
                <span
                  className={`font-mono figure text-[12px] whitespace-nowrap ${
                    kd.status === "overdue" ? "text-oxblood" : "text-accent-deep"
                  }`}
                >
                  {kd.status === "overdue"
                    ? "OVERDUE"
                    : new Date(kd.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ─── Booking nudge ──────────────────────────────────────── */}
      {!hasUpcomingBookingWithin14Days && (
        <div
          className="mt-10 px-8 py-7 flex items-center justify-between gap-6 flex-wrap"
          style={{
            background: "var(--ink)",
            color: "var(--bone)",
            border: "1px solid var(--ink)",
          }}
        >
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent mb-2">
              Consultation
            </div>
            <h3
              className="font-display text-[22px] leading-[1.2] text-bone"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 70' }}
            >
              Speak with your{" "}
              <span
                className="italic text-accent"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1', fontWeight: 300 }}
              >
                counsel.
              </span>
            </h3>
            <p className="text-bone/55 text-[13px] mt-1.5">
              Pick a slot in the next 14 days.
            </p>
          </div>
          <Link href="/app/booking" className="btn btn-accent shrink-0">
            Book a meeting →
          </Link>
        </div>
      )}

      {/* ─── Recent activity ────────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <Section title="Recent activity">
          <ul className="flex flex-col">
            {recentActivity.slice(0, 6).map((a, i) => (
              <li
                key={a.id}
                className={`py-3 flex items-baseline gap-6 ${i === 0 ? "" : "border-t"}`}
                style={i === 0 ? {} : { borderColor: "var(--border)" }}
              >
                <span className="font-mono figure text-[11px] tracking-[0.04em] text-muted w-[90px] shrink-0">
                  {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </span>
                <span className="text-[14px] text-ink/85 capitalize">
                  {a.action.replace(/[._]/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function Figure({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className="bg-surface px-7 py-7"
      style={{ border: 0 }}
    >
      <div className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-muted mb-4">
        {label}
      </div>
      <div
        className={`font-display figure text-[44px] leading-none ${accent ? "text-accent-deep" : "text-ink"}`}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60', fontWeight: 400, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 surface p-8">
      <div className="flex items-baseline justify-between mb-4">
        <div className="eyebrow">{title}</div>
        {right}
      </div>
      {children}
    </section>
  );
}
