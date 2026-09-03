import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getDocumentsPhase } from "@/lib/services/settings";
import { SendToCompliance } from "./SendToCompliance";

export const metadata = { title: "Your onboarding" };
export const dynamic = "force-dynamic";

/** The post-call landing: not a form, a short list where the first thing they
 *  can actually do is upload documents. The consultation is shown as already
 *  done, details are "mostly pre-filled", the business essay is last and
 *  optional. Self-starters keep the linear wizard. */
export default async function OnboardingChecklist() {
  const user = await requireUser();
  const prospect = await prisma.prospect.findUnique({
    where: { userId: user.id },
    include: {
      documents: { select: { type: true } },
      details: { select: { fieldName: true } },
      complianceFile: { select: { id: true } },
      user: { select: { fullName: true } },
    },
  });
  if (!prospect) redirect("/onboarding");
  if (!prospect.leadId) redirect("/onboarding");

  const documentsPhase = await getDocumentsPhase();
  const hasPassport = prospect.documents.some((d) => d.type === "passport");
  const hasProof = prospect.documents.some((d) => d.type === "proof_of_address");
  const docsDone = documentsPhase === "mandatory" ? hasPassport && hasProof : prospect.documents.length > 0;
  const detailsDone = prospect.details.length > 0;
  const draft = (prospect.draft as Record<string, unknown> | null) ?? {};
  const businessDone = typeof draft.businessDescription === "string" && draft.businessDescription.trim().length > 0;
  const submitted = !!prospect.complianceFile;
  const first = prospect.user.fullName.split(" ")[0] || "there";
  const services = Array.isArray(prospect.servicesSelected) ? (prospect.servicesSelected as string[]) : [];
  const callDate = prospect.consultationDoneAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  return (
    <main className="container max-w-[720px] pb-24 pt-10">
      <div className="text-center max-w-[640px] mx-auto px-4 mb-10">
        <h1 className="font-display text-4xl mb-3">Welcome back, {first}</h1>
        <p className="text-muted text-lg">
          {submitted
            ? "Your file is with our compliance team — you can still add documents or details below."
            : "Great speaking with you. Here's what we need to get your file moving — start with your documents."}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        <Item done n="✓" title="Consultation" body={callDate ? `Completed on ${callDate} with your adviser` : "Completed with your adviser"} />
        <Item
          done={services.length > 0}
          n="✓"
          title="Services we discussed"
          body={services.length ? services.map(prettyService).join(" · ") : "Pick the services you need"}
          href="/onboarding?edit=1"
          cta="Adjust"
        />
        <Item
          done={docsDone}
          n="1"
          title="Upload your documents"
          body={documentsPhase === "mandatory" ? "Passport and proof of address — start here" : "Passport, proof of address — optional but it speeds things up"}
          href="/onboarding/documents"
          cta={docsDone ? "Manage" : "Upload →"}
          primary={!docsDone}
        />
        <Item
          done={detailsDone}
          n="2"
          title="Confirm your details"
          body="Mostly pre-filled from your booking — a quick check, plus date of birth and address"
          href="/onboarding/details"
          cta={detailsDone ? "Review" : "Check →"}
          primary={docsDone && !detailsDone}
        />
        <Item
          done={businessDone}
          n="3"
          title="A little on your business"
          body="Rough is fine — your adviser can help with this. Skip and come back anytime."
          href="/onboarding/details?section=intent"
          cta={businessDone ? "Edit" : "Add →"}
        />
      </ol>

      <div className="surface rounded-card p-6 mt-8 flex justify-between items-center gap-4 flex-wrap">
        <div>
          <div className="font-semibold">{submitted ? "Sent to compliance" : "Ready to send?"}</div>
          <p className="text-meta text-muted mt-1">
            {submitted
              ? "We'll message you in your portal as your file progresses."
              : documentsPhase === "mandatory" && !docsDone
                ? "Upload your passport and proof of address first."
                : "You can send now and add the rest later with your adviser."}
          </p>
        </div>
        {submitted ? (
          <Link href="/app/dashboard" className="btn btn-primary px-6 py-3">Go to your dashboard →</Link>
        ) : (
          <SendToCompliance disabled={documentsPhase === "mandatory" && !docsDone} />
        )}
      </div>
    </main>
  );
}

function prettyService(s: string) {
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function Item({ done, n, title, body, href, cta, primary }: {
  done: boolean; n: string; title: string; body: string; href?: string; cta?: string; primary?: boolean;
}) {
  return (
    <li className="surface rounded-card p-6 flex items-center gap-5">
      <span
        className="w-9 h-9 rounded-full grid place-items-center text-sm font-semibold shrink-0"
        style={done ? { background: "var(--accent)", color: "var(--dark)" } : { background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
      >
        {done ? "✓" : n}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-meta text-muted mt-0.5">{body}</div>
      </div>
      {href && cta && (
        <Link href={href} className={`btn ${primary ? "btn-primary" : "btn-ghost"} btn-sm shrink-0`}>{cta}</Link>
      )}
    </li>
  );
}
