import { cache } from "react";
import { getOrgSettings } from "@/lib/services/settings";
import { HOME_TOOL_KEYS, TOOLS, type Tool } from "@/lib/data/tools";

/* =====================================================================
   Per-deployment tool visibility (white-label)

   The code catalog (src/lib/data/tools.ts) defines every tool the
   platform CAN offer; OrgSettings.toolsEnabled says which of them THIS
   deployment DOES offer, as a { [toolKey]: boolean } map. Absent keys
   default to enabled — new tools ship on, and a broken row must never
   empty the public site. Every public surface that lists tools (nav,
   footers, landing sections, the /tools hub, tool pages, the sitemap)
   reads through here. Super-admin managed in Settings → Site tools.
   ===================================================================== */

function enabledMap(v: unknown): Record<string, boolean> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "boolean") out[k] = val;
  }
  return out;
}

/** The tools this deployment offers, in catalog order. Request-cached. */
export const getEnabledTools = cache(async (): Promise<Tool[]> => {
  const org = await getOrgSettings();
  const map = enabledMap(org.toolsEnabled);
  return TOOLS.filter((t) => map[t.key] !== false);
});

export async function isToolEnabled(key: string): Promise<boolean> {
  const enabled = await getEnabledTools();
  return enabled.some((t) => t.key === key);
}

/** Up to four tools for the landing-page tool sections: the curated
 *  homepage picks first (HOME_TOOL_KEYS), topped up from the remaining
 *  enabled tools when some of the curated ones are switched off. */
export async function getFeaturedTools(): Promise<Tool[]> {
  const enabled = await getEnabledTools();
  const curated = HOME_TOOL_KEYS.map((k) => enabled.find((t) => t.key === k)).filter((t): t is Tool => !!t);
  const rest = enabled.filter((t) => !curated.includes(t));
  return [...curated, ...rest].slice(0, 4);
}
