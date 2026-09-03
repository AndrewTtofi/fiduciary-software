import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

/* Staff-only spreadsheet exports of the three pipeline tables. Everything here
   is what the admin already sees on screen — no document contents, no
   credentials — laid out one row per record so it drops straight into the
   firm's own reporting. Dates are written as text ("03 Sep 2026 14:05"),
   not Excel serials: a serial is reinterpreted in whatever zone the
   spreadsheet opens in, and a submission stamped a day early is a
   compliance conversation nobody wants. */

type Cell = string | number | null | undefined;
type Column = { header: string; key: string; width?: number };

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).replace(",", "");
}

function pretty(s: string | null | undefined): string {
  if (!s) return "";
  return s.split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

/** camelCase / snake_case keys → "Camel Case" column headers. */
function prettyLabel(s: string): string {
  return pretty(s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase());
}

async function toBuffer(sheetName: string, columns: Column[], rows: Record<string, Cell>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "platform export";
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    // Width from the header unless a column asked for more; capped so a long
    // free-text column doesn't push the useful ones off screen.
    width: c.width ?? Math.min(48, Math.max(12, c.header.length + 4)),
  }));
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

export async function buildSubmissionsWorkbook(): Promise<Buffer> {
  const prospects = await prisma.prospect.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      details: true,
      complianceFile: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Every answer becomes its own column; the set is the union across rows so
  // a field one applicant filled in is not lost because another skipped it.
  const detailKeys: string[] = [];
  for (const p of prospects) for (const d of p.details) if (!detailKeys.includes(d.fieldName)) detailKeys.push(d.fieldName);

  const columns: Column[] = [
    { header: "Reference", key: "reference", width: 18 },
    { header: "Applicant", key: "applicant", width: 26 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Services", key: "services", width: 32 },
    { header: "Status", key: "status" },
    { header: "Brief completeness", key: "completeness" },
    { header: "Lives in", key: "livesIn", width: 20 },
    { header: "Passports", key: "passports", width: 24 },
    { header: "Compliance status", key: "compliance" },
    { header: "Submitted", key: "submitted", width: 20 },
    { header: "Reviewed at", key: "reviewedAt", width: 20 },
    ...detailKeys.map((k) => ({ header: prettyLabel(k), key: `d:${k}`, width: 24 })),
  ];

  const rows = prospects.map((p) => {
    const answer = (f: string) => p.details.find((d) => d.fieldName === f)?.fieldValue ?? "";
    const services = Array.isArray(p.servicesSelected) ? (p.servicesSelected as string[]) : [];
    const row: Record<string, Cell> = {
      reference: p.referenceNumber,
      applicant: p.user.fullName,
      email: p.user.email,
      phone: p.user.phone ?? "",
      services: services.map(pretty).join(", "),
      status: pretty(p.status),
      completeness: pretty(p.completenessOverride ?? p.completeness),
      livesIn: answer("residenceCountry") || answer("currentTaxResidency"),
      passports: answer("nationality"),
      compliance: pretty(p.complianceFile?.status ?? "not_started"),
      submitted: fmtDate(p.createdAt),
      reviewedAt: fmtDate(p.reviewedAt),
    };
    for (const d of p.details) row[`d:${d.fieldName}`] = d.fieldValue;
    return row;
  });

  return toBuffer("Submissions", columns, rows);
}

export async function buildLeadsWorkbook(): Promise<Buffer> {
  const leads = await prisma.lead.findMany({
    include: {
      bookings: { where: { status: "confirmed" }, orderBy: { startsAt: "desc" }, take: 1 },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  // The raw ISO slot is machine data behind preferredSlotLabel — skip it.
  const HIDDEN_META = new Set(["preferredSlot"]);
  const metaKeys: string[] = [];
  for (const l of leads) {
    const meta = (l.meta ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(meta)) if (!HIDDEN_META.has(k) && !metaKeys.includes(k)) metaKeys.push(k);
  }

  const columns: Column[] = [
    { header: "Name", key: "name", width: 26 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Service", key: "service", width: 22 },
    { header: "Source", key: "source" },
    { header: "Stage", key: "stage" },
    { header: "Note", key: "note", width: 40 },
    { header: "Created", key: "created", width: 20 },
    { header: "Last activity", key: "lastActivity", width: 20 },
    { header: "Booked slot", key: "bookedSlot", width: 28 },
    ...metaKeys.map((k) => ({ header: prettyLabel(k), key: `m:${k}`, width: 24 })),
  ];

  const rows = leads.map((l) => {
    const booking = l.bookings[0];
    const row: Record<string, Cell> = {
      name: l.name ?? "",
      email: l.email,
      phone: l.phone ?? "",
      service: pretty(l.serviceKey),
      source: pretty(l.source),
      stage: pretty(l.stage),
      note: l.note ?? "",
      created: fmtDate(l.createdAt),
      lastActivity: fmtDate(l.lastActivityAt),
      bookedSlot: booking
        ? `${booking.startsAt.toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: booking.timezone,
          }).replace(",", "")} (${booking.timezone})`
        : "",
    };
    const meta = (l.meta ?? {}) as Record<string, unknown>;
    for (const k of metaKeys) if (meta[k] !== undefined) row[`m:${k}`] = String(meta[k]);
    return row;
  });

  return toBuffer("Leads", columns, rows);
}

export async function buildClientsWorkbook(): Promise<Buffer> {
  const clients = await prisma.client.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      primaryStaff: { select: { fullName: true } },
      prospect: { select: { referenceNumber: true } },
      services: true,
      keyDates: { where: { status: { in: ["upcoming", "overdue"] } }, orderBy: { dueDate: "asc" }, take: 1 },
      complianceFile: { select: { status: true, riskRating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns: Column[] = [
    { header: "Client", key: "client", width: 26 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Company", key: "company", width: 26 },
    { header: "Status", key: "status" },
    { header: "Country", key: "country", width: 18 },
    { header: "Services", key: "services", width: 32 },
    { header: "Primary staff", key: "primaryStaff", width: 22 },
    { header: "Since", key: "since", width: 20 },
    { header: "Next key date", key: "nextKeyDate", width: 36 },
    { header: "Compliance status", key: "compliance" },
    { header: "Risk rating", key: "risk" },
    { header: "Reference", key: "reference", width: 18 },
  ];

  const rows = clients.map((c) => {
    const kd = c.keyDates[0];
    const row: Record<string, Cell> = {
      client: c.user.fullName,
      email: c.user.email,
      phone: c.user.phone ?? "",
      company: c.companyName ?? "",
      status: pretty(c.status),
      country: c.country ?? "",
      services: c.services.map((s) => pretty(s.serviceType)).join(", "),
      primaryStaff: c.primaryStaff.fullName,
      since: fmtDate(c.createdAt),
      nextKeyDate: kd ? `${kd.description} — ${fmtDate(kd.dueDate)}${kd.status === "overdue" ? " (overdue)" : ""}` : "",
      compliance: pretty(c.complianceFile?.status ?? "not_started"),
      risk: pretty(c.complianceFile?.riskRating),
      reference: c.prospect.referenceNumber,
    };
    return row;
  });

  return toBuffer("Clients", columns, rows);
}

export const EXPORT_KINDS = ["submissions", "leads", "clients"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export function buildWorkbook(kind: ExportKind): Promise<Buffer> {
  return kind === "submissions" ? buildSubmissionsWorkbook()
    : kind === "leads" ? buildLeadsWorkbook()
    : buildClientsWorkbook();
}
