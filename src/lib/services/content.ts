import { cache } from "react";
import { prisma } from "@/lib/db";

/* =====================================================================
   Editable marketing-site content (landing, about, insights, contact, FAQ).
   Stored as a singleton JSON blob and merged over these code defaults, so
   the public pages always render even before anything is edited, and new
   fields added later degrade gracefully.

   Rich-text conventions (rendered by GoldText/BoldText in components/marketing/mk.tsx):
   - headings: "\n" splits lines; *asterisks* mark the gold italic span.
   - bodies:   **double asterisks** mark emphasised (dark) text.
   ===================================================================== */

export type Step = { t: string; d: string };
export type Stat = { v: string; l: string };
export type Testimonial = { q: string; n: string; r: string };
export type Faq = { q: string; a: string };
export type Feature = { t: string; d: string };
export type Post = { tag: string; title: string; img: string };

export type SiteContent = {
  hero: { eyebrow: string; headline: string; lead: string; primaryCta: string; secondaryCta: string };
  about: { kicker: string; heading: string; body1: string; body2: string; cta: string };
  why: { kicker: string; heading: string; features: Feature[] };
  steps: Step[];
  servicesIntro: { eyebrow: string; heading: string; body: string };
  stats: Stat[];
  testimonialsIntro: { eyebrow: string; heading: string };
  testimonials: Testimonial[];
  cta: { heading: string; body: string; button: string };
  insights: { kicker: string; heading: string; rhHeading: string; rhBody: string; posts: Post[] };
  contact: { address: string; phone: string; whatsapp: string; email: string };
  faq: Faq[];
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Corporate Services",
    headline: "Your Trusted\n*Corporate Services Partner*\nin Cyprus & Beyond",
    lead: "Seamless company incorporation in Cyprus and fiduciary support for international entrepreneurs — transparent, compliant and delivered by one accountable team.",
    primaryCta: "Book a Consultation",
    secondaryCta: "Explore Services",
  },
  about: {
    kicker: "Who we are",
    heading: "A Modern Cyprus Corporate & Fiduciary Services Firm",
    body1: "Our team brings **decades of combined expertise** in corporate law, accounting and compliance to the formation and administration of Cyprus entities. Founded in **2024** and based in Nicosia, we serve international entrepreneurs with **transparent, compliant structures** — from incorporation to banking, tax residency and beyond.",
    body2: "From our base at **Stadiou 15, Nicosia**, we support clients across Europe and beyond — always transparent on scope, timeline and fees.",
    cta: "Explore Our Services",
  },
  why: {
    kicker: "Why choose us",
    heading: "Experience Trusted\n*Fiduciary Expertise*\nThat Delivers Results",
    features: [
      { t: "Transparent & Compliant", d: "Clean structures, clear fees and compliance designed in from day one — never bolted on after." },
      { t: "One Team, End to End", d: "Formation, accounting, tax residency, immigration, licensing and banking under one roof — no handoffs between vendors." },
      { t: "We Are Where Our Clients Need Us", d: "Cyprus-based, internationally minded — built for founders operating across borders." },
      { t: "Direct, WhatsApp-First Access", d: "Reach your adviser directly — quick answers on the channel you already use." },
    ],
  },
  steps: [
    { t: "Apply", d: "Create an account and submit your details and documents through a short, guided application — tailored to the services you need." },
    { t: "Review", d: "Our compliance team reviews each application with KYC and sanctions screening, then approves — usually within one business day." },
    { t: "Onboard", d: "Once approved you unlock booking and a full workspace: documents, messaging, deadlines and your dedicated advisor." },
  ],
  servicesIntro: {
    eyebrow: "Our services",
    heading: "Everything Your Cyprus Structure Needs",
    body: "Six core service lines, each with its own guided intake and required-document logic.",
  },
  stats: [
    { v: "100%+", l: "Compliance Success Rate" },
    { v: "6+", l: "Service Lines Under One Roof" },
  ],
  testimonialsIntro: { eyebrow: "IN THEIR WORDS", heading: "Principals run their setup on it." },
  testimonials: [
    { q: "Incorporated and banked in under three weeks. The portal made the document back-and-forth painless.", n: "Daniel Roth", r: "Founder, fintech · Germany" },
    { q: "Finally a corporate-services firm that feels like software. I always knew exactly what was outstanding.", n: "Aisha Karim", r: "Director · UAE" },
    { q: "Tax residency and banking handled together, with one point of contact. Exactly what we needed relocating.", n: "Elena Pappas", r: "Private client · Cyprus" },
  ],
  cta: {
    heading: "Speak With Our *Corporate Experts*",
    body: "Reach out to our team for expert guidance on incorporation, residency and banking.",
    button: "Book a Consultation",
  },
  insights: {
    kicker: "Our insights & resources",
    heading: "Expert\n*Cyprus Insights* To\nStrengthen Your Business",
    rhHeading: "Knowledge From A Trusted Corporate Services Firm",
    rhBody: "Practical guidance from our corporate, tax and compliance team — on incorporating in Cyprus, securing tax residency, opening accounts and keeping your structure in good standing.",
    posts: [
      { tag: "Guide", title: "Incorporating in Cyprus: what founders should prepare before day one", img: "/marketing/p1.jpg" },
      { tag: "Tax residency", title: "The 60-day rule, explained simply — and who it actually suits", img: "/marketing/p2.jpg" },
      { tag: "Banking", title: "Bank or EMI? Choosing the right account for a new Cyprus company", img: "/marketing/p3.jpg" },
    ],
  },
  contact: {
    address: "Stadiou 15, Nicosia, Cyprus",
    phone: "+357 22 037 063",
    whatsapp: "+357 96 940 440",
    email: "info@orocorporateservices.com",
  },
  faq: [
    { q: "Why do I submit documents before booking a call?", a: "The gate ensures every consultation is with a serious, pre-qualified prospect. It also means your advisor walks into the call already knowing your situation — no time wasted on basics." },
    { q: "Where is my data stored?", a: "All data — including identity documents and financial information — is encrypted and stored within the EU, with GDPR-compliant data-portability and exit terms." },
    { q: "How long does review take?", a: "Typically 1–3 business days. You are notified by email (and WhatsApp, if enabled) the moment your application is approved and booking unlocks." },
    { q: "What happens to my information if I do not proceed?", a: "You can request export or deletion of your records at any time. Nothing is shared with third parties without your consent." },
    { q: "Which services can I apply for?", a: "Company formation, accounting & tax, tax residency, immigration, licensing and banking. Each has a tailored intake form so you only answer relevant questions." },
    { q: "How is pricing structured?", a: "Three engagements — Essentials, Standard and Full service — billed as a setup fee plus a monthly retainer, or a custom quote. See the pricing page for a full comparison." },
  ],
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
  insights.posts = Array.isArray((s.insights as Partial<SiteContent["insights"]> | undefined)?.posts)
    ? (s.insights!.posts as Post[])
    : DEFAULT_CONTENT.insights.posts;
  return {
    hero: obj("hero"),
    about: obj("about"),
    why,
    steps: arr<Step>("steps"),
    servicesIntro: obj("servicesIntro"),
    stats: arr<Stat>("stats"),
    testimonialsIntro: obj("testimonialsIntro"),
    testimonials: arr<Testimonial>("testimonials"),
    cta: obj("cta"),
    insights,
    contact: obj("contact"),
    faq: arr<Faq>("faq"),
  };
}

/** Effective marketing content (stored overrides merged over defaults). Cached
 *  per request so all public pages share a single read. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const row = await prisma.siteContent.findUnique({ where: { id: "singleton" } });
  return merge(row?.data as Partial<SiteContent> | undefined);
});
