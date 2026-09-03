import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { PhaseIntro } from "../PhaseIntro";
import { WelcomeForm } from "./WelcomeForm";

export const metadata = { title: "Confirm your details" };
export const dynamic = "force-dynamic";

/** First screen after the activation link. Replaces the blank "Create account"
 *  form: everything the booking captured is already filled in, the email is
 *  locked (it is the identity key the link just verified) and a password is
 *  optional — they are signed in already. */
export default async function OnboardingWelcome() {
  const user = await requireUser();
  const [dbUser, prospect] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { fullName: true, email: true, phone: true, passwordHash: true } }),
    prisma.prospect.findUnique({ where: { userId: user.id }, select: { leadId: true } }),
  ]);
  // Self-starters (public sign-up) have nothing to confirm — normal wizard.
  if (!dbUser || !prospect?.leadId) redirect("/onboarding");

  return (
    <main className="container max-w-[640px] pb-24 pt-10">
      <PhaseIntro
        title="Welcome back, let's confirm you"
        subtitle="You're signed in securely from your link — just check these are right."
      />
      <WelcomeForm
        fullName={dbUser.fullName}
        email={dbUser.email}
        phone={dbUser.phone ?? ""}
        hasPassword={!!dbUser.passwordHash}
      />
    </main>
  );
}
