import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { setDocumentStatus, deleteDocument } from "@/lib/services/documents";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["received", "under_review", "approved", "reupload_needed"]).optional(),
  serviceTypeKey: z.string().max(60).nullable().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  const body = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  if (body.data.status !== undefined) {
    await setDocumentStatus(id, body.data.status, me.id);
  }
  if (body.data.serviceTypeKey !== undefined) {
    await prisma.document.update({ where: { id }, data: { serviceTypeKey: body.data.serviceTypeKey } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  await deleteDocument(id, me.id);
  return NextResponse.json({ ok: true });
}
