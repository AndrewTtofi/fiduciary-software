import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const rate = z.number().min(0).max(1);
const money = z.number().min(0).max(100_000_000);

const schema = z.object({
  taxYear: z.number().int().min(2020).max(2100),
  correctAsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  incomeTaxBands: z.array(z.object({ upTo: money.nullable(), rate })).min(1).max(12),
  socialInsurance: z.object({ employee: rate, employer: rate, selfEmployed: rate, ceiling: money }),
  gesy: z.object({ employee: rate, employer: rate, selfEmployed: rate, passive: rate, cap: money }),
  employerFunds: z.object({ socialCohesion: rate, redundancy: rate, hrda: rate }),
  corporateTax: rate,
  vatRates: z.array(rate).min(1).max(8),
  nonDomYears: z.number().int().min(1).max(50),
  ipBoxExemption: rate,
  digitalNomad: z.object({ minMonthlyIncome: money.nullable(), capOnPlaces: z.number().int().min(0).nullable() }),
  permanentResidencyProperty: money,
  calendar: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        title: z.string().min(2).max(160),
        applies: z.array(z.enum(["individuals", "companies", "employers"])).min(1),
        frequency: z.enum(["monthly", "quarterly", "annual"]),
        rule: z.enum(["end-of-following-month", "day-of-following-month", "quarter-second-month", "fixed"]),
        day: z.number().int().min(1).max(31).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        detail: z.string().max(600),
        confirm: z.boolean().optional(),
      }),
    )
    .max(60),
});

/** Save the editable rates + calendar behind the public tools. Staff-only. */
export async function PATCH(req: Request) {
  await assertRole("staff");
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  await prisma.toolSettings.upsert({
    where: { id: "singleton" },
    update: { data: parsed.data },
    create: { id: "singleton", data: parsed.data },
  });
  return NextResponse.json({ ok: true });
}
