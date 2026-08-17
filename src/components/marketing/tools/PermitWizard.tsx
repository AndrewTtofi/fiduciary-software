"use client";

import type { ToolSettings } from "@/lib/data/tax-rates";
import { Wizard, RouteCard, type WizardQuestion } from "@/components/marketing/tools/Wizard";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 7 — Which Permit Do I Need? Five questions, then the residence route
   that usually applies to a situation like the visitor's. Wording rule: the
   output never states that someone qualifies — it names the route that
   usually applies and says eligibility is confirmed on a call. */

const QUESTIONS: WizardQuestion[] = [
  {
    id: "passport",
    title: "Which passport do you hold?",
    help: "If you hold more than one, pick the one you would use to move.",
    options: [
      { value: "eu", label: "EU or EEA (or Swiss)" },
      { value: "uk", label: "United Kingdom" },
      { value: "other", label: "Another country" },
    ],
  },
  {
    id: "stay",
    title: "How long do you plan to stay in Cyprus?",
    options: [
      { value: "short", label: "Under 3 months" },
      { value: "medium", label: "3 months to a year" },
      { value: "long", label: "More than a year" },
      { value: "permanent", label: "Permanently" },
    ],
  },
  {
    id: "income",
    title: "Where will your income come from?",
    options: [
      { value: "cy-employer", label: "A Cyprus employer, or an offer from one" },
      { value: "remote", label: "A foreign employer or foreign clients, working remotely" },
      { value: "own-company", label: "My own company" },
      { value: "passive", label: "Pension, savings or investments" },
    ],
  },
  {
    id: "family",
    title: "Who is moving with you?",
    options: [
      { value: "solo", label: "Just me" },
      { value: "spouse", label: "My spouse" },
      { value: "family", label: "My spouse and children" },
    ],
  },
  {
    id: "property",
    title: "And property in Cyprus?",
    options: [
      { value: "own", label: "I own property in Cyprus" },
      { value: "buy", label: "I intend to buy" },
      { value: "rent", label: "Renting, or not decided" },
    ],
  },
];

const eur = (n: number) => "€" + n.toLocaleString("en-US");

