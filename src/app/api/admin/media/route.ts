import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Only raster/vector formats a browser renders inline. No PDFs, no archives —
 *  this endpoint feeds <img> tags on the public marketing site. */
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_BYTES = 5_000_000;

/** Upload a public marketing image. Staff-only; the resulting URL is public. */
export async function POST(req: Request) {
  await assertRole("staff");
  const session = await auth();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file supplied" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPEG, WEBP, GIF or SVG image." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large — keep it under 5MB." }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  // Trust the bytes over the declared type: a mislabelled file would otherwise
  // be served back with a Content-Type the browser will happily execute.
  if (!looksLikeImage(data, file.type)) {
    return NextResponse.json({ error: "That file does not look like an image." }, { status: 415 });
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: file.name.slice(0, 200) || "image",
      mime: file.type,
      sizeBytes: data.byteLength,
      data,
      uploadedById: session?.user?.id ?? null,
    },
    select: { id: true, filename: true, sizeBytes: true },
  });

  return NextResponse.json({ ...asset, url: `/api/media/${asset.id}` }, { status: 201 });
}

/** Magic-number check for the formats we accept. */
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  const hex = buf.subarray(0, 12).toString("hex");
  if (mime === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (mime === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mime === "image/gif") return hex.startsWith("474946383");
  if (mime === "image/webp") return hex.startsWith("52494646") && hex.slice(16, 24) === "57454250";
  if (mime === "image/svg+xml") {
    const head = buf.subarray(0, 400).toString("utf8").trim().toLowerCase();
    return head.startsWith("<?xml") || head.startsWith("<svg") || head.includes("<svg");
  }
  return false;
}
