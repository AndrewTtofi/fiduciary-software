import { NextResponse } from "next/server";
import { listPublicAvailability } from "@/lib/services/booking";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Free consultation slots for the public Calendly-style picker: the Cyprus
 *  working-hour grid minus internal bookings minus the connected staff
 *  calendar's busy time. Anonymous by design — instants only, no staff
 *  identity, no event details. */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit({ bucket: "slots", key: ip, limit: 120, windowSec: 3600 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const slots = await listPublicAvailability().catch(() => [] as Date[]);
  return NextResponse.json({ slots: slots.map((d) => d.toISOString()) });
}
