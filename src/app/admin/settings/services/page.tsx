import { getServices } from "@/lib/services/settings";
import { ServicesTable } from "./ServicesTable";

export const metadata = { title: "Services · Settings" };
export const dynamic = "force-dynamic";

export default async function ServicesSettingsPage() {
  const services = await getServices();
  return <ServicesTable initial={services.map((s) => ({
    id: s.id, key: s.key, label: s.label,
    description: s.description, sortOrder: s.sortOrder, active: s.active,
  }))} />;
}
