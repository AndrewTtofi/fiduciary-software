import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { provisionProspectAccount } from "@/lib/services/users";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  fullName: z.string().min(2).max(150),
  phone: z.string().max(40).optional(),
});

/** Staff-provisioned client account — pre-verified, one-time password. */
export async function POST(req: Request) {
  const actor = await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const result = await provisionProspectAccount({ ...parsed.data, actorId: actor.id });
  if (!result.ok) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  return NextResponse.json({ ok: true, email: result.user.email, tempPassword: result.tempPassword });
}
