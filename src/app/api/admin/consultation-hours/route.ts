import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { expandRanges, isValidTimeZone, parseRange } from "@/lib/services/settings";

export const runtime = "nodejs";

const schema = z.object({
  days: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day"),
  ranges: z.array(z.string()).min(1, "Add at least one working window"),
  intervalMins: z.number().int().min(5).max(480),
  minutes: z.number().int().min(5).max(480),
  noticeMins: z.number().int().min(0).max(60 * 24 * 14),
  horizonDays: z.number().int().min(1).max(120),
  timezone: z.string().min(1),
}).strict();

export async function PATCH(req: Request) {
  await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
  }
  const { days, ranges, intervalMins, minutes, noticeMins, horizonDays, timezone } = parsed.data;

  // A malformed window or an unknown zone would throw inside Intl on every slot
  // calculation, emptying the public picker — reject rather than store it.
  const bad = ranges.find((r) => parseRange(r) === null);
  if (bad) {
    return NextResponse.json(
      { error: `“${bad}” is not a valid window. Use HH:MM-HH:MM, ending after it starts.` },
      { status: 422 },
    );
  }
  if (!isValidTimeZone(timezone)) {
    return NextResponse.json({ error: "That is not a time zone this server recognises." }, { status: 422 });
  }

  const parsedRanges = ranges.map(parseRange).filter((r) => r !== null);
  if (expandRanges(parsedRanges, intervalMins, minutes).length === 0) {
    return NextResponse.json(
      { error: "Those windows produce no slots — a window is too short to hold one consultation." },
      { status: 422 },
    );
  }
  const cleanRanges = [...new Set(parsedRanges.map((r) => `${r.start}-${r.end}`))].sort();

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: {
      consultDays: [...new Set(days)].sort((a, b) => a - b),
      consultRanges: cleanRanges,
      consultIntervalMins: intervalMins,
      consultMinutes: minutes,
      consultNoticeMins: noticeMins,
      consultHorizonDays: horizonDays,
      consultTimezone: timezone,
    },
    create: {
      id: "singleton",
      consultDays: [...new Set(days)].sort((a, b) => a - b),
      consultRanges: cleanRanges,
      consultIntervalMins: intervalMins,
      consultMinutes: minutes,
      consultNoticeMins: noticeMins,
      consultHorizonDays: horizonDays,
      consultTimezone: timezone,
    },
  });

  return NextResponse.json({ ok: true });
}
