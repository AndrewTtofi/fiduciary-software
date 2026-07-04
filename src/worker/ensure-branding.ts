import { PrismaClient } from "@prisma/client";
import { pgAdapter } from "@/lib/prisma-adapter";

const prisma = new PrismaClient({ adapter: pgAdapter() });

/**
 * Idempotent white-label brand provisioning from env. Runs on every deploy.
 * The firm identity is configured ONCE as GitHub Actions variables (the same
 * COMPANY_NAME the deploy notifier uses) and injected into the box .env by the
 * deploy script — never hard-coded in the app.
 *
 * - COMPANY_NAME        → OrgSettings.brandName (required for any seeding)
 * - COMPANY_LEGAL_NAME  → OrgSettings.legalName (emails, legal pages, footer ©)
 * - COMPANY_EMAIL       → OrgSettings.contactEmail
 * - COMPANY_ADDRESS     → OrgSettings.address
 *
 * Each optional field is only written when its env var is set, so existing /
 * UI-customised branding is preserved. No-op when COMPANY_NAME is unset.
 * (Marketing-site contact details — phone/WhatsApp — are site content, edited
 * under Admin → Content; they are not env-provisioned.)
 */
export async function ensureBranding() {
  const name = process.env.COMPANY_NAME?.trim();
  if (!name) { console.log("[branding] COMPANY_NAME not set — leaving branding as-is."); return; }

  const optional: { legalName?: string; contactEmail?: string; address?: string } = {};
  const legalName = process.env.COMPANY_LEGAL_NAME?.trim();
  const contactEmail = process.env.COMPANY_EMAIL?.trim();
  const address = process.env.COMPANY_ADDRESS?.trim();
  if (legalName) optional.legalName = legalName;
  if (contactEmail) optional.contactEmail = contactEmail;
  if (address) optional.address = address;

  const row = await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: { brandName: name, ...optional },
    create: { id: "singleton", brandName: name, ...optional },
  });
  const extras = Object.keys(optional).length ? ` (+ ${Object.keys(optional).join(", ")})` : "";
  console.log(`[branding] set brandName="${row.brandName}"${extras}.`);
}

if (require.main === module) {
  ensureBranding()
    .then(() => console.log("[branding] done."))
    .catch((e) => { console.error("[branding] failed:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
