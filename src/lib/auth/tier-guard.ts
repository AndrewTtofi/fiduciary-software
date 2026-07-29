import { NextResponse } from "next/server";
import { getBranding, tierAtLeast, type PlanTier } from "@/lib/services/branding";

/** API-route guard for plan-tier walls. Returns a 403 response when the
 *  deployment's plan is below `required`, or null when the call may proceed.
 *  Hidden UI is not security — every gated module's routes must call this. */
export async function blockBelowTier(required: PlanTier): Promise<NextResponse | null> {
  const { planTier } = await getBranding();
  if (tierAtLeast(planTier, required)) return null;
  return NextResponse.json({ error: "Not available on this plan" }, { status: 403 });
}
