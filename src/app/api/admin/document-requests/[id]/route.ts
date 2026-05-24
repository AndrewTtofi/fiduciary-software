import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { cancelDocumentRequest, updateDocumentRequest } from "@/lib/services/document-requests";

export const runtime = "nodejs";

const schema = z.union([
  z.object({ state: z.literal("cancelled") }),
  z.object({
    description: z.string().min(3).max(500).optional(),
    dueAt: z.string().date().nullable().optional(),
  }).refine((v) => v.description !== undefined || v.dueAt !== undefined, { message: "Provide description or dueAt" }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  try {
    if ("state" in body.data && body.data.state === "cancelled") {
      await cancelDocumentRequest(id, me.id);
    } else {
      const { description, dueAt } = body.data as { description?: string; dueAt?: string | null };
      await updateDocumentRequest(id, { description, dueAt }, me.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
