import { cache } from "react";
import { prisma } from "@/lib/db";

/* =====================================================================
   Editable marketing-site content (landing, about, insights, contact, FAQ).
   Stored as a singleton JSON blob and merged over these code defaults, so
   the public pages always render even before anything is edited, and new
   fields added later degrade gracefully.

   The defaults are neutral white-label copy: they describe the services and
   the jurisdiction, never the firm. Firm identity (people, address, phone,
   registration numbers, photographs) is set per deployment in Admin →
   Content. Fields the public pages do not read are deliberately absent —
   offering an input that changes nothing is worse than offering none.

   Rich-text conventions (rendered by GoldHeading/BoldText in components/marketing/mk.tsx):
   - headings: "\n" splits lines; *asterisks* mark the gold italic span.
   - bodies:   **double asterisks** mark emphasised (dark) text; a blank
               line ("\n\n") splits paragraphs where the page renders several.
   ===================================================================== */

/** Version of the content model. Stored blobs carry `_v`; a stored blob from
 *  an older version is IGNORED and the code defaults render. Saving from the
 *  admin stamps the current version, so edits made from now on stick. Bump
 *  this (and only this) whenever the shipped default copy must override what
 *  is stored. */
export const CONTENT_VERSION = 2;

export type Stat = { v: string; l: string };
export type Faq = { q: string; a: string };
export type Feature = { t: string; d: string };
export type Step = { t: string; d: string };
export type Person = { name: string; title: string; bio: string };

export type Consultation = {
  heading: string;
  /** Paragraphs split on blank lines. */
  body: string;
  personName: string;
  personTitle: string;
  photoUrl: string;
  photoNote: string;
  points: string[];
};

export type SiteContent = {
  hero: {
    eyebrow: string;
    /** H1 — two lines, second in gold italic. */
    display: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: Stat[];
  servicesIntro: { heading: string; body: string };
  how: { heading: string; sub: string; steps: Step[] };
  cta: { heading: string; body: string; button: string };
  insights: { kicker: string; heading: string; body: string };
  contact: {
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    /** Company registration number, e.g. "HE 123456". */
    regNo: string;
    /** VAT number, e.g. "12345678X". */
    vatNo: string;
    linkedin: string;
    facebook: string;
    /** Contact page: a line on parking (saves phone calls). */
    parking: string;
    /** Contact page: office hours. */
    hours: string;
    /** Footer description line. */
    footerAbout: string;
  };
  faq: Faq[];
  consultation: Consultation;
  about: {
    /** "How it started" — paragraphs split on blank lines. "{brand}" is
     *  replaced with the firm's brand name when rendered. */
    story: string;
    /** "How we work" — paragraphs split on blank lines. */
    how: string;
    /** Intro line above the eight services. */
    whatWeDoIntro: string;
    /** "Why clients stay" panels. */
    why: Feature[];
    /** "The people" — names, titles, short biographies. No photographs. */
    people: Person[];
  };
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Cyprus",
    display: "Relocate to Cyprus,\n*without the guesswork.*",
    lead: "Cyprus tax residency from 60 days a year, Non-Dom status for 17 years, and the residency permits that go with it. We map the route before you commit to anything.",
    primaryCta: "Book Your Free 30-Minute Consultation",
    secondaryCta: "Message on WhatsApp",
  },
  stats: [
    { v: "60 days", l: "Minimum stay to become a Cyprus tax resident" },
    { v: "17 years", l: "Non-Dom exemption on dividend income" },
    { v: "15%", l: "Cyprus corporate tax from January 2026" },
  ],
  servicesIntro: {
    heading: "What we do",
    body: "Company formation, tax, immigration and international structuring for people and businesses moving to Cyprus.",
  },
  how: {
    heading: "How it works",
    sub: "Before you commit to anything, you will know the route, the timeline and the cost.",
    steps: [
      { t: "A call", d: "Thirty minutes, no charge. You tell us where you are now and where you want to be. We tell you what the route involves, including if Cyprus is not the right answer for you." },
      { t: "A written plan", d: "Steps, timeline, costs and what we need from you, set out in writing. You decide with the full picture in front of you, not after you have paid." },
      { t: "We handle it", d: "Applications, filings and follow-up, with one point of contact throughout. You are not passed between departments." },
    ],
  },
  cta: {
    heading: "Not sure where to start?",
    body: "Tell us where you are today and where you want to be. We will show you the route, the timeline and what it involves, before you commit to anything.",
    button: "Book Your Free 30-Minute Consultation",
  },
  insights: {
    kicker: "Insights",
    heading: "Cyprus,\n*explained clearly*",
    body: "Practical guides on tax, residency, immigration and company structure in Cyprus.",
  },
  contact: {
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    regNo: "",
    vatNo: "",
    linkedin: "",
    facebook: "",
    parking: "",
    hours: "",
    footerAbout: "Helping international founders and families move to Cyprus - tax residency, immigration and company setup.",
  },
  faq: [
    { q: "Who takes my consultation call?", a: "A senior member of our team. Your form is read before you speak, so you never repeat your story, and if Cyprus is not the right move for you, we will tell you that too." },
    { q: "What happens on the first call?", a: "Thirty minutes, no charge. You tell us where you are now and where you want to be, and we tell you what the route involves. If it makes sense to go further, you receive a written plan with steps, timeline and costs before you commit to anything." },
    { q: "Where is my data stored?", a: "All data, including identity documents and financial information, is encrypted and stored within the EU, with GDPR compliant data portability and exit terms." },
    { q: "What happens to my information if I do not proceed?", a: "You can request export or deletion of your records at any time. Nothing is shared with third parties without your consent." },
    { q: "Which services can I ask about?", a: "Company formation, tax residency and Non-Dom, IP Box, immigration and work permits, citizenship, international companies and licensing, Amazon seller setup, and accounting and VAT." },
    { q: "How is pricing structured?", a: "Every engagement is scoped to your situation. You receive a personalised quote after your call, once we understand what you need. We do not publish package prices." },
  ],
  consultation: {
    heading: "Who takes your call",
    body: "When you book a call, you speak to the people who will actually handle your case.\n\nWe have spent years walking people through immigration offices, tax registrations and company filings in Cyprus. Some of it is slower and harder than it should be, and we will not pretend otherwise.\n\nBut behind every application there is a family trying to build a life somewhere new, or someone taking a risk on a business. That part never shows up on a checklist, and it is the part we care about most.\n\nSo we will tell you what your situation actually needs. If the route you are asking for is the wrong one, we will say so. If Cyprus is not the right answer for you, we will say that too.\n\nWhat you will not get from us is maybes and ifs.",
    personName: "",
    personTitle: "",
    photoUrl: "",
    photoNote: "Photograph to be arranged",
    points: [
      "If the route you are asking for is not the right one, we will tell you.",
      "If we think there is a better option, we will explain why.",
      "If we believe something carries unnecessary risk, we will advise against it.",
    ],
  },
  about: {
    story: "{brand} began with a simple observation: moving yourself or your business to a new country involves too many offices, too many forms and too little straight talk.\n\nWe set out to be the firm we would want on our own side - one that maps the whole route before asking for a commitment, and says plainly when a route is not the right one.\n\nThat is still how we work today.",
    how: "A common mistake in corporate matters is focusing only on speed. Speed matters. Clarity matters more.\n\nWhen structures are rushed, the problems appear later - delays, avoidable issues with the authorities, or costly changes that could have been avoided.\n\nOur role is to slow things down at the right moment. To look at the full picture, explain what it actually means, and structure things properly from the start.\n\nClients come to us not just to move forward, but to move forward correctly.\n\nWhen in doubt, it is always better to ask before taking the next step.",
    whatWeDoIntro: "Everything a person or a business needs to arrive in Cyprus and operate properly.",
    why: [
      { t: "We are where our clients need us", d: "Cyprus based, internationally minded, built for people and businesses operating across borders." },
      { t: "Direct access", d: "Reach us on WhatsApp and get an answer on the channel you already use." },
      { t: "We tell you when it will not work", d: "If the route you are asking for is not the right one, we say so before you have paid for anything." },
    ],
    people: [],
  },
};

