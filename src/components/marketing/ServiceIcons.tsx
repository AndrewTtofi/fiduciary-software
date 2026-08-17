// Inline SVG icons + service-line copy for the public site. Kept here so the
// landing grid, the services landing page, the service detail pages, the
// footer, the nav dropdown and the booking form's service picker stay in
// lockstep when the service lines change.
//
// The eight lines and every word of copy come from the firm's website review
// (Services notes, Aug 2026). Icons were re-selected to match each service —
// the previous set reused a house for tax residency.

export const ServiceIcons = {
  /* Company Formation — building */
  "company-formation": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 21V9h4a1 1 0 0 1 1 1v11M4 21h17M8 8h3M8 12h3M8 16h3" />
    </svg>
  ),
  /* Tax Residency and Non-Dom — ID card with a location pin */
  "tax-residency": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M8 13.5v2.5M13.5 9.5H18M13.5 13H18" />
    </svg>
  ),
  /* IP Box — lightbulb (ideas / intellectual property) */
  "ip-box": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2l.1.7h4.8l.1-.7c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
    </svg>
  ),
  /* Immigration and Work Permits — passport with a stamp */
  "immigration": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M8.8 10h6.4M12 6.8v6.4M9 17h6" />
    </svg>
  ),
  /* Citizenship — family / people */
  "citizenship": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M3 20a6 6 0 0 1 12 0M14.5 20a4.5 4.5 0 0 1 6.5-4" />
    </svg>
  ),
  /* International Companies and Licensing — globe */
  "international": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  /* Amazon Seller Setup — parcel */
  "amazon-seller": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.3l8 4.5" />
    </svg>
  ),
  /* Accounting and VAT — ledger / calculator */
  "accounting-vat": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 18h2M12 18h2M16 18h0" />
    </svg>
  ),
} as const;

export type ServiceKey = keyof typeof ServiceIcons;

export type ServiceStep = { t: string; d: string };

export type Service = {
  key: ServiceKey;
  title: string;
  /** Home / services-landing card copy. */
  blurb: string;
  /** Detail page: hero sub-line. */
  sub: string;
  /** Detail page: lowercase phrase used in the "Discuss <band> with us" band. */
  band: string;
  /** Detail page: "What is included" checklist. */
  included: string[];
  /** Detail page: "How it works" steps. */
  steps: ServiceStep[];
  /** Detail page: plain-spoken note the review asked to state on the page. */
  note?: string;
  /** Insights categories whose published articles are the most relevant to
   *  link from this page (Insights spec: "link to the two or three most
   *  relevant articles once published"). */
  articleCategories: string[];
  /** Internal platform service id the booking/lead flags key on. */
  platformKey: "company_formation" | "accounting" | "tax_residency" | "immigration" | "licensing";
};

