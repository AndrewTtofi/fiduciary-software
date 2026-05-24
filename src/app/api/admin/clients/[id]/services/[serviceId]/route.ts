import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { updateClientService, removeClientService } from "@/lib/services/client-services";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  assignedPartnerId: z.string().uuid().nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; serviceId: string }> }) {
  const me = await assertRole("staff");
  const { serviceId } = await params;
  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  await updateClientService(serviceId, body.data, me.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; serviceId: string }> }) {
  const me = await assertRole("staff");
  const { serviceId } = await params;
  try {
    await removeClientService(serviceId, me.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
