import { redirect } from "next/navigation";
import { ProgressBar } from "../ProgressBar";
import { PhaseIntro } from "../PhaseIntro";
import { DetailsForm } from "./DetailsForm";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getDocumentsPhase } from "@/lib/services/settings";

export const metadata = { title: "Your details" };

export default async function OnboardingStep2({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const user = await requireUser();
  const { section } = await searchParams;
  const prospect = await prisma.prospect.findUnique({ where: { userId: user.id } });
  if (!prospect) redirect("/onboarding");
  if (!Array.isArray(prospect.servicesSelected) || prospect.servicesSelected.length === 0) {
    redirect("/onboarding");
  }

  const services = prospect.servicesSelected as string[];
  const draft = (prospect.draft as Record<string, unknown> | null) ?? {};
  const documentsPhase = await getDocumentsPhase();
  const totalSteps = documentsPhase === "off" ? 2 : 3;
  // Activated from a lead: identity fields are pre-filled from the booking and
  // the business essay is optional (adviser-assisted).
  const postCall = !!prospect.leadId;
  const initialSection = section === "intent" || section === "specifics" ? section : "personal";

  return (
    <>
      {postCall ? <div className="pt-10" /> : <ProgressBar step={2} totalSteps={totalSteps} />}
      <PhaseIntro
        title={postCall ? "A few details to complete" : "Your details"}
        subtitle={postCall
          ? "Most of this came in with your booking — we only need the gaps."
          : "Tell us about you and your goals so we can tailor your application."}
      />
      <DetailsForm
        services={services}
        initialDraft={draft}
        reference={prospect.referenceNumber}
        userFullName={user.fullName ?? user.email}
        documentsPhase={documentsPhase}
        relaxed={postCall}
        initialSection={initialSection}
      />
    </>
  );
}
