import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, type DataRow } from "@/components/admin/DataTable";
import { Jurisdiction } from "@/components/admin/Flag";
import { prisma } from "@/lib/db";
import { BookingStatus } from "@prisma/client";
import { getConsultationHours } from "@/lib/services/settings";
import { buildCandidateSlots } from "@/lib/services/booking";
import { RescheduleButton } from "./RescheduleButton";
import { HoursEditor } from "./HoursEditor";

export const metadata = { title: "Bookings" };

type BookingRow = {
  id: string; startsAt: Date; timezone: string; status: BookingStatus;
  expert: { fullName: string };
  // Portal bookings carry a prospect; public hard-bookings carry a lead.
  prospect: {
    id: string; referenceNumber: string;
    user: { fullName: string; email: string };
    client: { id: string } | null;
    details: { fieldName: string; fieldValue: string }[];
  } | null;
  lead: { id: string; name: string | null; email: string; meta: unknown } | null;
};

/* The schedule and the bookings it produces belong on one screen: you set the
   hours, then look at what came of them. */
type Tab = "upcoming" | "past" | "hours";

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const raw = (await searchParams).tab;
  const tab: Tab = raw === "past" || raw === "hours" ? raw : "upcoming";
  const hours = await getConsultationHours();
  // Free slots on the configured grid, so staff can only move a call to a time
  // the firm actually works. Slots already taken by a confirmed booking are
  // removed; the service re-checks on submit, including the staff calendar.
  const now2 = new Date();
  const gridSlots = buildCandidateSlots(now2, hours).flatMap((d) => d.slots);
  const takenAt = new Set(
    (await prisma.booking.findMany({
      where: { status: BookingStatus.confirmed, startsAt: { gte: now2 } },
      select: { startsAt: true },
    })).map((b) => b.startsAt.toISOString()),
  );
  const freeSlots = gridSlots.map((d) => d.toISOString()).filter((iso) => !takenAt.has(iso)).slice(0, 60);

  const bookings = await prisma.booking.findMany({
    where: { status: { in: [BookingStatus.confirmed, BookingStatus.completed] } },
    orderBy: { startsAt: "asc" },
    include: {
      expert: true,
      prospect: {
        include: {
          user: true,
          client: true,
          details: { where: { fieldName: { in: ["residenceCountry", "currentTaxResidency"] } } },
        },
      },
      lead: true,
    },
    take: 200,
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.startsAt >= now && b.status === "confirmed");
  const past = bookings.filter((b) => b.startsAt < now || b.status !== "confirmed");

  return (
    <AdminShell active="bookings">
      <div className="mb-6">
        <div className="eyebrow mb-2">Engagement</div>
        <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>Bookings</h2>
        <p className="muted mt-2" style={{ maxWidth: "62ch", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
          Consultations already booked, and the hours you offer. Every slot books straight into
          the adviser&apos;s calendar.
        </p>
      </div>

      <div className="chips mb-6">
        {([
          { key: "upcoming", label: "Upcoming", n: upcoming.length },
          { key: "past", label: "Past", n: past.length },
          { key: "hours", label: "Consultation hours" },
        ] as { key: Tab; label: string; n?: number }[]).map((t) => (
          <Link
            key={t.key}
            href={t.key === "upcoming" ? "/admin/bookings" : `/admin/bookings?tab=${t.key}`}
            className={`chip${tab === t.key ? " active" : ""}`}
          >
            {t.label}{t.n !== undefined && <span className="chip-n">{t.n}</span>}
          </Link>
        ))}
      </div>

      {tab === "hours" ? (
        <HoursEditor initial={hours} />
      ) : tab === "past" ? (
        <BookingTable title="Past" rows={past.slice(0, 50)} empty="Nothing has happened yet." freeSlots={freeSlots} />
      ) : (
        <BookingTable title="Upcoming" rows={upcoming} empty="No consultations booked yet." freeSlots={freeSlots} />
      )}
    </AdminShell>
  );
}

function BookingTable({ title, rows, empty, freeSlots }: { title: string; rows: BookingRow[]; empty: string; freeSlots: string[] }) {
  const data: DataRow[] = rows.map((b) => {
    const meta = (b.lead?.meta ?? {}) as Record<string, string>;
    const country =
      b.prospect?.details.find((d) => d.fieldName === "residenceCountry")?.fieldValue
      ?? b.prospect?.details.find((d) => d.fieldName === "currentTaxResidency")?.fieldValue
      ?? meta.country
      ?? null;
    const name = b.prospect?.user.fullName ?? b.lead?.name ?? b.lead?.email ?? "—";
    const reference = b.prospect?.referenceNumber ?? "Website";
    const href = b.prospect?.client
      ? `/admin/clients/${b.prospect.client.id}`
      : b.prospect
        ? `/admin/submissions/${b.prospect.referenceNumber}`
        : "/admin/crm";

    return {
      key: b.id,
      href,
      sort: [b.startsAt.getTime(), name, country, reference, b.expert.fullName, b.status],
      cells: [
        <div key="w">
          <div style={{ fontWeight: 500 }}>
            {b.startsAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div className="sub mono">
            {b.startsAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: b.timezone })} · {b.timezone}
          </div>
        </div>,
        <div key="a">
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div className="sub">{b.prospect?.user.email ?? b.lead?.email ?? ""}</div>
        </div>,
        <Jurisdiction country={country} key="j" />,
        <span className="mono" style={{ fontSize: "var(--fs-xs)" }} key="r">{reference}</span>,
        b.expert.fullName,
        <span className={`badge ${statusClass(b.status)}`} key="s">{prettyStatus(b.status)}</span>,
        // The whole row already navigates here; this names the destination.
        <Link href={href} className="link-gold" key="p">
          {b.prospect?.client ? "View client" : b.prospect ? "View submission" : "View lead"} →
        </Link>,
        b.status === "confirmed" && b.startsAt >= new Date() ? (
          <RescheduleButton
            key="r"
            bookingId={b.id}
            currentStartsAt={b.startsAt.toISOString()}
            timezone={b.timezone}
            slots={freeSlots.filter((iso) => iso !== b.startsAt.toISOString())}
          />
        ) : <span className="muted" key="r">—</span>,
      ],
    };
  });

  return (
    <DataTable
      title={title}
      count={rows.length}
      columns={[
        { label: "When", sortable: true },
        { label: "Applicant", sortable: true },
        { label: "Lives in", sortable: true },
        { label: "Reference", sortable: true },
        { label: "Adviser", sortable: true },
        { label: "Status", sortable: true },
        { label: "Profile" },
      ]}
      rows={data}
      emptyTitle={title === "Upcoming" ? "Nothing scheduled" : "Nothing here yet"}
      emptyBody={empty}
    />
  );
}

function prettyStatus(s: BookingStatus) {
  return s === "confirmed" ? "Confirmed"
       : s === "completed" ? "Completed"
       : s === "cancelled" ? "Cancelled"
       : s === "no_show" ? "No show"
       : s;
}
function statusClass(s: BookingStatus) {
  return s === "completed" ? "badge-approved"
       : s === "confirmed" ? "badge-info"
       : s === "no_show" ? "badge-danger"
       : "badge-neutral";
}
