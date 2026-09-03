import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool, TOOLS } from "@/lib/data/tools";
import { nextDue, fmtPct } from "@/lib/data/tax-rates";
import { RATES_REVIEWED } from "@/lib/data/jurisdictions";
import { getToolSettings } from "@/lib/services/tool-settings";
import { isToolEnabled } from "@/lib/services/tools-enabled";
import { getSiteContent } from "@/lib/services/content";
import { ToolShell } from "@/components/marketing/tools/ToolShell";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { IncomeTaxCalc } from "@/components/marketing/tools/IncomeTaxCalc";
import { SalaryCalc } from "@/components/marketing/tools/SalaryCalc";
import { NonDomCalc } from "@/components/marketing/tools/NonDomCalc";
import { VatCalc } from "@/components/marketing/tools/VatCalc";
import { IpBoxCalc } from "@/components/marketing/tools/IpBoxCalc";
import { PermitWizard } from "@/components/marketing/tools/PermitWizard";
import { CitizenshipWizard } from "@/components/marketing/tools/CitizenshipWizard";
import { TaxCalendar } from "@/components/marketing/tools/TaxCalendar";
import { CompareTool } from "@/components/marketing/tools/CompareTool";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  return tool ? { title: tool.h1, description: tool.description } : { title: "Tools" };
}

