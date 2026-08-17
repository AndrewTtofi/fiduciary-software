import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const str = (max = 600) => z.string().max(max);

const schema = z.object({
  hero: z.object({
    eyebrow: str(120), display: str(300), lead: str(1000),
    primaryCta: str(60), secondaryCta: str(60),
  }),
  stats: z.array(z.object({ v: str(40), l: str(120) })).max(8),
  servicesIntro: z.object({ heading: str(200), body: str(600) }),
  how: z.object({
    heading: str(200), sub: str(400),
    steps: z.array(z.object({ t: str(120), d: str(600) })).max(6),
  }),
  cta: z.object({ heading: str(200), body: str(800), button: str(60) }),
  insights: z.object({ kicker: str(120), heading: str(300), body: str(800) }),
  contact: z.object({
    address: str(200), phone: str(40), whatsapp: str(40), email: str(200),
    regNo: str(40), vatNo: str(40), linkedin: str(300), facebook: str(300),
    parking: str(300), hours: str(200), footerAbout: str(300),
  }),
  faq: z.array(z.object({ q: str(300), a: str(2000) })).max(40),
  consultation: z.object({
    heading: str(200), body: str(3000),
    personName: str(120), personTitle: str(160), photoUrl: str(500), photoNote: str(300),
    points: z.array(str(300)).max(8),
  }),
  about: z.object({
    story: str(3000), how: str(3000), whatWeDoIntro: str(300),
    why: z.array(z.object({ t: str(120), d: str(600) })).max(8),
    people: z.array(z.object({ name: str(120), title: str(160), bio: str(1000) })).max(8),
  }),
});

/** Save the full marketing-content blob. Staff-only. */
export async function PATCH(req: Request) {
  await assertRole("staff");
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  await prisma.siteContent.upsert({
    where: { id: "singleton" },
    update: { data: parsed.data },
    create: { id: "singleton", data: parsed.data },
  });
  return NextResponse.json({ ok: true });
}
