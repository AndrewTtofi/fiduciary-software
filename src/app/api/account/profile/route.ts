import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { updateClientSelfProfile } from "@/lib/services/client-portal";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).nullable().optional(),
  languagePref: z.enum(["en", "ru"]).optional(),
  address: z.string().max(500).nullable().optional(),
  taxResidency: z.string().length(2).nullable().optional(),
}).strict();

export async function POST(req: Request) {
  const user = await assertRole("prospect", "client", "staff", "partner");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  try {
    await updateClientSelfProfile(user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
