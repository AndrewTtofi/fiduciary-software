import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const label = z.string().trim().min(2).max(60);
const schema = z.object({
  key: z.string().max(60),
  stageLabels: z.object({
    pending: label,
    in_progress: label,
    completed: label,
  }),
});

/** Update the client-facing stage wording for one service. Deliberately
 *  staff-gated (not super-admin): the whole point is that the firm edits the
 *  wording themselves, without a developer or the platform operator. */
export async function PATCH(req: Request) {
  await assertRole("staff");
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const service = await prisma.service.findUnique({ where: { key: body.data.key }, select: { id: true } });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  await prisma.service.update({
    where: { id: service.id },
    data: { stageLabels: body.data.stageLabels },
  });
  return NextResponse.json({ ok: true });
}
