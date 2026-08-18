import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertRole } from "@/lib/auth/guards";
import { storage } from "@/lib/providers/storage";
import { logActivity } from "@/lib/services/activity";

export const runtime = "nodejs";

/**
 * Stream a document's plaintext to an authorized user.
 *  - Staff: any doc
 *  - Prospect/Client owner: their own docs
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertRole("prospect", "client", "staff");
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { prospect: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = authorizeDocAccess(doc, user.id, user.role);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logActivity({
    entityType: "document",
    entityId: doc.id,
    action: "document.viewed",
    actorId: user.id,
  });

  const encMeta = doc.encMeta as unknown as { alg: "aes-256-gcm"; ivB64: string; tagB64: string; keyId: string };
  const stream = await storage().getStream(doc.storageKey, encMeta);

  // Encode stream into a Web ReadableStream for NextResponse
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": doc.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalName)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function authorizeDocAccess(
  doc: { prospectId: string; prospect: { userId: string } },
  userId: string,
  role: string,
): boolean {
  if (role === "staff") return true;
  if (role === "prospect" || role === "client") {
    return doc.prospect.userId === userId;
  }
  return false;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertRole("prospect", "client", "staff");
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, include: { prospect: true } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "staff" && doc.prospect.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await storage().delete(doc.storageKey).catch(() => undefined);
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
