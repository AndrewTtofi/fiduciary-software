/* =====================================================================
   Public tools registry — the ten tools on /tools, one page and URL each.

   Everything the hub, the nav dropdown, the footer and the homepage tools
   block need to list a tool lives here. The calculators themselves read
   their rates from the editable tool settings (lib/services/tool-settings),
   never from constants in the page.

   The H1 of each page is the question it answers, not the tool name (Tools
   spec, "Rules for every tool").
   ===================================================================== */

export type ToolTab = "personal" | "business" | "residency" | "reference";

export const TOOL_TABS: { key: ToolTab; label: string }[] = [
  { key: "personal", label: "Personal Tax" },
  { key: "business", label: "Business Tax" },
  { key: "residency", label: "Residency and Permits" },
  { key: "reference", label: "Reference" },
];

export type Tool = {
  key: string;
  /** Path segment under /tools/. */
  slug: string;
  tab: ToolTab;
  /** Card title / nav label. */
  name: string;
  /** Page H1 — the question the tool answers. */
  h1: string;
  /** One-line card teaser. */
  teaser: string;
  /** <meta name="description">. */
  description: string;
};

export const TOOLS: Tool[] = [
  {
    key: "income-tax",
    slug: "cyprus-income-tax-calculator",
    tab: "personal",
    name: "Personal Income Tax Calculator",
    h1: "How much income tax will I pay in Cyprus in 2026?",
    teaser: "Band-by-band income tax, social insurance and GESY on any salary or self-employed income.",
    description: "Work out your 2026 Cyprus income tax band by band, with social insurance and GESY, and see your net income and effective rate. Free, no sign-up.",
  },
  {
    key: "salary",
    slug: "cyprus-salary-calculator",
    tab: "personal",
    name: "Salary Calculator",
    h1: "What will this salary cost, and what will the employee take home?",
    teaser: "Net pay for the employee, and the full monthly cost for the employer, itemised.",
    description: "Cyprus salary calculator for 2026: employee net pay and employer total cost, itemising income tax, social insurance, GESY and the employer funds.",
  },
  {
    key: "non-dom",
    slug: "non-dom-savings-calculator",
    tab: "personal",
    name: "Non-Dom Savings Calculator",
    h1: "How much do I save with Cyprus Non-Dom status?",
    teaser: "Your dividend tax now versus Cyprus as a Non-Dom, per year and over the 17-year status.",
    description: "Compare the dividend tax you pay today with Cyprus Non-Dom status: 0% dividend tax, GESY capped, and the difference over 17 years.",
  },
  {
    key: "effective-rate",
    slug: "effective-tax-rate-calculator",
    tab: "business",
    name: "Effective Tax Rate Calculator",
    h1: "What will my company really pay in Cyprus?",
    teaser: "Corporate tax and GESY on distributed profit, next to what the same profit costs where you are now.",
    description: "Effective tax on distributed profit for a Cyprus company with a Non-Dom owner: 15% corporate tax plus capped GESY, compared with your current country.",
  },
  {
    key: "vat",
    slug: "cyprus-vat-calculator",
    tab: "business",
    name: "VAT Calculator",
    h1: "How much VAT do I add or remove?",
    teaser: "Add VAT to a net figure or extract it from a gross one, at 19%, 9%, 5% or 0%.",
    description: "Cyprus VAT calculator: add or remove VAT at the 19% standard, 9% and 5% reduced or 0% zero rate and see net, VAT and gross.",
  },
  {
    key: "ip-box",
    slug: "cyprus-ip-box-calculator",
    tab: "business",
    name: "IP Box Calculator",
    h1: "What would the IP Box regime save my company?",
    teaser: "Tax with and without the IP Box on qualifying IP income, at your nexus ratio.",
    description: "Estimate what the Cyprus IP Box regime would save on qualifying intellectual property income: the 80% exemption, the nexus ratio and the effective rate.",
  },
  {
    key: "permit",
    slug: "which-cyprus-permit",
    tab: "residency",
    name: "Which Permit Do I Need?",
    h1: "Which Cyprus residence permit applies to me?",
    teaser: "Five questions, and the residence route that usually applies to a situation like yours.",
    description: "Answer five questions about your passport, stay, income, family and property and see which Cyprus residence permit route usually applies.",
  },
  {
    key: "citizenship",
    slug: "cyprus-citizenship-by-descent-checker",
    tab: "residency",
    name: "Citizenship by Descent Checker",
    h1: "Do I qualify for Cyprus citizenship through my family?",
    teaser: "Whether there may be a case through a Cypriot parent, grandparent or spouse, and which form it runs through.",
    description: "Check whether there may be a case for Cyprus citizenship through a Cypriot parent, grandparent or spouse, which form applies and which documents you will need.",
  },
  {
    key: "calendar",
    slug: "cyprus-tax-calendar",
    tab: "reference",
    name: "Cyprus Tax Calendar 2026",
    h1: "When are my Cyprus filing deadlines?",
    teaser: "Every filing deadline in date order, for individuals, companies and employers.",
    description: "Cyprus tax calendar 2026: PAYE, social insurance, GESY, VAT, VIES, income tax returns and Registrar deadlines in date order, filtered for individuals, companies and employers.",
  },
  {
    key: "compare",
    slug: "compare-jurisdictions",
    tab: "reference",
    name: "Compare Jurisdictions",
    h1: "How does Cyprus compare to where I am now?",
    teaser: "Corporate tax, VAT, formation time and treaties for the jurisdictions our clients actually weigh up.",
    description: "Compare Cyprus with the United Kingdom, the United States, the EU and the international jurisdictions we work in: corporate tax, VAT, formation time and treaties.",
  },
];

export const getTool = (slug: string): Tool | undefined => TOOLS.find((t) => t.slug === slug);
export const toolHref = (key: string): string => `/tools/${TOOLS.find((t) => t.key === key)!.slug}`;

/** The four tools featured on the homepage tools block, in the order the
 *  review put them (income tax and Non-Dom first) followed by the two the
 *  Tools spec calls "the reason to build this page". */
export const HOME_TOOL_KEYS = ["income-tax", "non-dom", "permit", "citizenship"] as const;
