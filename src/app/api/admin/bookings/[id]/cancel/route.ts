import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { cancelBookingAsStaff } from "@/lib/services/booking";

export const runtime = "nodejs";

const schema = z.object({ note: z.string().max(500).optional() }).strict();

const MESSAGE: Record<string, string> = {
  NOT_FOUND: "That consultation no longer exists.",
  NOT_CANCELLABLE: "Only a confirmed consultation can be cancelled.",
};

/** Cancel a consultation as the firm. Staff-only; the attendee is emailed. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const res = await cancelBookingAsStaff({
    bookingId: id,
    actorId: me.id,
    note: parsed.data.note?.trim() || undefined,
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: MESSAGE[res.reason] ?? "Could not cancel it." },
      { status: res.reason === "NOT_FOUND" ? 404 : 422 },
    );
  }
  return NextResponse.json({ ok: true });
}
