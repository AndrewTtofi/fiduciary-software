/**
 * Test-only endpoint: given a prospect's referenceNumber, this:
 *  1. Creates a ComplianceFile for the prospect (if missing) set to "cleared"
 *  2. Returns the prospectId and complianceFileId
 *
 * Only available when ALLOW_TEST_RESET=1.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "test" && process.env.ALLOW_TEST_RESET !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({})) as { referenceNumber?: string; email?: string };

  let prospect = null;
  if (body.referenceNumber) {
    prospect = await prisma.prospect.findUnique({ where: { referenceNumber: body.referenceNumber } });
  } else if (body.email) {
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user) {
      prospect = await prisma.prospect.findUnique({ where: { userId: user.id } });
    }
  }

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  // Upsert compliance file as "cleared"
  const complianceFile = await prisma.complianceFile.upsert({
    where: { prospectId: prospect.id },
    create: {
      prospectId: prospect.id,
      status: "cleared",
      riskRating: "low",
      signedOffAt: new Date(),
      signedOffNote: "Auto-cleared by test setup",
    },
    update: {
      status: "cleared",
      riskRating: "low",
      signedOffAt: new Date(),
      signedOffNote: "Auto-cleared by test setup",
    },
  });

  return NextResponse.json({
    ok: true,
    prospectId: prospect.id,
    complianceFileId: complianceFile.id,
    referenceNumber: prospect.referenceNumber,
  });
}
