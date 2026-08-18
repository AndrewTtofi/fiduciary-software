import { prisma } from "@/lib/db";
import {
  DEFAULT_CONSULTATION_HOURS, expandRanges, isValidTimeZone, parseRange,
  type ConsultationHours, type TimeRange,
} from "./consultation-hours";

// Re-exported so existing imports from "@/lib/services/settings" keep working.
export {
  DEFAULT_CONSULTATION_HOURS, DEFAULT_RANGES, expandRanges, isValidTimeZone, parseHhMm, parseRange,
  type ConsultationHours, type TimeRange,
} from "./consultation-hours";
import { SERVICE_KEYS } from "@/lib/schema/onboarding";

/** Known feature-flag keys exposed in the admin UI. Adding a key here makes it
 *  show up on /admin/settings/flags. The corresponding env-presence check lives
 *  alongside in `KNOWN_FLAGS`. */
export const KNOWN_FLAGS = [
  { key: "googleOAuth",   label: "Google OAuth sign-in",   envHint: "GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET" },
  { key: "linkedinOAuth", label: "LinkedIn OAuth sign-in", envHint: "LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET" },
  { key: "whatsapp",      label: "WhatsApp notifications", envHint: "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM" },
  { key: "calendarBusy",  label: "Staff calendar availability (Google / Outlook)", envHint: "CALENDAR_BUSY_DRIVER + driver credentials" },
] as const;

export type FlagKey = (typeof KNOWN_FLAGS)[number]["key"];

/** Onboarding document-upload phase modes (OrgSettings.documentsPhase). */
export type DocumentsPhase = "mandatory" | "optional" | "off";

/** Read the configured onboarding document-upload phase mode (defaults to
 *  "mandatory" for any unexpected stored value). On the Starter plan the
 *  platform is a pure status tracker — uploads are always off, regardless of
 *  the stored setting. (Tier compared inline: importing tierAtLeast from the
 *  branding service here would create an import cycle.) */
export async function getDocumentsPhase(): Promise<DocumentsPhase> {
  const org = await getOrgSettings();
  if (org.planTier === "starter") return "off";
  const v = org.documentsPhase;
  return v === "optional" || v === "off" ? v : "mandatory";
}

/** Whether clients/prospects may sign in to the portal. When disabled, the
 *  public site hides client login/sign-up and only consultation booking is
 *  offered; staff sign-in is unaffected. */
export async function getClientLoginEnabled(): Promise<boolean> {
  const org = await getOrgSettings();
  return org.clientLoginEnabled;
}

/** The firm's consultation schedule, with anything missing or malformed
 *  falling back to the defaults — a broken row must never empty the picker. */
