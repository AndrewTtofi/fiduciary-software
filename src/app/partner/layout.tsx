import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getBranding, tierAtLeast } from "@/lib/services/branding";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("partner");
  const { planTier, brandName } = await getBranding();

  // The partner portal is a Professional+ feature. Copy stays neutral — firm
  // staff and partners never see internal tier names.
  if (!tierAtLeast(planTier, "professional")) {
    return (
      <div className="auth-wrap">
        <div className="card" style={{ maxWidth: 520, textAlign: "center", padding: "var(--space-12)" }}>
          <h3 style={{ fontWeight: 600, fontSize: "var(--fs-h3)" }}>Partner portal unavailable</h3>
          <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)" }}>
            {brandName}&apos;s platform package does not include scoped partner access. Please
            contact the firm directly.
          </p>
          <Link href="/" className="btn btn-secondary mt-6">Back to site</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
