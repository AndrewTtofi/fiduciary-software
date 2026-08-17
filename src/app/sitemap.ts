import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { TOOLS } from "@/lib/data/tools";

export const dynamic = "force-dynamic";

/** Public sitemap: static marketing pages, the eight service pages, the ten
 *  tools, and every published article — articles appear automatically the
 *  moment they are published (Insights spec). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env().APP_URL.replace(/\/$/, "");
  const now = new Date();
  const statics = ["", "/services", "/tools", "/insights", "/about", "/contact", "/book", "/faq", "/privacy", "/cookies", "/terms"];
  const articles = await prisma.article
    .findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
    .catch(() => [] as { slug: string; updatedAt: Date }[]);
  return [
    ...statics.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...SERVICES.map((s) => ({ url: `${base}/services/${s.key}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...TOOLS.map((t) => ({ url: `${base}/tools/${t.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...articles.map((a) => ({ url: `${base}/insights/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
