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
    const hash = await argon2.hash("oroDemo!1", { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: "staff@oro.local" },
      create: { email: "staff@oro.local", passwordHash: hash, fullName: "Staff One", role: "staff", emailVerified: new Date() },
      update: { passwordHash: hash, fullName: "Staff One", role: "staff", emailVerified: new Date() },
    });
    await prisma.user.upsert({
      where: { email: "partner@oro.local" },
      create: { email: "partner@oro.local", passwordHash: hash, fullName: "Partner One", role: "partner", emailVerified: new Date() },
      update: { passwordHash: hash, fullName: "Partner One", role: "partner", emailVerified: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
