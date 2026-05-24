import { redirect } from "next/navigation";
import { ClientShell } from "@/components/client/ClientShell";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { SettingsForms } from "./SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");
  const prospect = await prisma.prospect.findUnique({ where: { userId: user.id } });
  const isApproved = prospect?.status === "approved";

  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    select: {
      address: true,
      taxResidency: true,
      companyName: true,
      registrationNumber: true,
      vatNumber: true,
      engagementLetterDate: true,
    },
  });

  const clientFields = client
    ? {
        address: client.address,
        taxResidency: client.taxResidency,
        companyName: client.companyName,
        registrationNumber: client.registrationNumber,
        vatNumber: client.vatNumber,
        engagementLetterDate: client.engagementLetterDate
          ? client.engagementLetterDate.toISOString().split("T")[0]
          : null,
      }
    : null;

  return (
    <ClientShell active="settings" approved={isApproved}>
      <div className="max-w-[680px]">
        <div className="mb-10">
          <p className="eyebrow mb-2">Settings</p>
          <h1 className="font-display text-3xl">Account preferences</h1>
        </div>
        <SettingsForms
          initial={{
            fullName: dbUser.fullName,
            email: dbUser.email,
            phone: dbUser.phone ?? "",
            languagePref: dbUser.languagePref,
          }}
          clientFields={clientFields}
        />
      </div>
    </ClientShell>
  );
}
