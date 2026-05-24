import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { addClientService } from "@/lib/services/client-services";

export const runtime = "nodejs";

const schema = z.object({
  serviceType: z.string().min(1).max(60),
  assignedPartnerId: z.string().uuid().nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const cs = await addClientService(id, body.data, me.id);
  return NextResponse.json({ ok: true, id: cs.id });
}
