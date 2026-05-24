import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { uploadClientDocument } from "@/lib/services/client-portal";
import { MAX_BYTES } from "@/lib/services/documents";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await assertRole("prospect", "client");

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form payload" }, { status: 400 });

  const file = form.get("file");
  const serviceTypeKey = form.get("serviceTypeKey")?.toString() || null;
  const fulfillsRequestId = form.get("fulfillsRequestId")?.toString() || null;

  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await uploadClientDocument(user.id, {
      file: buffer,
      originalName: file.name,
      mime: file.type || "application/octet-stream",
      serviceTypeKey,
      fulfillsRequestId,
    });
    if (!("ok" in result) || !result.ok) {
      return NextResponse.json({ error: ("reason" in result ? result.reason : "Upload failed") }, { status: 422 });
    }
    return NextResponse.json({ ok: true, documentId: result.doc.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
