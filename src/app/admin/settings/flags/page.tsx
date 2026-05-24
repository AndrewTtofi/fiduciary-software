import { KNOWN_FLAGS, getAllFlags } from "@/lib/services/settings";
import { FlagsTable, type FlagRow } from "./FlagsTable";

export const metadata = { title: "Feature flags · Settings" };
export const dynamic = "force-dynamic";

function envPresentFor(key: string): boolean {
  switch (key) {
    case "googleOAuth":   return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "linkedinOAuth": return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    case "whatsapp":      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
    default:              return false;
  }
}

export default async function FlagsSettingsPage() {
  const stored = await getAllFlags();
  const rows: FlagRow[] = KNOWN_FLAGS.map((f) => ({
    key: f.key,
    label: f.label,
    envHint: f.envHint,
    enabled: stored[f.key] ?? false,
    envPresent: envPresentFor(f.key),
  }));
  return <FlagsTable initial={rows} />;
}
