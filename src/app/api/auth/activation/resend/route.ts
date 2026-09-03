import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { resendActivationFromToken } from "@/lib/services/lead-activation";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(16).max(200) });

/**
 * Public "request a new link" from an expired or used activation page. The old
 * token identifies the lead, so nothing is typed and nothing about who holds
 * the address is revealed: the answer is always "if this link was yours, a new
 * one is on its way".
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit({ bucket: "activation", key: ip, limit: 5, windowSec: 3600 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  try {
    await resendActivationFromToken(parsed.data.token);
  } catch (e) {
    console.error("[activation] resend failed:", e);
  }
  return NextResponse.json({ ok: true });
}
