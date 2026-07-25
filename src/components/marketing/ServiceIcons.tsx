// Inline SVG icons + service-line copy for the public site (Oceano Apex
// concept). Kept here so the landing grid, the service detail pages and the
// onboarding picker stay in lockstep when the service lines change.

export const ServiceIcons = {
  formation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 21V9h4a1 1 0 0 1 1 1v11M4 21h17" />
    </svg>
  ),
  accounting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
    </svg>
  ),
  tax: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" />
    </svg>
  ),
  licensing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l2 2 4-4M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    </svg>
  ),
  immigration: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M9 15h6" />
    </svg>
  ),
  banking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18M5 10v8M19 10v8M3 18h18M12 3l9 5H3z" />
    </svg>
  ),
} as const;

export type ServiceKey = keyof typeof ServiceIcons;

export type ServiceStep = { t: string; d: string };

export type Service = {
  key: ServiceKey;
  title: string;
  blurb: string;
  longBlurb: string;
  pickerBlurb: string;
  /** Detail page: hero sub-line. */
  sub: string;
  /** Detail page: lowercase name used in the "Discuss <band> with us" band. */
  band: string;
  /** Detail page: "What's included" checklist. */
  included: string[];
  /** Detail page: "How it works" steps. */
  steps: ServiceStep[];
};

export const SERVICES: Service[] = [
  {
    key: "formation",
    title: "Corporate Services",
    blurb: "Cyprus company formation, administration and ongoing compliance support.",
    longBlurb: "End-to-end incorporation with the Registrar of Companies, plus registered office, company secretary, and ongoing corporate administration.",
    pickerBlurb: "Full incorporation and registered office setup.",
    sub: "Cyprus company formation, administration and compliance support. One accountable team from incorporation onward.",
    band: "corporate services",
    included: [
      "Cyprus company incorporation, end to end",
      "Registered office and corporate administration",
      "Ongoing statutory compliance and filings",
      "Corporate changes, restructuring and good standing",
      "KYC and UBO documentation handled properly",
    ],
    steps: [
      { t: "Tell us your plan", d: "A short consultation to match the right structure to your business." },
      { t: "We form and register", d: "Incorporation, registers and tax registrations handled for you." },
      { t: "We keep it compliant", d: "Administration and filings run quietly in the background, every year." },
    ],
  },
  {
    key: "accounting",
    title: "Accounting & VAT",
    blurb: "Financial reporting, VAT registration and filings that stay ahead of every deadline.",
    longBlurb: "Monthly bookkeeping, quarterly VAT submissions, management accounts, and statutory audit coordination.",
    pickerBlurb: "On-going compliance and professional bookkeeping.",
    sub: "Financial reporting, VAT registration and compliance that keeps your Cyprus entity filing-ready all year.",
    band: "accounting & VAT",
    included: [
      "Bookkeeping and financial reporting",
      "VAT registration and periodic returns",
      "Preparation for audit and annual statements",
      "Payroll and employer registrations where needed",
      "Deadline management, so you never chase a date",
    ],
    steps: [
      { t: "Scope & quote", d: "We size the work to your activity and agree a clear fee." },
      { t: "Onboarding", d: "Records, access and the filing calendar are set up once." },
      { t: "It runs", d: "Reports arrive on schedule and filings happen on time." },
    ],
  },
  {
    key: "tax",
    title: "Tax Residency",
    blurb: "Cyprus tax residency and non-dom guidance with strategic, personal planning.",
    longBlurb: "Cyprus Non-Dom certification, 60-day rule applications, and individual tax planning for relocating professionals.",
    pickerBlurb: "Non-Dom status and individual tax planning.",
    sub: "Cyprus tax residency and non-dom guidance with strategic planning around your personal position.",
    band: "tax residency",
    included: [
      "Eligibility assessment for the 60-day and 183-day routes",
      "Non-dom registration and planning",
      "Tax residency certificates for treaty access",
      "Personal tax registrations and ongoing guidance",
      "Residency designed together with your company structure",
    ],
    steps: [
      { t: "Assess", d: "Your citizenship, presence and plans reviewed against both routes." },
      { t: "Register", d: "Residency, non-dom status and certificates secured." },
      { t: "Maintain", d: "Annual guidance keeps the status solid, year after year." },
    ],
  },
  {
    key: "licensing",
    title: "Licensing Worldwide",
    blurb: "Regulatory support and market entry for licensed activities across jurisdictions.",
    longBlurb: "CySEC investment-firm licenses, CASP crypto-asset providers, EMI, and gambling licenses, from application through approval.",
    pickerBlurb: "EMI, CASP, and Gambling license acquisition.",
    sub: "Global regulatory support and market entry assistance for licensed activities.",
    band: "licensing",
    included: [
      "Licensing strategy and jurisdiction selection",
      "Application preparation and regulator liaison",
      "Corporate substance and local requirements",
      "Post-licence compliance support",
    ],
    steps: [
      { t: "Map the route", d: "Activity, jurisdictions and realistic timelines assessed honestly." },
      { t: "Prepare & file", d: "Documentation assembled and submitted with the regulator." },
      { t: "Operate", d: "Ongoing support keeps the licence in good standing." },
    ],
  },
  {
    key: "immigration",
    title: "Immigration",
    blurb: "Residency permits, permanent residence and work permits for you and your family.",
    longBlurb: "Pink slip, digital nomad, work permits, permanent residency, and EU citizenship advisory for you and your dependents.",
    pickerBlurb: "Residency permits and citizenship solutions.",
    sub: "Residency permits, permanent residence and work permits, for you, your family and your team.",
    band: "immigration",
    included: [
      "Residency permits and renewals",
      "Permanent residence applications",
      "Work permits for staff and executives",
      "Family relocation support, end to end",
    ],
    steps: [
      { t: "Eligibility check", d: "The right permit route for your situation, confirmed first." },
      { t: "Application", d: "Documents prepared, filed and tracked with the authorities." },
      { t: "Arrival", d: "Registrations completed so your family lands ready." },
    ],
  },
  {
    key: "banking",
    title: "Banking Solutions",
    blurb: "Account opening and banking relationship management, bank and EMI alike.",
    longBlurb: "Curated introductions to EU/EEA banking partners with full KYC packaging for corporate and personal accounts.",
    pickerBlurb: "Corporate and personal bank account opening.",
    sub: "Account opening and banking relationship management, bank and EMI alike, matched to your profile.",
    band: "banking solutions",
    included: [
      "Business account opening, bank and EMI",
      "Prepared applications with complete documentation",
      "Personal accounts alongside corporate where needed",
      "Ongoing banking relationship management",
    ],
    steps: [
      { t: "Profile & match", d: "We match institutions realistically open to your business." },
      { t: "Prepared application", d: "A complete file, submitted right the first time." },
      { t: "Account live", d: "Support continues after the account opens." },
    ],
  },
];

/** Lookup for the /services/[key] detail routes. */
export function getService(key: string): Service | undefined {
  return SERVICES.find((s) => s.key === key);
}