/** Merge a stored partial over the defaults: objects merge per-field; arrays
 *  replace entirely when present (so an editor can shorten a list). */
export function mergeContent(stored: (Partial<SiteContent> & { _v?: number }) | null | undefined): SiteContent {
  // A blob saved under an older content version is superseded wholesale.
  const s: Partial<SiteContent> = stored && stored._v === CONTENT_VERSION ? stored : {};
  const obj = <T,>(key: keyof SiteContent): T =>
    ({ ...(DEFAULT_CONTENT[key] as object), ...((s[key] as object) ?? {}) }) as T;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

  const how = obj<SiteContent["how"]>("how");
  how.steps = arr<Step>((s.how as Partial<SiteContent["how"]> | undefined)?.steps, DEFAULT_CONTENT.how.steps);
  const consultation = obj<Consultation>("consultation");
  consultation.points = arr<string>((s.consultation as Partial<Consultation> | undefined)?.points, DEFAULT_CONTENT.consultation.points);
  const about = obj<SiteContent["about"]>("about");
  const sa = s.about as Partial<SiteContent["about"]> | undefined;
  about.why = arr<Feature>(sa?.why, DEFAULT_CONTENT.about.why);
  about.people = arr<Person>(sa?.people, DEFAULT_CONTENT.about.people);

  return {
    hero: obj("hero"),
    stats: arr<Stat>(s.stats, DEFAULT_CONTENT.stats),
    servicesIntro: obj("servicesIntro"),
    how,
    cta: obj("cta"),
    insights: obj("insights"),
    contact: obj("contact"),
    faq: arr<Faq>(s.faq, DEFAULT_CONTENT.faq),
    consultation,
    about,
  };
}

/** Effective marketing content (stored overrides merged over defaults). Cached
 *  per request so all public pages share a single read. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const row = await prisma.siteContent.findUnique({ where: { id: "singleton" } });
  return mergeContent(row?.data as (Partial<SiteContent> & { _v?: number }) | undefined);
});

/** Split content-managed body copy into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
