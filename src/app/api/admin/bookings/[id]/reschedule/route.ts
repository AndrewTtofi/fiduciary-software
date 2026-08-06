import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { rescheduleBooking } from "@/lib/services/booking";

export const runtime = "nodejs";

const schema = z.object({
  startUtc: z.string().min(1),
  note: z.string().max(500).optional(),
}).strict();

const MESSAGE: Record<string, string> = {
  NOT_FOUND: "That consultation no longer exists.",
  NOT_RESCHEDULABLE: "Only a confirmed consultation can be moved.",
  BAD_SLOT: "That time is not one of your consultation slots. Check Bookings → Consultation hours.",
  UNCHANGED: "That is already when the consultation is booked.",
  SLOT_TAKEN: "The adviser is not free then — another booking or calendar entry covers it.",
};

/** Move a confirmed consultation. Staff-only; the attendee is emailed a
 *  replacement invite and the adviser's calendar entry is rewritten. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const res = await rescheduleBooking({
    bookingId: id,
    startUtc: new Date(parsed.data.startUtc),
    actorId: me.id,
    note: parsed.data.note?.trim() || undefined,
  });

  if (!res.ok) {
    const status = res.reason === "NOT_FOUND" ? 404 : res.reason === "SLOT_TAKEN" ? 409 : 422;
    return NextResponse.json({ error: MESSAGE[res.reason] ?? "Could not move it." }, { status });
  }

  return NextResponse.json({ ok: true, startsAt: res.booking.startsAt, previous: res.previous });
}
