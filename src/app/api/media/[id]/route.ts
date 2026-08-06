import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/* Public image delivery for the marketing site. No auth by design — these are
   blog photos, not client documents (those stay encrypted behind
   /api/documents). Nothing here touches the storage provider. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { data: true, mime: true, sizeBytes: true },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mime,
      "Content-Length": String(asset.sizeBytes),
      // The id is content-addressed by virtue of being immutable — an edit
      // uploads a new asset — so this can cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
      // An uploaded SVG is markup; stop it being treated as a same-origin
      // document that could run script against the site.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
