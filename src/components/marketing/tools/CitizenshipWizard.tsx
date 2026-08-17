"use client";

import { Wizard, RouteCard, type WizardQuestion } from "@/components/marketing/tools/Wizard";
import { ResultCta } from "@/components/marketing/tools/ResultCta";

/* Tool 8 — Citizenship by Descent Checker. Five questions, then whether a
   case appears to exist and which form the route usually runs through.
   Wording rule: this tool never tells anyone they qualify. The wording is
   "there may be a case here", followed by the offer of a call — two people
   with the same Cypriot grandparent can have entirely different outcomes
   depending on dates and the family chain. */

const QUESTIONS: WizardQuestion[] = [
  {
    id: "relative",
    title: "Who is your Cypriot relative?",
    options: [
      { value: "parent", label: "A parent" },
      { value: "grandparent", label: "A grandparent" },
      { value: "great", label: "A great-grandparent" },
      { value: "spouse", label: "My spouse" },
    ],
  },
  {
    id: "born",
    title: "Were they born in Cyprus?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "parents", label: "No, but their parents were Cypriot" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "dob",
    title: "When were you born?",
    help: "16 August 1960 is the date of Cyprus independence; the rules differ either side of it.",
    options: [
      { value: "before", label: "Before 16 August 1960" },
      { value: "after", label: "On or after 16 August 1960" },
    ],
  },
  {
    id: "registered",
    title: "Was the linking parent a registered Cypriot citizen when you were born?",
    help: "The parent (or grandparent, for the next generation) through whom the descent runs.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "docs",
    title: "Which documents do you already hold?",
    options: [
      { value: "birth", label: "Their Cypriot birth certificate" },
      { value: "id", label: "Their Cypriot ID or passport" },
      { value: "marriage", label: "Marriage certificates" },
      { value: "none", label: "None yet" },
    ],
  },
];

const RULES = [
  "Before 16 August 1960, citizenship generally passed through the father only. On or after that date it can pass through either parent.",
  "A Cypriot grandparent alone is not automatically enough. The chain of descent has to be shown, generation by generation.",
  "The relevant ancestor must not have renounced Cypriot citizenship.",
];

const NOTE_TIME = "Document tracing is the longest part, and processing typically runs 12 to 18 months from a complete file.";
const NOTE_MILITARY = "For men aged 18 to 45, Cypriot military service obligations may apply on registration, with a reduced term for those permanently resident abroad.";

