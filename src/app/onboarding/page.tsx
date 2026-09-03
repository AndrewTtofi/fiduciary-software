import { ProgressBar } from "./ProgressBar";
import { PhaseIntro } from "./PhaseIntro";
import { ServicesPicker } from "./ServicesPicker";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { ensureProspect } from "@/lib/services/onboarding";
import { getDocumentsPhase } from "@/lib/services/settings";

export const metadata = { title: "Select services" };

/** /onboarding is the wizard's first page AND the generic "go to onboarding"
 *  target (middleware, sign-in). Post-call prospects land on their checklist
 *  instead, unless they deliberately opened this page to adjust services
 *  (`?edit=1`, linked from the checklist). */
export default async function OnboardingStep1({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireUser();
  const { edit } = await searchParams;
  const prospect = await ensureProspect(user.id);
  const documentsPhase = await getDocumentsPhase();
  const totalSteps = documentsPhase === "off" ? 2 : 3;
  const preselected = Array.isArray(prospect.servicesSelected)
    ? (prospect.servicesSelected as string[])
    : [];
  // Post-call prospects land on their checklist; the services they picked at
  // booking arrive pre-ticked here, so this reads as "confirm", not "choose".
  const postCall = !!prospect.leadId;
  if (postCall && edit !== "1") redirect("/onboarding/checklist");

  return (
    <>
      {postCall ? <div className="pt-10" /> : <ProgressBar step={1} totalSteps={totalSteps} />}
      <main className="container max-w-[1000px] pb-24">
        <PhaseIntro
          title={postCall ? "Here's what we discussed" : "What can we help you with?"}
          subtitle={postCall
            ? "Confirm or adjust — we've carried these over from your booking and your call."
            : "Select the services you're interested in. This helps us tailor your application."}
        />
        <ServicesPicker initialSelected={preselected} reference={prospect.referenceNumber} nextHref={postCall ? "/onboarding/checklist" : "/onboarding/details"} />
      </main>
    </>
  );
}
