import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { issueLeadActivation } from "@/lib/services/lead-activation";

export const runtime = "nodejs";

/**
 * Send (or resend) the post-call activation link to a lead. Each call revokes
 * the previous link, so "resend" is the same action. A lead whose email already
 * has a password-protected account is told to sign in instead — never a second
 * identity for one email.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await assertRole("staff");
  const { id } = await params;

  let out;
  try {
    out = await issueLeadActivation({ leadId: id, actorId: actor.id });
  } catch (e) {
    console.error("[activation] send failed:", e);
    return NextResponse.json({ error: "The link was created but the email could not be sent. Check the email settings and resend." }, { status: 502 });
  }
  if (!out.ok) {
    return NextResponse.json(
      { error: out.reason === "NOT_FOUND" ? "Not found" : "already_registered" },
      { status: out.reason === "NOT_FOUND" ? 404 : 409 },
    );
  }
  return NextResponse.json({ ok: true, expires: out.expires.toISOString() });
}
