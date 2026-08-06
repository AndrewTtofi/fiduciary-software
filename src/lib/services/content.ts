import { cache } from "react";
import { prisma } from "@/lib/db";

/* =====================================================================
   Editable marketing-site content (landing, about, insights, contact, FAQ).
   Stored as a singleton JSON blob and merged over these code defaults, so
   the public pages always render even before anything is edited, and new
   fields added later degrade gracefully.

   Fields the public pages do not read are deliberately absent: the site was
   redesigned after this CMS was written (see 8645527), which baked some
   headings into the page layouts and dropped the steps/testimonials sections.
   Offering an input that changes nothing is worse than offering none.

   Rich-text conventions (rendered by GoldText/BoldText in components/marketing/mk.tsx):
   - headings: "\n" splits lines; *asterisks* mark the gold italic span.
   - bodies:   **double asterisks** mark emphasised (dark) text.
   ===================================================================== */

export type Stat = { v: string; l: string };
export type Faq = { q: string; a: string };
export type Feature = { t: string; d: string };

export type Consultation = {
  kicker: string;
  heading: string;
  body: string;
  personName: string;
  personTitle: string;
  photoUrl: string;
  photoNote: string;
  points: string[];
  stripHeading: string;
  stripBody: string;
  underForm: string;
};

export type SiteContent = {
  hero: { eyebrow: string; headline: string; lead: string; primaryCta: string; secondaryCta: string };
  about: { body1: string; body2: string };
  why: { kicker: string; features: Feature[] };
  servicesIntro: { eyebrow: string; heading: string; body: string };
  stats: Stat[];
  cta: { heading: string; body: string; button: string };
  insights: { kicker: string; heading: string; rhHeading: string; rhBody: string };
  contact: { address: string; phone: string; whatsapp: string; email: string };
  faq: Faq[];
  consultation: Consultation;
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Nicosia, Cyprus",
    headline: "A Modern Cyprus Corporate\nand *Fiduciary* Services Firm",
    lead: "We help international entrepreneurs and investors relocate, structure and operate in Cyprus. Founder to founder, start to finish, with no guesswork.",
    primaryCta: "Book Your Free 30-Minute Consultation",
    secondaryCta: "Explore Services",
  },
  about: {
    body1: "Our team brings **decades of combined expertise** in corporate law, accounting and compliance to the formation and administration of Cyprus entities. Founded in **2024** and based in Nicosia, we serve international entrepreneurs with **transparent, compliant structures** from incorporation to banking, tax residency and beyond.",
    body2: "From our base at **Stadiou 15, Nicosia**, we support clients across Europe and beyond, always transparent on scope and timeline.",
  },
  why: {
    kicker: "Why choose us",
    features: [
      { t: "Transparent and Compliant", d: "Clean structures and compliance designed in from day one, never bolted on after." },
      { t: "One Team, End to End", d: "Formation, accounting, tax residency, immigration, licensing and banking under one roof, with no handoffs between vendors." },
      { t: "We Are Where Our Clients Need Us", d: "Cyprus based, internationally minded, built for founders operating across borders." },
      { t: "Direct, WhatsApp First Access", d: "Reach your adviser directly and get quick answers on the channel you already use." },
    ],
  },
  servicesIntro: {
    eyebrow: "What we do",
    heading: "One Team, End to End",
    body: "Everything an international founder needs to land in Cyprus and operate cleanly, handled under one roof.",
  },
  stats: [
    { v: "8", l: "Jurisdictions we operate across" },
    { v: "5 to 7", l: "Working days to a ready company" },
    { v: "Decades", l: "Of combined team experience" },
  ],
  cta: {
    heading: "Map Your Cyprus Structure\nin *30 Minutes*",
    body: "Tell us where you are today and where you want to be. We will show you the route, the timeline and what it involves, before you commit to anything.",
    button: "Book Your Free 30-Minute Consultation",
  },
  insights: {
    kicker: "Insights",
    heading: "Cyprus,\n*Explained Clearly*",
    rhHeading: "Written By The People Who Set These Up Every Week",
    rhBody: "Practical guides on tax, residency and company structure. One article, one search phrase, answered properly.",
  },
  contact: {
    address: "Stadiou 15, Nicosia, Cyprus",
    phone: "+357 22 037 063",
    whatsapp: "+357 96 940 440",
    email: "info@orocorporateservices.com",
  },
  faq: [
    { q: "Who takes my consultation call?", a: "A founding partner of the firm. Your form is read before you speak, so you never repeat your story, and if Cyprus is not the right move for you, we will tell you that too." },
    { q: "How fast can my company be ready?", a: "Once we have your documents, a Cyprus company is typically ready in 5 to 7 working days." },
    { q: "Where is my data stored?", a: "All data, including identity documents and financial information, is encrypted and stored within the EU, with GDPR compliant data portability and exit terms." },
    { q: "What happens to my information if I do not proceed?", a: "You can request export or deletion of your records at any time. Nothing is shared with third parties without your consent." },
    { q: "Which services can I ask about?", a: "Company formation, accounting and VAT, tax residency and Non-Dom, immigration and residency, licensing and banking. One team handles all of it end to end." },
    { q: "How is pricing structured?", a: "Every engagement is scoped to your situation. You receive a personalised quote after your call, once we understand what you need." },
  ],
  consultation: {
    kicker: "Who Takes Your Call",
    heading: "You talk with the people who *built this firm*",
    body: "In this industry, \"book a free call\" usually means a sales team reading a script. Not here. When you book a consultation, you speak with Georgia, a founding partner, with a decade of experience moving international entrepreneurs to Cyprus.",
    personName: "Georgia",
    personTitle: "Co-Founder and Relocation Expert",
    photoUrl: "",
    photoNote: "Professional photo of Georgia, office setting",
    points: [
      "She reads your form before you speak, so you never repeat your story.",
      "Behind her stands the full firm: formations, VAT, legal, banking and licensing.",
      "If Cyprus is not the right move for you, she will tell you that too.",
    ],
    stripHeading: "We are not influencers. We do not run a marketing agency. **You talk with the people who built this firm.**",
    stripBody: "Book a consultation and you speak with a founding partner, not a sales desk.",
    underForm: "Your consultation is held by a founding partner of the firm.",
  },
};