export const SERVICES: Service[] = [
  {
    key: "company-formation",
    title: "Company Formation",
    blurb:
      "Cyprus company registration, registered office and secretarial arrangements, VAT and VIES registration, and the drafting, certification and translation of corporate documents. We also prepare your business account applications.",
    sub: "Your Cyprus company, registered and ready to trade - with everything it needs to operate properly from day one.",
    band: "company formation",
    included: [
      "Cyprus company registration, from name approval to certificates",
      "Registered office and secretarial arrangements",
      "Tax registration, VAT and VIES",
      "Drafting, certification and translation of corporate documents",
      "Business account applications, prepared and submitted",
      "Annual returns, UBO register filings and corporate changes",
      "Ready-made companies where you need to move faster",
    ],
    steps: [
      { t: "Tell us your plan", d: "A short call to match the right structure to what you are actually doing, before anything is filed." },
      { t: "We register the company", d: "Incorporation, registers, tax and VAT registrations handled for you." },
      { t: "We keep it running", d: "Filings and annual obligations tracked, so nothing arrives as a surprise." },
    ],
    articleCategories: ["Company Formation"],
    platformKey: "company_formation",
  },
  {
    key: "tax-residency",
    title: "Tax Residency and Non-Dom",
    blurb:
      "Tax residency under the 60-day rule, Non-Dom applications, tax residency and tax clearance certificates, GESY registration, and personal tax planning.",
    sub: "Become a Cyprus tax resident in as little as 60 days, and hold Non-Dom status for 17 years.",
    band: "tax residency",
    included: [
      "Eligibility assessment for the 60-day and 183-day routes",
      "Non-Dom applications, once tax residency is established",
      "Tax residency certificates for treaty access",
      "Tax clearance certificates",
      "Personal tax registration and GESY registration",
      "Planning that considers your company structure, not just your residency",
    ],
    steps: [
      { t: "Assess", d: "Your citizenship, your days, your income and your plans, checked against both routes." },
      { t: "Register", d: "Tax residency, Non-Dom status and the certificates that prove it." },
      { t: "Maintain", d: "Annual guidance so the status holds, year after year." },
    ],
    note: "Non-Dom status can only be registered once Cyprus tax residency is established. It is the single most common misunderstanding, so we say it plainly: residency first, then Non-Dom.",
    articleCategories: ["Tax", "Residency"],
    platformKey: "tax_residency",
  },
  {
    key: "ip-box",
    title: "IP Box",
    blurb:
      "Cyprus IP Box can bring the effective tax rate on qualifying intellectual property income down to around 3%. Most companies that qualify have no idea the regime exists. We assess whether yours does.",
    sub: "Cyprus IP Box can bring the effective tax rate on qualifying intellectual property income down to around 3%. Most companies that qualify have no idea the regime exists.",
    band: "IP Box",
    included: [
      "An 80% exemption on qualifying IP profits - only 20% is taxed, at the 15% corporate rate",
      "Assessment of whether your income and assets qualify",
      "Identifying qualifying intangible assets - software, patents and other protected IP",
      "The nexus calculation, which determines how much of your income actually benefits",
      "Structuring the company so the regime applies from the right point",
      "Documentation and records needed to support the claim",
      "Ongoing review, so the benefit is not lost as the business changes",
    ],
    steps: [
      { t: "Do you qualify?", d: "We look at what your company actually earns from and whether the assets meet the test. Many do. Some do not, and we will say so." },
      { t: "The calculation", d: "We work out what proportion of your income qualifies, so you know the real benefit before you commit." },
      { t: "Apply and maintain", d: "The structure is put in place and the records kept so the position holds." },
    ],
    note: "The effective rate is approximately 3% from 1 January 2026 - the 80% exemption applied to the 15% corporate rate. The rate depends on the nexus calculation and is not automatic. Trademarks and brand assets do not qualify - only patents, copyrighted software and functionally similar IP.",
    articleCategories: ["Tax"],
    platformKey: "tax_residency",
  },
  {
    key: "immigration",
    title: "Immigration and Work Permits",
    blurb:
      "Yellow Slip, Pink Slip, Digital Nomad Visa, permanent residency and family reunification. For companies, Business Facilitation Unit applications and Ministry of Labour permits for third-country nationals, including directors and high-skilled staff.",
    sub: "Permits and residency for you, your family and your staff - including the routes most firms will not take on.",
    band: "immigration",
    included: [
      "Yellow Slip - EU registration certificate",
      "Pink Slip - temporary residence permit",
      "Digital Nomad Visa",
      "Permanent residency applications",
      "Family reunification, for spouses and children",
      "Cypriot ID cards",
      "Business Facilitation Unit registration and applications",
      "Ministry of Labour permits for third-country nationals",
      "Permits for directors and high-skilled employees",
      "Renewals, and applications that have already been refused",
    ],
    steps: [
      { t: "Eligibility check", d: "The right route for your situation, confirmed before anything is filed. Not the route you assumed you needed." },
      { t: "Application", d: "Documents prepared, filed and followed up with the authorities until a decision comes." },
      { t: "Arrival", d: "Registrations completed so you and your family land ready." },
    ],
    note: "For employers: Business Facilitation Unit registration, third-country hires and staff relocation are as much a part of this work as the individual permits. If you are bringing a team, start here.",
    articleCategories: ["Immigration", "Residency"],
    platformKey: "immigration",
  },
  {
    key: "citizenship",
    title: "Citizenship",
    blurb:
      "Cyprus citizenship through descent or through marriage. If you have a Cypriot parent or grandparent, or you are married to a Cypriot, you may already qualify. We tell you honestly whether you do.",
    sub: "Cyprus citizenship through descent or through marriage. If you qualify, we will tell you. If you do not, we will tell you that too.",
    band: "citizenship",
    included: [
      "Citizenship by descent, through a Cypriot parent or grandparent",
      "Citizenship by marriage to a Cypriot citizen",
      "Assessment of which route applies, before any file is opened",
      "Tracing and obtaining the supporting civil records",
      "Certification, translation and legalisation of documents",
      "Preparation and submission of the application",
      "Applications previously refused, reviewed and refiled on the correct route",
    ],
    steps: [
      { t: "Do you qualify?", d: "We look at the family line or the marriage, and tell you honestly whether there is a case." },
      { t: "The paperwork", d: "Records traced, certified and translated. This is the part that takes the longest and where most applications fail." },
      { t: "Submission", d: "The file is prepared properly and followed until a decision." },
    ],
    articleCategories: ["Citizenship"],
    platformKey: "immigration",
  },
  {
    key: "international",
    title: "International Companies and Licensing",
    blurb:
      "Company formation in the United Kingdom, St. Lucia, Nevis, St. Vincent and the Grenadines and Mauritius. iGaming licensing through Nevis, and forex licensing through St. Vincent and Mauritius.",
    sub: "Company formation and licensing in the jurisdictions we know properly - not a list of every country in the world.",
    band: "international structures",
    included: [
      "United Kingdom - company formation",
      "St. Lucia - international company formation",
      "Nevis - company formation",
      "Nevis - iGaming licensing",
      "St. Vincent and the Grenadines - forex company formation and licensing",
      "Mauritius - forex company formation and licensing",
      "Jurisdiction selection, based on what you are actually doing",
      "Ongoing administration and renewals",
    ],
    steps: [
      { t: "Map the route", d: "Your activity, the realistic jurisdiction and an honest timeline. Some applications are slower than the internet suggests." },
      { t: "Prepare and file", d: "Documentation assembled and submitted with the regulator." },
      { t: "Operate", d: "Renewals and ongoing obligations kept in good standing." },
    ],
    articleCategories: ["International"],
    platformKey: "licensing",
  },
  {
    key: "amazon-seller",
    title: "Amazon Seller Setup",
    blurb:
      "The company, VAT registration and account structure an Amazon seller needs to trade from Cyprus, set up in the right order so your seller account is not held up.",
    sub: "The company, the VAT registration and the account structure an Amazon seller needs to trade from Cyprus - set up in the right order, so your seller account is not held up.",
    band: "Amazon setup",
    included: [
      "Cyprus company formation for Amazon sellers",
      "VAT and VIES registration, in the order Amazon requires",
      "Corporate documents in the form Amazon asks for at verification",
      "Business account applications",
      "Guidance on where your VAT obligations arise once you sell across borders",
      "Ongoing accounting and VAT returns",
    ],
    steps: [
      { t: "Where you sell", d: "Which marketplaces, which countries, and what that means for your registrations." },
      { t: "The setup", d: "Company, VAT and documentation prepared in the sequence that gets you verified without delays." },
      { t: "Trading", d: "Returns and filings handled while you sell." },
    ],
    articleCategories: ["Company Formation"],
    platformKey: "company_formation",
  },
  {
    key: "accounting-vat",
    title: "Accounting and VAT",
    blurb:
      "Bookkeeping, VAT and VIES returns, payroll and annual filings, kept current so nothing arrives as a surprise.",
    sub: "Bookkeeping, VAT and payroll kept current, so your company stays filing-ready all year.",
    band: "accounting",
    included: [
      "Bookkeeping and management accounts",
      "VAT registration, VAT returns and VIES returns",
      "Payroll, employer registrations and social insurance",
      "Annual financial statements, prepared for audit",
      "TD7, IR4 and annual return filings",
      "Deadline management, so you never chase a date",
    ],
    steps: [
      { t: "Scope and quote", d: "We size the work to your actual activity and agree a clear fee. No open-ended hourly billing." },
      { t: "Onboarding", d: "Records, access and the filing calendar set up once." },
      { t: "It runs", d: "Reports arrive on schedule and filings happen on time." },
    ],
    articleCategories: ["Tax", "Company Formation"],
    platformKey: "accounting",
  },
];

/** Lookup for the /services/[key] detail routes. */
export function getService(key: string): Service | undefined {
  return SERVICES.find((s) => s.key === key);
}
