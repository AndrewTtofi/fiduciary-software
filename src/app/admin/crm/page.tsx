import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { listLeads } from "@/lib/services/leads";
import { CrmTable, type CrmRecord } from "./CrmTable";

export const metadata = { title: "Leads / CRM" };
export const dynamic = "force-dynamic";

type Tab = "all" | "leads" | "applicants" | "clients";

function pretty(s: string | null | undefined) {
  if (!s) return "—";
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function prettyLabel(s: string) {
  // camelCase / snake_case meta keys → "Camel Case" labels
  return pretty(s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase());
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole("staff");
  const tab = ((await searchParams).tab ?? "all") as Tab;

  const [leads, prospects] = await Promise.all([
    tab === "all" || tab === "leads" ? listLeads() : Promise.resolve([]),
    tab === "all" || tab === "applicants" || tab === "clients"
      ? prisma.prospect.findMany({ include: { user: true, details: true }, orderBy: { createdAt: "desc" }, take: 200 })
      : Promise.resolve([]),
  ]);

  const records: CrmRecord[] = [];
  if (tab === "all" || tab === "leads") {
    for (const l of leads) {
      const meta = (l.meta ?? {}) as Record<string, string>;
      const bits = [
        l.note ?? (l.source === "contact" ? "Contact form" : l.source),
        l.phone && `☎ ${l.phone}`,
        meta.country && `From ${meta.country}`,
        meta.preferredSlotLabel && `Prefers ${meta.preferredSlotLabel}`,
      ].filter(Boolean);
      const info: CrmRecord["info"] = [
        { label: "Email", value: l.email },
        ...(l.phone ? [{ label: "Phone", value: l.phone }] : []),
        { label: "Service", value: pretty(l.serviceKey) },
        { label: "Source", value: pretty(l.source) },
        ...(l.note ? [{ label: "Note", value: l.note }] : []),
        ...Object.entries(meta)
          .filter(([k]) => k !== "preferredSlot")
          .map(([k, v]) => ({ label: prettyLabel(k), value: String(v) })),
        { label: "Created", value: fmtDate(l.createdAt) },
        { label: "Last activity", value: fmtDate(l.lastActivityAt) },
      ];
      records.push({
        key: `lead-${l.id}`,
        name: l.name ?? "(anonymous lead)",
        email: l.email,
        service: pretty(l.serviceKey),
        type: "Lead",
        stage: l.stage === "converted" ? "Converted" : "Lead",
        detail: bits.join(" · "),
        leadId: l.id,
        info,
      });
    }
  }
  for (const p of prospects) {
    const services = Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : [];
    const svc = services.length ? pretty(services[0]) : "—";
    const isClient = p.status === "approved";
    const info: CrmRecord["info"] = [
      { label: "Email", value: p.user.email },
      ...(p.user.phone ? [{ label: "Phone", value: p.user.phone }] : []),
      { label: "Reference", value: p.referenceNumber },
      { label: "Status", value: pretty(p.status) },
      { label: "Services", value: services.length ? services.map(pretty).join(", ") : "—" },
      ...p.details.map((d) => ({ label: prettyLabel(d.fieldName), value: d.fieldValue })),
      { label: "Created", value: fmtDate(p.createdAt) },
    ];
    if (isClient && (tab === "all" || tab === "clients")) {
      records.push({ key: `c-${p.id}`, name: p.user.fullName, email: p.user.email, service: svc, type: "Client", stage: "Client", detail: "", href: `/admin/submissions/${p.referenceNumber}`, info });
    } else if (!isClient && (tab === "all" || tab === "applicants")) {
      records.push({ key: `a-${p.id}`, name: p.user.fullName, email: p.user.email, service: svc, type: "Applicant", stage: p.status, detail: p.referenceNumber, href: `/admin/submissions/${p.referenceNumber}`, info });
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" }, { key: "leads", label: "Leads" },
    { key: "applicants", label: "Applicants" }, { key: "clients", label: "Clients" },
  ];

  return (
    <AdminShell active="leads">
      <div className="mb-12">
        <div className="eyebrow mb-2">Pipeline</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Leads / CRM</h2>
        <p className="mt-2 max-w-[60ch] text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          One pipeline across the whole funnel — anonymous leads from the public tools,
          live applicants in review, and converted clients. Click a record for the full
          picture; leads can be turned into client accounts directly.
        </p>
      </div>

      <div className="chips mb-6">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "all" ? "/admin/crm" : `/admin/crm?tab=${t.key}`} className={`chip${tab === t.key ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <CrmTable records={records} />
    </AdminShell>
  );
}