export function PermitWizard({ rates, whatsapp }: { rates: ToolSettings; whatsapp: string }) {
  const prProperty = eur(rates.permanentResidencyProperty);
  const dnvIncome = rates.digitalNomad.minMonthlyIncome ? `${eur(rates.digitalNomad.minMonthlyIncome)} a month` : null;

  return (
    <Wizard
      questions={QUESTIONS}
      intro="Five short questions. You will see the route that usually applies to a situation like yours - not a decision on your eligibility, which is confirmed on a call."
      result={(a) => {
        const family = a.family !== "solo";
        const familyNote = family
          ? "Because your spouse" + (a.family === "family" ? " and children are" : " is") + " moving with you, family reunification is usually the second step once your own status is in place."
          : undefined;
        const cta = (context: string) => (
          <ResultCta answer="Confirm your route" context={context} whatsapp={whatsapp} />
        );

        // EU / EEA, over 3 months → Registration Certificate (Yellow Slip), any income source
        if (a.passport === "eu" && a.stay !== "short") {
          return (
            <>
              <RouteCard
                title="Registration Certificate - the Yellow Slip"
                lines={[
                  "EU and EEA nationals staying more than three months register their residence rather than apply for a permit. The certificate confirms your right to live in Cyprus, whatever your income source.",
                  "The application is made in person, with proof of where you live and how you support yourself; family members registering with you follow a parallel process.",
                ]}
                timeline="Appointment-led; typically a few weeks to a few months depending on the district office."
                documents={["Passport", "Proof of address in Cyprus (rental contract or title deed)", "Proof of income, employment or means", "Health cover where required", "Marriage and birth certificates for family members"]}
                secondary={familyNote}
              />
              {cta("Eligibility, and the exact document set for your district, is confirmed on a call.")}
            </>
          );
        }
        if (a.passport === "eu" && a.stay === "short") {
          return (
            <>
              <RouteCard
                title="No permit needed for a stay under three months"
                lines={["EU and EEA nationals can stay in Cyprus for up to three months without registering. If the stay extends beyond that, the Registration Certificate (Yellow Slip) is the next step."]}
                secondary="Thinking about staying longer, or about tax residency under the 60-day rule? That is where the planning starts."
              />
              {cta("If a longer stay is on the cards, we will map the registration and the tax side together.")}
            </>
          );
        }
        // Non-EU, under 3 months → visitor status
        if (a.stay === "short") {
          return (
            <>
              <RouteCard
                title="Visitor status - no residence permit needed"
                lines={["For a stay under three months you enter as a visitor (with a visa where your passport needs one). No residence permit applies. Working for a Cyprus employer on visitor status is not permitted."]}
                secondary="If the visit is a first look before a longer move, the routes below are what comes next: the Digital Nomad Visa, an employer permit, or the Pink Slip."
              />
              {cta("Tell us what comes after the visit and we will tell you the route to prepare for.")}
            </>
          );
        }
        // Non-EU, permanent + property → Permanent Residency Reg 6(2)
        if (a.stay === "permanent" && (a.property === "own" || a.property === "buy") && a.income !== "cy-employer") {
          return (
            <>
              <RouteCard
                title={`Permanent Residency under Regulation 6(2) - the ${prProperty} property route`}
                lines={[
                  `A permanent residence permit for non-EU nationals who invest at least ${prProperty} in new residential property (or certain other qualifying investments) and can show a secure annual income from abroad.`,
                  "The permit covers your spouse and dependent children. It does not allow employment in Cyprus, though holding shares in a Cyprus company and receiving dividends is permitted.",
                ]}
                timeline="Typically a few months from a complete file."
                documents={["Passport", "Proof of the property purchase and payment", "Proof of secure annual income from abroad", "Clean criminal record certificate", "Health insurance", "Marriage and birth certificates for dependants"]}
                secondary={a.income === "own-company" ? "If your company is a registered foreign-interest company, the Business Facilitation Unit route may get you working sooner; the two can run in sequence." : familyNote}
              />
              {cta("Whether the investment and income evidence meet the test is confirmed on a call - before any property decision.")}
            </>
          );
        }
        // Non-EU, remote → Digital Nomad Visa
        if (a.income === "remote") {
          return (
            <>
              <RouteCard
                title="Digital Nomad Visa"
                lines={[
                  "A temporary residence permit for non-EU nationals who work remotely for an employer or clients outside Cyprus. It is issued for a year and can be renewed, and family members can join you on dependant permits (without the right to work locally).",
                  dnvIncome
                    ? `You must show a stable income from abroad of at least ${dnvIncome} (more with dependants), plus health cover and a clean record.`
                    : "You must show a stable income from abroad above the published threshold (higher with dependants), plus health cover and a clean record. The scheme has a cap on places, so timing matters.",
                ]}
                timeline="Typically one to three months from submission."
                documents={["Passport", "Employment contract or client agreements showing remote work", "Bank statements proving the income", "Health insurance", "Clean criminal record certificate", "Proof of accommodation"]}
                secondary={a.stay === "permanent" ? `Planning to stay for good? Permanent Residency under Regulation 6(2) (${prProperty} property) is the longer-term route to look at.` : familyNote}
              />
              {cta("The threshold, the cap and whether your remote work fits the definition are confirmed on a call.")}
            </>
          );
        }
        // Non-EU, offer from Cyprus employer → Ministry of Labour permit / BFU
        if (a.income === "cy-employer") {
          return (
            <>
              <RouteCard
                title="Employer-sponsored work permit through the Ministry of Labour"
                lines={[
                  "Your employer applies for permission to employ a third-country national; once approved, you receive a temporary residence and employment permit tied to that job.",
                  "If the employer is a registered foreign-interest company, the Business Facilitation Unit route applies instead - faster, with higher salary thresholds and the ability to bring family from the start.",
                ]}
                timeline="Typically two to four months; faster through the Business Facilitation Unit."
                documents={["Passport", "Employment contract stamped by the Ministry of Labour", "Employer's registration documents", "Qualifications and CV", "Health insurance and medical tests", "Clean criminal record certificate"]}
                secondary={familyNote ?? "Family members can usually follow through family reunification once your permit is issued; under the BFU route they can apply alongside you."}
              />
              {cta("Which of the two routes applies depends on your employer's status - we check that first, then the timeline.")}
            </>
          );
        }
        // Non-EU, own company → BFU where the company qualifies, otherwise director permit
        if (a.income === "own-company") {
          return (
            <>
              <RouteCard
                title="Business Facilitation Unit route (where the company qualifies), otherwise a director permit"
                lines={[
                  "If your Cyprus company is (or can become) a registered foreign-interest company, the Business Facilitation Unit issues residence and work permits for its directors and key staff, with family included.",
                  "Where the company does not meet those criteria, a director's temporary residence and employment permit through the Ministry of Labour is the usual alternative.",
                ]}
                timeline="BFU: typically one to two months from a complete file. Director permit: two to four months."
                documents={["Passport", "Company incorporation documents and share structure", "Evidence of foreign investment in the company", "Business plan or activity description", "Health insurance", "Clean criminal record certificate"]}
                secondary={a.stay === "permanent" && a.property !== "rent" ? `For the long term, Permanent Residency under Regulation 6(2) (${prProperty} property) can sit alongside the company route.` : familyNote}
              />
              {cta("Whether the company qualifies for the BFU is the first question - and it changes everything downstream.")}
            </>
          );
        }
        // Non-EU, pension / savings, no work → Pink Slip
        if (a.income === "passive") {
          return (
            <>
              <RouteCard
                title="Temporary Residence Permit on financial means - the Pink Slip"
                lines={[
                  "For non-EU nationals who will live in Cyprus without working here, supported by pension, savings or investment income from abroad. Issued for a year at a time and renewable.",
                  "You must show sufficient, stable income from outside Cyprus, a place to live and health cover. Working in Cyprus, including for your own company, is not permitted on this permit.",
                ]}
                timeline="Typically three to six months."
                documents={["Passport", "Proof of income or savings from abroad", "Rental contract or title deed", "Health insurance", "Clean criminal record certificate", "Bank account in Cyprus"]}
                secondary={a.stay === "permanent" && a.property !== "rent" ? `Staying permanently and buying property? Permanent Residency under Regulation 6(2) (${prProperty}) removes the annual renewal.` : familyNote}
              />
              {cta("The income evidence the district office expects varies - we confirm what to prepare on a call.")}
            </>
          );
        }
        // Nothing fits cleanly
        return (
          <>
            <RouteCard
              title="Your situation needs a proper look"
              lines={["More than one route could apply here, or none fits cleanly. That is normal - dual citizenship, mixed income and family circumstances all change the answer."]}
            />
            {cta("Thirty minutes on a call and we will name the route, the timeline and what it involves.")}
          </>
        );
      }}
    />
  );
}