/** One route, ten tools: the slug picks the calculator; the frame, badges
 *  and estimate line are shared. Rates come from the editable tool settings
 *  so every figure on these pages is admin-maintained, not hard-coded. */
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  // Tool switched off for this deployment → the page does not exist here.
  if (!(await isToolEnabled(tool.key))) notFound();
  const [rates, { contact }] = await Promise.all([getToolSettings(), getSiteContent()]);
  const wa = contact.whatsapp;
    const eur = (n: number) => "€" + n.toLocaleString("en-US");
  const shell = { tool, taxYear: rates.taxYear, correctAsAt: rates.correctAsAt };

  switch (tool.key) {
    case "income-tax":
      return (
        <ToolShell {...shell} intro={`The ${rates.taxYear} bands, applied progressively, plus social insurance and GESY. No email required to see the result.`}
          aside={
            <>
              <span className="kicker">The {rates.taxYear} bands</span>
              <h2>How income tax is charged</h2>
              <p className="body">
                Cyprus taxes personal income in bands: nothing on the first {eur(rates.incomeTaxBands[0]?.upTo ?? 0)},
                then {rates.incomeTaxBands.slice(1).map((b, i, arr) => `${fmtPct(b.rate)}${b.upTo ? ` to ${eur(b.upTo)}` : " above that"}${i < arr.length - 1 ? ", " : ""}`).join("")}.
                Employees also pay {fmtPct(rates.socialInsurance.employee)} social insurance (up to the insurable-earnings ceiling of {eur(rates.socialInsurance.ceiling)}) and {fmtPct(rates.gesy.employee)} GESY; the self-employed pay {fmtPct(rates.socialInsurance.selfEmployed)} and {fmtPct(rates.gesy.selfEmployed)}.
              </p>
              <p className="body">
                New residents may qualify for a 50% exemption on employment income above a threshold for many years - a large saving this calculator does not assume. Source for the bands: the Cyprus Tax Department.
              </p>
            </>
          }>
          <IncomeTaxCalc rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "salary":
      return (
        <ToolShell {...shell} intro="Net pay for the employee, or the total cost to the company - itemised, monthly and annual."
          aside={
            <>
              <span className="kicker">Employer view</span>
              <h2>The number that matters before you hire</h2>
              <p className="body">
                On top of gross salary an employer pays {fmtPct(rates.socialInsurance.employer)} social insurance, {fmtPct(rates.gesy.employer)} GESY, {fmtPct(rates.employerFunds.socialCohesion)} to the Social Cohesion Fund, {fmtPct(rates.employerFunds.redundancy)} to the Redundancy Fund and {fmtPct(rates.employerFunds.hrda)} to the Human Resource Development Authority - roughly {fmtPct(rates.socialInsurance.employer + rates.gesy.employer + rates.employerFunds.socialCohesion + rates.employerFunds.redundancy + rates.employerFunds.hrda)} in total, less once contributions based on insurable earnings reach the {eur(rates.socialInsurance.ceiling)} ceiling.
              </p>
              <p className="body">A company hiring a third-country national needs this figure before it commits, and it feeds the salary thresholds on permit applications.</p>
            </>
          }>
          <SalaryCalc rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "non-dom":
      return (
        <ToolShell {...shell} intro={`Your dividend tax where you are now, against Cyprus as a Non-Dom - per year and over the ${rates.nonDomYears} years the status lasts.`}
          aside={
            <>
              <span className="kicker">Non-Dom</span>
              <h2>Residency first, then Non-Dom</h2>
              <p className="body">
                A Cyprus tax resident who is not domiciled in Cyprus pays 0% Special Defence Contribution on dividends and interest for {rates.nonDomYears} years. The only charge on dividends is GESY at {fmtPct(rates.gesy.passive)}, capped at {eur(rates.gesy.cap)} of income - so never more than {eur(Math.round(rates.gesy.cap * rates.gesy.passive))} a year.
              </p>
              <p className="body">Non-Dom status can only be obtained once Cyprus tax residency is established, under the 60-day or the 183-day rule. The comparison figures come from PwC Worldwide Tax Summaries and are the top-bracket rate a resident individual pays on a distribution.</p>
            </>
          }>
          <NonDomCalc rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "effective-rate":
      return (
        <ToolShell {...shell} intro="Corporate tax and GESY on distributed profit for a Non-Dom owner, next to what the same profit costs where you are now."
          aside={
            <>
              <span className="kicker">How it works</span>
              <h2>Cyprus at a glance</h2>
              <p className="body">
                Cyprus taxes corporate profits at <b>{fmtPct(rates.corporateTax)}</b> (from 1 January 2026). Distributions to a Non-Dom shareholder attract <b>0% dividend tax</b>; only <b>{fmtPct(rates.gesy.passive)} GESY</b> applies, and the contribution base is capped at <b>{eur(rates.gesy.cap)}</b>, so the effective rate falls as profit grows.
              </p>
              <p className="body">
                The headline figure is the effective tax on distributed profit for a Non-Dom resident who draws no salary. Director salary and personal income tax are outside it, and Non-Dom status follows tax residency - it is not the starting point.
              </p>
            </>
          }>
          <TaxCalculator rates={{ corporateTax: rates.corporateTax, gesyRate: rates.gesy.passive, gesyCap: rates.gesy.cap }} whatsapp={wa} />
        </ToolShell>
      );
    case "vat":
      return (
        <ToolShell {...shell} intro={`Add VAT to a net figure or take it out of a gross one, at ${rates.vatRates.map((r) => `${Math.round(r * 100)}%`).join(", ")}.`}>
          <VatCalc rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "ip-box":
      return (
        <ToolShell {...shell} intro="Tax with and without the IP Box on qualifying intellectual property income, at your nexus ratio."
          aside={
            <>
              <span className="kicker">Required reading</span>
              <h2>Before you rely on the figure</h2>
              <p className="body"><b>Trademarks and brand assets do not qualify.</b> Only patents, copyrighted software and functionally similar IP.</p>
              <p className="body"><b>The nexus ratio</b> reflects how much of the research and development was actually done by the company. Buying IP in from a related party collapses the benefit.</p>
              <p className="body"><b>A tax ruling</b> from the Cyprus Tax Department is normally obtained before relying on the regime. The effective rate is approximately {fmtPct((1 - rates.ipBoxExemption) * rates.corporateTax)} at full nexus - {Math.round(rates.ipBoxExemption * 100)}% exemption on the {fmtPct(rates.corporateTax)} corporate rate.</p>
            </>
          }>
          <IpBoxCalc rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "permit":
      return (
        <ToolShell {...shell} intro="Five questions, one per screen. You will see the route that usually applies to a situation like yours - eligibility is confirmed on a call.">
          <PermitWizard rates={rates} whatsapp={wa} />
        </ToolShell>
      );
    case "citizenship":
      return (
        <ToolShell {...shell} intro="Five questions about your Cypriot relative and your dates. You will see whether there may be a case, and which form it usually runs through.">
          <CitizenshipWizard whatsapp={wa} />
        </ToolShell>
      );
    case "calendar": {
      const today = new Date();
      const items = rates.calendar.map((e) => ({
        id: e.id,
        title: e.title,
        applies: e.applies,
        frequency: e.frequency,
        detail: e.detail,
        nextDue: nextDue(e, today)?.toISOString() ?? null,
      }));
      return (
        <ToolShell {...shell} intro="Every filing deadline in date order, for individuals, companies and employers, with the next one highlighted.">
          <TaxCalendar items={items} whatsapp={wa} />
        </ToolShell>
      );
    }
    case "compare":
      return (
        <ToolShell {...shell} wide intro="Select the jurisdictions you are weighing up. Best value in each column is highlighted; every row links to its source.">
          <div className="calc" style={{ padding: 22 }}>
            <CompareTool />
            <p className="fine" style={{ marginTop: 18 }}>
              Corporate income tax and VAT/GST figures are checked against{" "}
              <a href="https://taxsummaries.pwc.com" target="_blank" rel="noreferrer noopener" className="link-gold">PwC Worldwide Tax Summaries</a>
              {" "}— last full review {RATES_REVIEWED}. Any row added since is marked{" "}
              <span className="tag" style={{ color: "var(--mk-warn, #B5751B)" }}>unchecked</span>{" "}
              until it has been through the same review. Headline rates simplify many special regimes,
              and formation time, minimum capital and treaty counts are indicative. General information, not tax advice.
            </p>
            <ResultCta
              answer="Cyprus at 15% and 19% VAT"
              context="Headline rates are one input. Treaty access, substance, banking and where you personally live all change the answer - and Cyprus is not the right answer for everyone."
              whatsapp={wa}
            />
          </div>
        </ToolShell>
      );
    default:
      return (
        <main className="mk-container sec">
          <p>This tool is being built. <Link href="/tools" className="link-gold">Back to all tools</Link></p>
        </main>
      );
  }
}
