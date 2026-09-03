import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Application submitted" };

export default async function OnboardingSuccess() {
  const user = await requireUser();
  const prospect = await prisma.prospect.findUnique({ where: { userId: user.id } });
  if (!prospect) notFound();

  const submittedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  // Post-call prospects already had their consultation — never tell them to
  // wait for approval before "booking a call" (spec §10, screens 6–7).
  const postCall = !!prospect.consultationDoneAt;
  const first = (user.fullName ?? "").split(" ")[0] || "there";
  const services = Array.isArray(prospect.servicesSelected)
    ? (prospect.servicesSelected as string[]).map(prettyService).join(", ")
    : "—";

  return (
    <main className="min-h-screen grid place-items-center p-10">
      <div className="w-full max-w-[600px] text-center">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full grid place-items-center text-4xl animate-scale-in"
             style={{ background: "var(--accent)", color: "var(--dark)" }}>
          ✓
        </div>
        <h1 className="font-display text-4xl mb-4">{postCall ? "Documents received" : "Application Submitted Successfully"}</h1>
        <p className="text-lg text-muted mb-12">
          {postCall
            ? `Thanks, ${first}. Your documents are with our compliance team — we'll message you here as your file progresses.`
            : `Thank you, ${user.fullName ?? "—"}. Your application is now being reviewed by our compliance team.`}
        </p>

        <div className="surface rounded-card p-8 text-left mb-12">
          <div className="grid gap-6 sm:grid-cols-2">
            <SummaryItem label="Reference Number" value={prospect.referenceNumber} mono />
            <SummaryItem label="Date Submitted" value={submittedDate} mono />
            <SummaryItem label="Services Selected" value={services} />
            <SummaryItem label="Applicant" value={user.fullName ?? user.email} />
          </div>
        </div>

        <div className="text-left mb-12">
          <h2 className="text-lg font-semibold mb-3">What happens next?</h2>
          <p className="text-meta text-muted leading-relaxed">
            {postCall
              ? "Compliance verifies your documents, usually within 24–48 business hours. Your adviser will pick up anything still open with you directly — nothing more to do right now."
              : "Our team will review your application within 24–48 business hours. You'll receive an email notification when it has been reviewed, and we'll be in touch to arrange your consultation."}
          </p>
        </div>

        <Link href="/app/dashboard" className="btn btn-primary px-10 py-3.5">{postCall ? "Go to your dashboard" : "Go to Dashboard"}</Link>
      </div>
    </main>
  );
}

function SummaryItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[12px] uppercase tracking-widest text-muted mb-1.5 font-semibold">{label}</div>
      <div className={`text-base font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function prettyService(s: string) {
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
