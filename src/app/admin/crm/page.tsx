import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { computeLeadFlags, listLeads } from "@/lib/services/leads";
import { Jurisdiction, JurisdictionStack, splitCountries } from "@/components/admin/Flag";
import { ExportButton } from "@/components/admin/ExportButton";
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

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ tab?: string; open?: string }> }) {
  await requireRole("staff");
  const sp = await searchParams;
  const tab = (sp.tab ?? "all") as Tab;
  const openKey = sp.open ?? null;

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

  // Booked calls per lead — the drawer shows the slot and the activation
  // action reads "after the call".
  const leadBookings = await prisma.booking.findMany({
    where: { leadId: { in: leads.map((l) => l.id) }, status: { in: ["confirmed", "completed"] } },
    orderBy: { startsAt: "desc" },
    select: { leadId: true, startsAt: true, timezone: true },
  });
  const bookingByLead = new Map<string, { startsAt: Date; timezone: string }>();
  for (const b of leadBookings) if (b.leadId && !bookingByLead.has(b.leadId)) bookingByLead.set(b.leadId, b);

  // A lead that has been activated (post-call link) or converted continues
  // its journey as the applicant/client record — don't show it twice. A lead
  // whose email merely matches an existing account (a returning client
  // booking again, say) stays visible, flagged, so no enquiry disappears.
  const accountEmails = new Set([
    ...prospects.map((p) => p.user.email.toLowerCase()),
    ...registeredOnly.map((u) => u.email.toLowerCase()),
  ]);

  // Build the whole funnel, then filter for display — the chips need counts
  // for every tab, not just the one being viewed.
  const records: CrmRecord[] = [];

  {
    for (const l of leads) {
      if (l.stage === "activated" || l.stage === "converted") continue;
      const existingAccount = accountEmails.has(l.email.toLowerCase());
      const meta = (l.meta ?? {}) as Record<string, string>;
      const booking = bookingByLead.get(l.id);
      const bits = [
        l.note ?? (l.source === "contact" ? "Website booking" : l.source),
        booking ? `Call ${fmtDate(booking.startsAt)}` : meta.preferredSlotLabel && `Prefers ${meta.preferredSlotLabel}`,
        l.phone && `☎ ${l.phone}`,
        meta.country && `From ${meta.country}`,
        l.activationSentAt && `Link sent ${fmtDate(l.activationSentAt)}`,
        existingAccount && "Has an account",
      ].filter(Boolean);
      records.push({
        key: `lead-${l.id}`,
        name: l.name ?? "(anonymous lead)",
        email: l.email,
        service: pretty(l.serviceKey),
        type: "Lead",
        stage: l.stage === "onboarding_sent" ? "onboarding_sent" : "Lead",
        detail: bits.join(" · "),
        leadId: l.id,
        activationSentAt: l.activationSentAt ? fmtDate(l.activationSentAt) : null,
        existingAccount,
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
              ...(booking ? [{ label: "Booked call", value: `${fmtDate(booking.startsAt)} (${booking.timezone})` }] : []),
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
              ...(l.activationSentAt ? [{ label: "Onboarding link sent", value: fmtDate(l.activationSentAt) }] : []),
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
      canMakeClient: !isClient && p.status === "approved" && p.complianceFile?.status === "cleared",
      makeClientBlocker: isClient ? undefined
        : p.status !== "approved" ? "Approve the submission before converting."
        : !p.complianceFile ? "No compliance file yet — open compliance to start it."
        : p.complianceFile.status === "blocked" ? "Compliance file is blocked."
        : p.complianceFile.status !== "cleared" ? "Clear the compliance review to convert."
        : undefined,
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
  // A deep link (?open=lead-…) must be able to open its record whatever tab
  // is active.
  const visible = records.filter((r) => inTab(r, tab) || r.key === openKey);

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

      <div className="row-between mb-6" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div className="chips">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key === "all" ? "/admin/crm" : `/admin/crm?tab=${t.key}`} className={`chip${tab === t.key ? " active" : ""}`}>
              {t.label}<span className="chip-n">{counts[t.key]}</span>
            </Link>
          ))}
        </div>
        <ExportButton kind="leads" />
      </div>

      <CrmTable records={visible} initialOpenKey={openKey} />
    </AdminShell>
  );
}
