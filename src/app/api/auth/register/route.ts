import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schema/auth";
import { registerProspect } from "@/lib/services/auth-flows";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await getClientLoginEnabled())) {
    return NextResponse.json(
      { error: "New client sign-ups are currently disabled — please book a consultation instead." },
      { status: 403 },
    );
  }
  const limited = await rateLimit({ bucket: "register", key: ipOf(req), limit: 5, windowSec: 600 });
  if (!limited.ok) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join(", ") },
      { status: 422 },
    );
  }

  const result = await registerProspect(parsed.data);
  if (!result.ok) {
    // Say so plainly. The old "we've sent a verification link" wording was
    // untrue (accounts are pre-verified, no mail goes out) and, returned with
    // a 200, sent the sign-up form straight into a sign-in with the new
    // password — which failed as "Invalid email or password". Existence is
    // not a secret worth that confusion here: a wrong-password sign-in
    // reveals it anyway.
    return NextResponse.json(
      { error: "An account with that email already exists. Sign in instead, or use \"Forgot password\" if you no longer have it." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}

function ipOf(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
