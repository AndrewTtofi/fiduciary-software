import { NextResponse } from "next/server";
import { blockBelowTier } from "@/lib/auth/tier-guard";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { createDocumentRequest } from "@/lib/services/document-requests";
import { email } from "@/lib/providers/email";
import { getServerBranding } from "@/lib/services/branding-server";
import { env } from "@/lib/env";
import { getClientLoginEnabled } from "@/lib/services/settings";

export const runtime = "nodejs";

const schema = z.object({
  description: z.string().min(3).max(500),
  serviceTypeKey: z.string().max(60).nullable().optional(),
  dueAt: z.string().date().nullable().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tierBlock = await blockBelowTier("professional");
  if (tierBlock) return tierBlock;
  const me = await assertRole("staff");
  const { id } = await params;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const client = await prisma.client.findUnique({ where: { id }, include: { user: { select: { email: true, fullName: true } } } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Requesting a document is a portal action: the client fulfils it by
  // uploading. With the portal off they could never see or action it, and the
  // email would tell them to log in somewhere they cannot. Refuse rather than
  // create a request nobody will ever answer.
  if (!(await getClientLoginEnabled())) {
    return NextResponse.json(
      { error: "The client portal is switched off, so clients cannot receive or fulfil document requests." },
      { status: 409 },
    );
  }

  const created = await createDocumentRequest(id, body.data, me.id);

  {
    try {
      const { brandName } = await getServerBranding();
      await email().send({
        to: client.user.email,
        subject: `${brandName} has requested a document`,
        html: `<p>Hi ${client.user.fullName},</p>
               <p>We've requested the following document:</p>
               <p><b>${escapeHtml(body.data.description)}</b></p>
               <p>You can reply to this email with the file, or log in at ${env().APP_URL} to upload it.</p>`,
      });
    } catch (e) {
      console.error("[doc-request] email failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true, id: created.id });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