export async function getConsultationHours(): Promise<ConsultationHours> {
  const org = await getOrgSettings();
  const d = DEFAULT_CONSULTATION_HOURS;

  const days = Array.isArray(org.consultDays) && org.consultDays.length
    ? [...new Set(org.consultDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort((a, b) => a - b)
    : d.days;

  const parsedRanges = Array.isArray(org.consultRanges)
    ? org.consultRanges.map(parseRange).filter((r): r is TimeRange => r !== null)
    : [];
  const ranges = parsedRanges.length ? parsedRanges : d.ranges;
  const intervalMins = org.consultIntervalMins > 0 ? org.consultIntervalMins : d.intervalMins;
  const minutes = org.consultMinutes > 0 ? org.consultMinutes : d.minutes;
  const times = expandRanges(ranges, intervalMins, minutes);

  return {
    days: days.length ? days : d.days,
    ranges,
    intervalMins,
    times: times.length ? times : d.times,
    minutes,
    noticeMins: org.consultNoticeMins >= 0 ? org.consultNoticeMins : d.noticeMins,
    horizonDays: org.consultHorizonDays > 0 ? Math.min(org.consultHorizonDays, 120) : d.horizonDays,
    timezone: isValidTimeZone(org.consultTimezone) ? org.consultTimezone : d.timezone,
  };
}


const DEFAULT_SERVICE_LABELS: Record<string, string> = {
  company_formation: "Company Formation",
  accounting: "Accounting",
  tax_residency: "Tax Residency",
  immigration: "Immigration",
  licensing: "Licensing",
  banking: "Banking",
};

/** Returns the singleton org row, creating it on first access. Race-safe: many
 *  pages may read branding concurrently (e.g. during a build/prerender), so a
 *  lost create() race falls back to re-reading the now-existing row. */
export async function getOrgSettings() {
  const existing = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  try {
    return await prisma.orgSettings.create({ data: { id: "singleton" } });
  } catch {
    return (await prisma.orgSettings.findUnique({ where: { id: "singleton" } }))!;
  }
}

/** Returns all services in admin sort order. Auto-seeds the hard-coded
 *  SERVICE_KEYS the first time the table is empty so the app behaves the same
 *  as before any taxonomy edits. */
export async function getServices(opts: { activeOnly?: boolean } = {}) {
  const count = await prisma.service.count();
  if (count === 0) {
    await prisma.service.createMany({
      data: SERVICE_KEYS.map((key, i) => ({
        key,
        label: DEFAULT_SERVICE_LABELS[key] ?? key,
        sortOrder: i,
      })),
    });
  }
  return prisma.service.findMany({
    where: opts.activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

/* ── service status-stage wording ───────────────────────────────────── */

/** The three progress stages of a client service (ClientService.status). The
 *  underlying enum is fixed; only the wording is editable. */
export const SVC_STAGES = ["pending", "in_progress", "completed"] as const;
export type SvcStageKey = (typeof SVC_STAGES)[number];

export const DEFAULT_STAGE_LABELS: Record<SvcStageKey, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

/** Sensible wording per service, so the editor explains itself. "Pending /
 *  In progress / Completed" told a client nothing and made the settings page
 *  look like six copies of the same empty form. */
export const SERVICE_STAGE_DEFAULTS: Record<string, Record<SvcStageKey, string>> = {
  company_formation: { pending: "Documents received", in_progress: "Submitted to the Registrar", completed: "Company registered" },
  accounting:        { pending: "Records received",   in_progress: "Bookkeeping in progress",     completed: "Filed and up to date" },
  tax_residency:     { pending: "Documents received", in_progress: "Application filed",           completed: "Certificate issued" },
  immigration:       { pending: "Documents received", in_progress: "With the immigration authority", completed: "Permit granted" },
  licensing:         { pending: "Scope agreed",       in_progress: "With the regulator",          completed: "Licence granted" },
  banking:           { pending: "Introduction made",  in_progress: "Bank review in progress",     completed: "Account opened" },
};

/** Merge a stored Service.stageLabels JSON over the defaults, ignoring
 *  anything malformed. Falls back to the service's own wording when the firm
 *  has not customised it. */
export function readStageLabels(value: unknown, serviceKey?: string): Record<SvcStageKey, string> {
  const out = { ...(serviceKey ? SERVICE_STAGE_DEFAULTS[serviceKey] ?? DEFAULT_STAGE_LABELS : DEFAULT_STAGE_LABELS) };
  if (value && typeof value === "object") {
    for (const stage of SVC_STAGES) {
      const v = (value as Record<string, unknown>)[stage];
      if (typeof v === "string" && v.trim()) out[stage] = v.trim();
    }
  }
  return out;
}

/** Stage wording per service key, defaults filled in. Staff edit these at
 *  /admin/status-stages; the client portal and admin status pickers all
 *  read from here so a wording change shows everywhere at once. */
export async function getStageLabels(): Promise<Record<string, Record<SvcStageKey, string>>> {
  const services = await getServices();
  const out: Record<string, Record<SvcStageKey, string>> = {};
  for (const s of services) out[s.key] = readStageLabels(s.stageLabels, s.key);
  return out;
}

/** Read a single flag (defaults to false if unset). */
export async function getFlag(key: FlagKey): Promise<boolean> {
  const row = await prisma.featureFlag.findUnique({ where: { key } });
  return row?.enabled ?? false;
}

export async function getAllFlags(): Promise<Record<string, boolean>> {
  const rows = await prisma.featureFlag.findMany();
  const out: Record<string, boolean> = {};
  for (const r of rows) out[r.key] = r.enabled;
  return out;
}
