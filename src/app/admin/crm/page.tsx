import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { computeLeadFlags, listLeads } from "@/lib/services/leads";
import { Jurisdiction, JurisdictionStack, splitCountries } from "@/components/admin/Flag";
import { CrmTable, type CrmRecord } from "./CrmTable";

export const metadata = { title: "Leads / CRM" };
export const dynamic = "force-dynamic";

type Tab = "all" | "leads" | "applicants" | "clients";

/* The routing rules staff act on, as pills. `computeLeadFlags` is the single
   source of truth — it already drives the internal notification emails. */
const ROUTE_TONE: Record<string, "" | "is-value" | "is-risk"> = {
  "Immigration route required": "",
  "PR by investment opportunity": "is-value",
  "High value licensing lead": "is-risk",
};
function routePills(serviceKey: string | null | undefined, meta: Record<string, string>) {
  return computeLeadFlags({ serviceKey, meta }).flags.map((label) => ({
    label,
    tone: ROUTE_TONE[label] ?? "",
  }));
}

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

  const [leads, prospects, registeredOnly] = await Promise.all([
    listLeads(),
    prisma.prospect.findMany({
      include: { user: true, details: true, client: { select: { id: true } }, complianceFile: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    // Accounts that exist but never started onboarding — the gap between
    // "lead" and "applicant". Surfaced so nobody silently stalls there.
    prisma.user.findMany({
      where: { role: "prospect", prospect: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // A lead whose email already has an account continues its journey as an
  // applicant/client record — don't show the same person twice.
  const accountEmails = new Set([
    ...prospects.map((p) => p.user.email.toLowerCase()),
    ...registeredOnly.map((u) => u.email.toLowerCase()),
  ]);

  // Build the whole funnel, then filter for display — the chips need counts
  // for every tab, not just the one being viewed.
  const records: CrmRecord[] = [];

  {
    for (const l of leads) {
      if (accountEmails.has(l.email.toLowerCase())) continue;
      const meta = (l.meta ?? {}) as Record<string, string>;
      const bits = [
        l.note ?? (l.source === "contact" ? "Contact form" : l.source),
        l.phone && `☎ ${l.phone}`,
        meta.country && `From ${meta.country}`,
        meta.preferredSlotLabel && `Prefers ${meta.preferredSlotLabel}`,
      ].filter(Boolean);
      records.push({
        key: `lead-${l.id}`,
        name: l.name ?? "(anonymous lead)",
        email: l.email,
        service: pretty(l.serviceKey),
        type: "Lead",
        stage: "Lead",
        detail: bits.join(" · "),
        leadId: l.id,
        country: meta.country ?? null,
        passports: meta.nationality ?? null,
        countryCell: <Jurisdiction country={meta.country ?? null} />,
        passportsCell: <JurisdictionStack countries={splitCountries(meta.nationality)} />,
        routes: routePills(l.serviceKey, meta),
        sections: [
          {
            title: "Contact",
            fields: [
              { label: "Email", value: l.email },
              ...(l.phone ? [{ label: "Phone", value: l.phone }] : []),
            ],
          },
          {
            title: "Enquiry",
            fields: [
              { label: "Service", value: pretty(l.serviceKey) },
              { label: "Source", value: pretty(l.source) },
              ...(l.note ? [{ label: "Note", value: l.note }] : []),
              ...Object.entries(meta)
                .filter(([k]) => k !== "preferredSlot")
                .map(([k, v]) => ({ label: prettyLabel(k), value: String(v) })),
            ],
          },
          {
            title: "Timeline",
            fields: [
              { label: "Created", value: fmtDate(l.createdAt) },
              { label: "Last activity", value: fmtDate(l.lastActivityAt) },
            ],
          },
        ],
      });
    }

    for (const u of registeredOnly) {
      records.push({
        key: `reg-${u.id}`,
        name: u.fullName,
        email: u.email,
        service: "—",
        type: "Applicant",
        stage: "registered",
        detail: "Account created — onboarding not started",
        country: null,
        passports: null,
        countryCell: <Jurisdiction country={null} />,
        passportsCell: <JurisdictionStack countries={[]} />,
        routes: [],
        sections: [
          {
            title: "Contact",
            fields: [
              { label: "Email", value: u.email },
              ...(u.phone ? [{ label: "Phone", value: u.phone }] : []),
            ],
          },
          {
            title: "Timeline",
            fields: [{ label: "Registered", value: fmtDate(u.createdAt) }],
          },
        ],
      });
    }
  }

  for (const p of prospects) {
    const isClient = !!p.client;

    const services = Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : [];
    const svc = services.length ? pretty(services[0]) : "—";
    const answer = (field: string) => p.details.find((d) => d.fieldName === field)?.fieldValue ?? null;
    const country = answer("residenceCountry") ?? answer("currentTaxResidency");
    const passports = answer("nationality");
    const sections: CrmRecord["sections"] = [
      {
        title: "Contact",
        fields: [
          { label: "Email", value: p.user.email },
          ...(p.user.phone ? [{ label: "Phone", value: p.user.phone }] : []),
        ],
      },
      {
        title: "Pipeline",
        fields: [
          { label: "Reference", value: p.referenceNumber },
          { label: "Status", value: isClient ? "Client" : pretty(p.status) },
          { label: "Compliance", value: pretty(p.complianceFile?.status ?? "not started") },
          { label: "Services", value: services.length ? services.map(pretty).join(", ") : "—" },
          { label: "Created", value: fmtDate(p.createdAt) },
        ],
      },
      ...(p.details.length
        ? [{
            title: "Submission",
            fields: p.details.map((d) => ({ label: prettyLabel(d.fieldName), value: d.fieldValue })),
          }]
        : []),
    ];

    records.push({
      key: `p-${p.id}`,
      name: p.user.fullName,
      email: p.user.email,
      service: svc,
      type: isClient ? "Client" : "Applicant",
      stage: isClient ? "Client" : p.status,
      detail: p.referenceNumber,
      prospectId: p.id,
      canMakeClient: !isClient && p.status === "approved",
      submissionHref: `/admin/submissions/${p.referenceNumber}`,
      complianceHref: `/admin/submissions/${p.referenceNumber}/compliance`,
      clientHref: p.client ? `/admin/clients/${p.client.id}` : undefined,
      country,
      passports,
      countryCell: <Jurisdiction country={country} />,
      passportsCell: <JurisdictionStack countries={splitCountries(passports)} />,
      routes: routePills(services[0] ?? null, {
        nationality: passports ?? "",
        relocate: services.includes("immigration") ? "Yes" : "",
        services: services.join(", "),
      }),
      sections,
    });
  }

  const inTab = (r: CrmRecord, t: Tab) =>
    t === "all" ? true
    : t === "leads" ? r.type === "Lead"
    : t === "clients" ? r.type === "Client"
    : r.type === "Applicant";

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" }, { key: "leads", label: "Leads" },
    { key: "applicants", label: "Applicants" }, { key: "clients", label: "Clients" },
  ];
  const counts = Object.fromEntries(TABS.map((t) => [t.key, records.filter((r) => inTab(r, t.key)).length])) as Record<Tab, number>;
  const visible = records.filter((r) => inTab(r, tab));

  return (
    <AdminShell active="leads">
      <div className="mb-12">
        <div className="eyebrow mb-2">Pipeline</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Leads / CRM</h2>
        <p className="mt-2 max-w-[60ch] text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          One pipeline across the whole funnel: lead → registered → applicant in review → client.
          Click a record for the full picture and its next step.
        </p>
      </div>

      <div className="chips mb-6">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "all" ? "/admin/crm" : `/admin/crm?tab=${t.key}`} className={`chip${tab === t.key ? " active" : ""}`}>
            {t.label}<span className="chip-n">{counts[t.key]}</span>
          </Link>
        ))}
      </div>

      <CrmTable records={visible} />
    </AdminShell>
  );
}
