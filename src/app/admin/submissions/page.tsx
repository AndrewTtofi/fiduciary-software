import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompletenessChip } from "@/components/admin/CompletenessChip";
import { DataTable, type DataRow } from "@/components/admin/DataTable";
import { Jurisdiction, JurisdictionStack, splitCountries } from "@/components/admin/Flag";
import { ExportButton } from "@/components/admin/ExportButton";
import { prisma } from "@/lib/db";
import { ProspectStatus } from "@prisma/client";
import type { Completeness } from "@/lib/services/prospect-intel";

export const metadata = { title: "Submissions" };

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusFilter = (sp.status ?? "all") as "all" | "enquiries" | "pending" | "needs_info" | "approved" | "rejected";
  const q = (sp.q ?? "").trim();

  // The search narrows the counts too, so the chips describe what is actually
  // in front of you rather than the whole table.
  const searchWhere = q
    ? {
        OR: [
          { referenceNumber: { contains: q, mode: "insensitive" as const } },
          { user: { fullName: { contains: q, mode: "insensitive" as const } } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  // Website bookings land here too. A visitor who books a call is a
  // submission the moment they book — they no longer need an account to be
  // visible. Once the post-call link is used, the lead continues as an
  // application row below (and disappears from this list).
  const enquiryWhere = {
    source: "contact",
    stage: { notIn: ["activated", "converted"] },
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] }
      : {}),
  };
  const [rows, byStatus, enquiries] = await Promise.all([
    prisma.prospect.findMany({
    where: {
      ...(statusFilter !== "all" && statusFilter !== "enquiries" ? { status: statusFilter as ProspectStatus } : {}),
      ...searchWhere,
    },
    include: {
      user: true,
      details: { where: { fieldName: { in: ["residenceCountry", "currentTaxResidency", "nationality"] } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    }),
    prisma.prospect.groupBy({ by: ["status"], where: searchWhere, _count: true }),
    prisma.lead.findMany({
      where: enquiryWhere,
      include: { bookings: { where: { status: { in: ["confirmed", "completed"] } }, orderBy: { startsAt: "desc" }, take: 1 } },
      orderBy: { lastActivityAt: "desc" },
      take: 100,
    }),
  ]);

  const countOf = (key: string) =>
    key === "all"
      ? byStatus.reduce((n, g) => n + g._count, 0) + enquiries.length
      : key === "enquiries"
        ? enquiries.length
        : byStatus.find((g) => g.status === key)?._count ?? 0;

  const enquiryRows: DataRow[] = enquiries.map((l) => {
    const meta = (l.meta ?? {}) as Record<string, string>;
    const call = l.bookings[0]?.startsAt ?? null;
    const passports = splitCountries(meta.nationality ?? null);
    const services = (meta.services ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    const stage = l.activationSentAt ? "Link sent" : call ? "Call booked" : meta.funnelStage === "plan_requested" ? "Plan requested" : "Enquiry";
    return {
      key: `lead-${l.id}`,
      href: `/admin/crm?open=lead-${l.id}`,
      sort: [l.name ?? "", services.join(", "), meta.country ?? null, passports.join(", "), call?.getTime() ?? null, l.createdAt.getTime(), stage],
      cells: [
        <div key="a"><div style={{ fontWeight: 500 }}>{l.name ?? "(no name yet)"}</div><div className="sub">{l.email}</div></div>,
        <div className="row gap-2" style={{ flexWrap: "wrap" }} key="s">
          {services.length === 0 ? <span className="muted">—</span>
            : services.map((x) => <span key={x} className="tag">{x}</span>)}
        </div>,
        <Jurisdiction country={meta.country ?? null} key="c" />,
        <JurisdictionStack countries={passports} key="p" />,
        call
          ? <span className="mono" key="b">{call.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          : <span className="muted" key="b">—</span>,
        <span className="mono" key="d">
          {l.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>,
        <span className={`badge ${stage === "Link sent" ? "badge-info" : stage === "Call booked" ? "badge-approved" : "badge-pending"}`} key="st">{stage}</span>,
      ],
    };
  });

  const tableRows: DataRow[] = rows.map((p) => {
    const answer = (f: string) => p.details.find((d) => d.fieldName === f)?.fieldValue ?? null;
    const country = answer("residenceCountry") ?? answer("currentTaxResidency");
    const passports = splitCountries(answer("nationality"));
    const services = Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : [];
    const eff = (p.completenessOverride ?? p.completeness) as Completeness | null;
    return {
      key: p.id,
      href: `/admin/submissions/${p.referenceNumber}`,
      sort: [
        p.referenceNumber, p.user.fullName, services.join(", "), country, passports.join(", "),
        eff ? COMPLETENESS_ORDER[eff] : null, p.createdAt.getTime(), p.status,
      ],
      cells: [
        <span className="mono" style={{ fontSize: "var(--fs-xs)" }} key="r">{p.referenceNumber}</span>,
        <div key="a"><div style={{ fontWeight: 500 }}>{p.user.fullName}</div><div className="sub">{p.user.email}</div></div>,
        <div className="row gap-2" style={{ flexWrap: "wrap" }} key="s">
          {services.length === 0 ? <span className="muted">—</span>
            : services.map((s) => <span key={s} className="tag">{pretty(s)}</span>)}
        </div>,
        <Jurisdiction country={country} key="c" />,
        <JurisdictionStack countries={passports} key="p" />,
        eff ? <CompletenessChip value={eff} key="b" /> : <span className="muted" key="b">—</span>,
        <span className="mono" key="d">
          {p.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>,
        <span className={`badge ${statusClass(p.status)}`} key="st">{prettyStatus(p.status)}</span>,
      ],
    };
  });

  return (
    <AdminShell active="submissions" search={{ placeholder: "Search reference, name, email…" }}>
      <div className="row-between mb-6" style={{ flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div>
          <div className="eyebrow mb-2">Intake</div>
          <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Submissions queue</h2>
          <p className="muted mt-2" style={{ maxWidth: "60ch", fontSize: "0.9375rem", lineHeight: 1.6 }}>
            Every website booking and every application, in one place. Send a
            booked lead their onboarding link after the call, review the file,
            run compliance, and convert once approved.
          </p>
        </div>
        <ExportButton kind="submissions" />
      </div>

      {/* ── Filter chips ──────────────────────────────────────────── */}
      <div className="chips mb-6">
        {[
          { key: "all", label: "All" },
          { key: "enquiries", label: "Website bookings" },
          { key: "pending", label: "Pending" },
          { key: "needs_info", label: "Needs Info" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/submissions" : `/admin/submissions?status=${f.key}`}
              className={`chip ${isActive ? "active" : ""}`}
            >
              {f.label}<span className="chip-n">{countOf(f.key)}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Website bookings (leads) ──────────────────────────────── */}
      {(statusFilter === "all" || statusFilter === "enquiries") && (
        <div className="mb-8">
          <DataTable
            title="Website bookings"
            count={enquiryRows.length}
            columns={[
              { label: "Enquiry", sortable: true },
              { label: "Services", sortable: true },
              { label: "Lives in", sortable: true },
              { label: "Passports" },
              { label: "Call", sortable: true },
              { label: "Received", sortable: true },
              { label: "Stage", sortable: true },
            ]}
            rows={enquiryRows}
            emptyTitle="No website bookings waiting."
            emptyBody="Consultations booked on the website appear here until the visitor activates their account."
          />
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      {statusFilter !== "enquiries" && (
      <DataTable
        title="Applications"
        count={rows.length}
        columns={[
          { label: "Reference", sortable: true },
          { label: "Applicant", sortable: true },
          { label: "Services", sortable: true },
          { label: "Lives in", sortable: true },
          { label: "Passports" },
          { label: "Brief", sortable: true },
          { label: "Submitted", sortable: true },
          { label: "Status", sortable: true },
        ]}
        rows={tableRows}
        emptyTitle="No applications match."
        emptyBody="Try a different filter, or wait for the next application to arrive."
      />
      )}
    </AdminShell>
  );
}

/* Brief completeness sorts low → high, not alphabetically. */
const COMPLETENESS_ORDER: Record<Completeness, number> = { low: 0, med: 1, high: 2 };

function pretty(s: string) {
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function prettyStatus(s: ProspectStatus) {
  return s === "pending" ? "Pending Review"
       : s === "needs_info" ? "Needs Info"
       : s === "approved" ? "Approved"
       : "Rejected";
}
function statusClass(s: ProspectStatus) {
  return s === "approved" ? "badge-approved"
       : s === "needs_info" ? "badge-info"
       : s === "rejected" ? "badge-danger"
       : "badge-pending";
}
