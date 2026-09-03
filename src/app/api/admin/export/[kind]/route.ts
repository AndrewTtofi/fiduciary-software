import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { buildWorkbook, EXPORT_KINDS, type ExportKind } from "@/lib/services/export";

export const runtime = "nodejs";

/** Staff-only Excel export of the submissions, leads or clients table.
 *  Served as an attachment and never cached — it is a full dump of personal
 *  data, so it must not linger in a shared or proxy cache. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  await assertRole("staff");
  const { kind } = await params;
  if (!(EXPORT_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await buildWorkbook(kind as ExportKind);
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${kind}-${day}.xlsx"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
