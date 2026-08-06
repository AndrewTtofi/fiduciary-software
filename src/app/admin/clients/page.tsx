import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { ClientStatus, ProspectStatus } from "@prisma/client";
import { DataTable, type DataRow } from "@/components/admin/DataTable";
import { Jurisdiction } from "@/components/admin/Flag";
import { ConvertModal } from "./ConvertModal";
import Link from "next/link";
import { FilterSelect } from "./FilterSelect";

export const metadata = { title: "Clients" };

interface PageProps {
  searchParams: Promise<{ status?: string; service?: string; partner?: string; q?: string }>;
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusFilter = (sp.status ?? "all") as "all" | "active" | "on_hold" | "completed";
  const serviceFilter = sp.service ?? "all";
  const partnerFilter = sp.partner ?? "all";
  const q = (sp.q ?? "").trim();

  const rows = await prisma.client.findMany({
    where: {
      ...(statusFilter !== "all" ? { status: statusFilter as ClientStatus } : {}),
      ...(serviceFilter !== "all" ? { services: { some: { serviceType: serviceFilter } } } : {}),
      ...(partnerFilter !== "all" ? { services: { some: { assignedPartnerId: partnerFilter } } } : {}),
      ...(q
        ? {
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      primaryStaff: true,
      services: { include: { assignedPartner: true } },
      keyDates: { where: { status: { in: ["upcoming", "overdue"] } }, orderBy: { dueDate: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  // Counts ignore the status filter (so the chips stay stable) but respect the
  // other filters and the search, so they describe what you are actually
  // looking through.
  const statusCounts = await prisma.client.groupBy({
    by: ["status"],
    where: {
      ...(serviceFilter !== "all" ? { services: { some: { serviceType: serviceFilter } } } : {}),
      ...(partnerFilter !== "all" ? { services: { some: { assignedPartnerId: partnerFilter } } } : {}),
      ...(q
        ? {
            OR: [
              { companyName: { contains: q, mode: "insensitive" as const } },
              { user: { fullName: { contains: q, mode: "insensitive" as const } } },
              { user: { email: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    _count: true,
  });
  const countOf = (k: string) =>
    k === "all" ? statusCounts.reduce((n, g) => n + g._count, 0)
      : statusCounts.find((g) => g.status === k)?._count ?? 0;

  const partners = await prisma.user.findMany({ where: { role: "partner" }, select: { id: true, fullName: true } });
  const approvedProspects = await prisma.prospect.findMany({
    where: { status: ProspectStatus.approved, client: null },
    include: { user: true, complianceFile: { select: { status: true } } },
    orderBy: { reviewedAt: "desc" },
  });

  const tableRows: DataRow[] = rows.map((c) => {
    const partnerName = c.services.find((s) => s.assignedPartner)?.assignedPartner?.fullName ?? null;
    const nextKey = c.keyDates[0];
    return {
      key: c.id,
      href: `/admin/clients/${c.id}`,
      sort: [
        c.user.fullName, c.country, c.services.map((s) => shortService(s.serviceType)).join(", "),
        partnerName, c.createdAt.getTime(), nextKey?.dueDate.getTime() ?? null, c.status,
      ],
      cells: [
        <div key="c">
          <div style={{ fontWeight: 600 }}>{c.user.fullName}</div>
          <div className="muted mono" style={{ fontSize: "var(--fs-2xs)", textTransform: "uppercase", letterSpacing: ".1em" }}>
            {c.companyName ?? "—"}
          </div>
        </div>,
        <Jurisdiction country={c.country} key="j" />,
        <div className="row" style={{ gap: ".35rem", flexWrap: "wrap" }} key="s">
          {c.services.length === 0 ? <span className="muted">—</span>
            : c.services.map((s) => <span key={s.id} className="tag">{shortService(s.serviceType)}</span>)}
        </div>,
        partnerName ?? <span className="muted" key="p">—</span>,
        <span className="mono muted" style={{ fontSize: "var(--fs-xs)" }} key="d">
          {c.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>,
        nextKey ? (
          <div key="k">
            <div>{nextKey.description}</div>
            <div className="mono" style={{ fontSize: "var(--fs-2xs)", marginTop: "2px" }}>
              {nextKey.status === "overdue"
                ? <span className="badge badge-danger">Overdue</span>
                : <span className="muted">{nextKey.dueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>}
            </div>
          </div>
        ) : <span className="muted" key="k">—</span>,
        <span className={`badge ${clientStatusClass(c.status)}`} key="st">{prettyClientStatus(c.status)}</span>,
      ],
    };
  });

  const filtered = statusFilter !== "all" || serviceFilter !== "all" || partnerFilter !== "all" || !!q;

  return (
    <AdminShell active="clients" search={{ placeholder: "Search clients, companies…" }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="row-between mb-6" style={{ flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div>
          <div className="eyebrow mb-2">Engagements</div>
          <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>Clients</h2>
          <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)", maxWidth: "60ch", lineHeight: 1.6 }}>
            Converted engagements and the next date that matters on each file.
            {approvedProspects.length > 0 && (
              <> <strong>{approvedProspects.length}</strong> approved {approvedProspects.length === 1 ? "application is" : "applications are"} ready to convert.</>
            )}
          </p>
        </div>
        <ConvertModal candidates={approvedProspects.map((p) => ({
          prospectId: p.id,
          referenceNumber: p.referenceNumber,
          name: p.user.fullName,
          services: (Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : []),
          compliance: p.complianceFile?.status ?? "open",
        }))} />
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="row mb-6" style={{ gap: "1rem", flexWrap: "wrap" }}>
        <FilterSelect name="service" label="Service Type" current={serviceFilter} options={[
          { value: "all", label: "All Services" },
          { value: "company_formation", label: "Company Formation" },
          { value: "accounting", label: "Accounting" },
          { value: "tax_residency", label: "Tax Residency" },
          { value: "immigration", label: "Immigration" },
          { value: "banking", label: "Banking" },
          { value: "licensing", label: "Licensing" },
        ]} />
        <FilterSelect name="partner" label="Assigned Partner" current={partnerFilter} options={[
          { value: "all", label: "All Partners" },
          ...partners.map((p) => ({ value: p.id, label: p.fullName })),
        ]} />
        {filtered && (
          <Link href="/admin/clients" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-end" }}>
            Clear filters
          </Link>
        )}
      </div>

      <div className="chips mb-6">
        {([
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "on_hold", label: "On hold" },
          { key: "completed", label: "Completed" },
        ] as const).map((t) => {
          const next = new URLSearchParams();
          if (serviceFilter !== "all") next.set("service", serviceFilter);
          if (partnerFilter !== "all") next.set("partner", partnerFilter);
          if (q) next.set("q", q);
          if (t.key !== "all") next.set("status", t.key);
          const qs = next.toString();
          return (
            <Link key={t.key} href={qs ? `/admin/clients?${qs}` : "/admin/clients"}
                  className={`chip${statusFilter === t.key ? " active" : ""}`}>
              {t.label}<span className="chip-n">{countOf(t.key)}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <DataTable
        title="Clients"
        count={rows.length}
        columns={[
          { label: "Client", sortable: true },
          { label: "Lives in", sortable: true },
          { label: "Services", sortable: true },
          { label: "Partner", sortable: true },
          { label: "Since", sortable: true },
          { label: "Next key date", sortable: true },
          { label: "Status", sortable: true },
        ]}
        rows={tableRows}
        emptyTitle={filtered ? "No clients match" : "No clients yet"}
        emptyBody={
          filtered
            ? "Nothing on the roster matches these filters. Clear them to see everyone."
            : "Convert an approved submission to add your first engagement."
        }
      />
    </AdminShell>
  );
}

function shortService(s: string) {
  return s === "company_formation" ? "Formation"
       : s === "tax_residency" ? "Tax"
       : s === "accounting" ? "Accounting"
       : s === "immigration" ? "Immigration"
       : s === "banking" ? "Banking"
       : s === "licensing" ? "Licensing"
       : s;
}
function prettyClientStatus(s: ClientStatus) {
  return s === "active" ? "Active" : s === "on_hold" ? "On Hold" : "Completed";
}
function clientStatusClass(s: ClientStatus) {
  return s === "active" ? "badge-approved" : s === "on_hold" ? "badge-pending" : "badge-done";
}
