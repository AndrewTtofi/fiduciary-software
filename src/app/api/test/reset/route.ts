import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import argon2 from "argon2";

export const runtime = "nodejs";

const DOMAIN_TABLES = [
  "DocumentRequest", "Message", "InternalNote", "Booking",
  "ReviewTask", "ScreeningHit", "ScreeningRun", "KycCase", "Party", "ComplianceFile",
  "Document", "KeyDate", "ClientService", "Client", "Prospect",
  "ActivityLog", "PasswordReset", "VerificationToken", "Session", "Account",
  "User", "OrgSettings", "Service", "FeatureFlag",
];

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "test" && process.env.ALLOW_TEST_RESET !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${DOMAIN_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
  const url = new URL(req.url);
  if (url.searchParams.get("seed") === "1") {
    // Declare the plan tier the e2e suite exercises rather than inheriting the
    // schema default. That default is "starter" (a deployment nobody
    // configured should get the entry product), which turns onboarding into
    // two steps and hides the documents workspace — so leaving it implicit
    // made a product decision about defaults fail the onboarding and
    // document-request journeys.
    await prisma.orgSettings.upsert({
      where: { id: "singleton" },
      update: { planTier: "scale" },
      create: { id: "singleton", planTier: "scale" },
    });

    const hash = await argon2.hash("oroDemo!1", { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: "staff@axenorconsulting.com" },
      create: { email: "staff@axenorconsulting.com", passwordHash: hash, fullName: "Staff One", role: "staff", emailVerified: new Date() },
      update: { passwordHash: hash, fullName: "Staff One", role: "staff", emailVerified: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