/** Merge a stored partial over the defaults: objects merge per-field; arrays
 *  replace entirely when present (so an editor can shorten a list). */
function merge(stored: Partial<SiteContent> | null | undefined): SiteContent {
  const s = stored ?? {};
  const obj = <T,>(key: keyof SiteContent): T =>
    ({ ...(DEFAULT_CONTENT[key] as object), ...((s[key] as object) ?? {}) }) as T;
  const arr = <T,>(key: keyof SiteContent): T[] =>
    (Array.isArray(s[key]) ? (s[key] as T[]) : (DEFAULT_CONTENT[key] as T[]));
  // `why`/`insights` hold nested arrays — merge scalars per-field, then let a
  // stored array replace the default one wholesale (same rule as top-level arrays).
  const why = obj<SiteContent["why"]>("why");
  why.features = Array.isArray((s.why as Partial<SiteContent["why"]> | undefined)?.features)
    ? (s.why!.features as Feature[])
    : DEFAULT_CONTENT.why.features;
  const insights = obj<SiteContent["insights"]>("insights");
  const consultation = obj<Consultation>("consultation");
  consultation.points = Array.isArray((s.consultation as Partial<Consultation> | undefined)?.points)
    ? (s.consultation!.points as string[])
    : DEFAULT_CONTENT.consultation.points;
  return {
    hero: obj("hero"),
    about: obj("about"),
    why,
    servicesIntro: obj("servicesIntro"),
    stats: arr<Stat>("stats"),
    cta: obj("cta"),
    insights,
    contact: obj("contact"),
    faq: arr<Faq>("faq"),
    consultation,
  };
}

/** Effective marketing content (stored overrides merged over defaults). Cached
 *  per request so all public pages share a single read. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const row = await prisma.siteContent.findUnique({ where: { id: "singleton" } });
  return merge(row?.data as Partial<SiteContent> | undefined);
});