export function CitizenshipWizard({ whatsapp }: { whatsapp: string }) {
  return (
    <Wizard
      questions={QUESTIONS}
      intro="Five short questions. You will see whether there may be a case, and which form the route usually runs through - not a decision on your eligibility."
      result={(a) => {
        const docsNote =
          a.docs === "none"
            ? "You hold none of the supporting records yet - expect the tracing to take time; Cypriot civil records, especially pre-1960, are the documents that are usually hardest to obtain."
            : "You already hold some of the supporting records, which shortens the tracing; the rest of the chain still has to be evidenced.";
        const cta = (context: string) => <ResultCta answer="There may be a case here" context={context} whatsapp={whatsapp} />;
        const rules = (
          <div className="route-rules">
            <b>The rules that decide it</b>
            <ul>{RULES.map((r, k) => <li key={k}>{r}</li>)}</ul>
          </div>
        );

        // Spouse route → marriage-based application, different requirements
        if (a.relative === "spouse") {
          return (
            <>
              <RouteCard
                title="Citizenship through marriage - a separate application"
                lines={[
                  "Marriage to a Cypriot citizen opens a different route from descent, with its own requirements: a period of marriage and, usually, of residence together, and a review of the marriage itself.",
                  "The descent rules below do not apply; the marriage route is assessed on its own terms.",
                ]}
                documents={["Your marriage certificate", "Your spouse's Cypriot citizenship evidence", "Proof of cohabitation and residence", "Clean criminal record certificate"]}
              />
              {cta("Whether the marriage route is open to you, and when, is confirmed on a call.")}
            </>
          );
        }
        const unsure = a.born === "unsure" || a.registered === "unsure";
        if (unsure) {
          return (
            <>
              <RouteCard
                title="There may be a case here - it needs a proper look"
                lines={[
                  "One of your answers is \"not sure\", and in descent cases the answer turns on exactly those facts: where the ancestor was born, whether they held citizenship at the right moment, and whether it was ever renounced.",
                  docsNote,
                ]}
              >
                {rules}
                <p className="fine">{NOTE_TIME}</p>
              </RouteCard>
              {cta("Bring what you know about the family line to a call and we will tell you honestly whether it is worth opening a file.")}
            </>
          );
        }
        // Born before independence → male line, M71 / M72
        if (a.dob === "before") {
          return (
            <>
              <RouteCard
                title="Descent through the male line before independence - Form M71 or M72"
                lines={[
                  "For people born before 16 August 1960, citizenship generally passed through the father. Where the descent runs through the male line, the application usually runs through Form M71 or M72, depending on whether citizenship of the United Kingdom and Colonies was held.",
                  a.relative === "great" ? "Descent through a great-grandparent means three generations to evidence; each link must be shown." : docsNote,
                ]}
                documents={["Your birth certificate", "The ancestor's Cypriot birth certificate", "Marriage certificates linking each generation", "Evidence of the ancestor's citizenship status", "Your passport"]}
              >
                {rules}
                <p className="fine">{NOTE_TIME} {NOTE_MILITARY}</p>
              </RouteCard>
              {cta("Which of the two forms applies, and whether the male-line rule is satisfied, is confirmed on a call.")}
            </>
          );
        }
        // Minor whose parent acquired citizenship after birth
        // (we cannot know the applicant's age; the M126 route is mentioned as the alternative where relevant)
        if (a.relative === "parent" && a.registered === "yes") {
          return (
            <>
              <RouteCard
                title="Consular birth certificate route - Form M121"
                lines={[
                  "Born on or after 16 August 1960 to a parent who was a registered Cypriot citizen at the time - the most direct descent route. The application registers your birth as that of a Cypriot citizen.",
                  docsNote,
                ]}
                documents={["Your birth certificate", "Your parent's Cypriot birth certificate or citizenship certificate", "Your parents' marriage certificate", "Your parent's Cypriot ID or passport", "Your passport"]}
                secondary="For a child whose parent acquired citizenship only after the child was born, the route is Form M126 instead."
              >
                {rules}
                <p className="fine">{NOTE_TIME} {NOTE_MILITARY}</p>
              </RouteCard>
              {cta("The record chain is usually short here; a call confirms the documents and the consulate to file through.")}
            </>
          );
        }
        if (a.relative === "parent" && a.registered === "no") {
          return (
            <>
              <RouteCard
                title="Parent of Cypriot origin, not registered at your birth - Form M123"
                lines={[
                  "Where the linking parent was not a registered citizen when you were born but was entitled to register by reason of Cypriot origin, the application usually runs through Form M123.",
                  "In a British or Commonwealth context, an adult of Cypriot origin may instead fall under Form M124, which carries additional conditions including a residence element.",
                  docsNote,
                ]}
                documents={["Your birth certificate", "Your parent's birth certificate", "Your grandparent's Cypriot birth certificate", "Marriage certificates linking the generations", "Your passport"]}
                secondary="Form M124 - where the residence conditions can be met."
              >
                {rules}
                <p className="fine">{NOTE_TIME} {NOTE_MILITARY}</p>
              </RouteCard>
              {cta("Whether the parent's entitlement to register can be evidenced decides this - we look at that first.")}
            </>
          );
        }
        // Grandparent / great-grandparent, born after 1960
        return (
          <>
            <RouteCard
              title={a.relative === "great" ? "Descent through a great-grandparent - the chain must be shown" : "Descent through a grandparent - the chain must be shown"}
              lines={[
                "A Cypriot grandparent alone is not automatically enough. The usual path is that your parent's own entitlement is established first (Form M123, or M121 where they were registered), and your application follows from theirs.",
                a.registered === "yes"
                  ? "You said the linking parent was a registered citizen at your birth - if so, your own application may run through Form M121 directly."
                  : "Where the linking parent was never registered, their entitlement by origin has to be evidenced before yours can be.",
                docsNote,
              ]}
              documents={["Your birth certificate", "Your parent's birth certificate", "The grandparent's Cypriot birth certificate", "Marriage certificates for each generation", "Evidence that no one in the chain renounced citizenship", "Your passport"]}
              secondary="Form M124 - in a British or Commonwealth context, where the residence conditions can be met."
            >
              {rules}
              <p className="fine">{NOTE_TIME} {NOTE_MILITARY}</p>
            </RouteCard>
            {cta("Two people with the same Cypriot grandparent can have entirely different outcomes. A call tells you whether the chain in your family can be shown.")}
          </>
        );
      }}
    />
  );
}
