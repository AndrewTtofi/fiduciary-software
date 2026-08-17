import { z } from "zod";
import { ARTICLE_CATEGORIES } from "@/lib/data/article-categories";

/** Admin article payload (create; `.partial()` for updates). */
export const articleSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase words separated by hyphens"),
  title: z.string().min(3).max(200),
  keyword: z.string().min(2).max(80),
  category: z.enum(ARTICLE_CATEGORIES),
  excerpt: z.string().min(3).max(500),
  body: z.string().min(10).max(60_000),
  image: z.string().max(500).nullable().optional(),
  // Every article carries a named author (Insights spec) — required to publish.
  author: z.string().max(120),
  authorRole: z.string().max(160),
  authorBio: z.string().max(1000),
  correctAsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  metaTitle: z.string().max(200),
  metaDesc: z.string().max(320),
  serviceKey: z.string().max(60),
  published: z.boolean(),
});

/** Publishing rules the spec insists on: no article goes live without an
 *  author and a "correct as at" date. Drafts may be saved incomplete. */
export function publishBlockers(d: { published: boolean; author: string; correctAsAt?: string | null }): string | null {
  if (!d.published) return null;
  if (!d.author.trim()) return "Add an author name before publishing.";
  if (!d.correctAsAt) return "Set the \"correct as at\" date before publishing.";
  return null;
}
