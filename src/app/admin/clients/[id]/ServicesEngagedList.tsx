import { ServiceRowClient } from "./ServiceRowClient";
import { AddServiceModal } from "./AddServiceModal";

export type ServiceRow = {
  id: string;
  clientId: string;
  serviceType: string;
  status: "pending" | "in_progress" | "completed";
  assignedPartnerId: string | null;
  startDate: string | null;
  notes: string | null;
};

export function ServicesEngagedList({
  clientId, rows, partners, taxonomy,
}: {
  clientId: string;
  rows: ServiceRow[];
  partners: { id: string; fullName: string }[];
  taxonomy: { key: string; label: string }[];
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-meta font-bold uppercase tracking-widest text-admin-muted">Services Engaged</h2>
        <AddServiceModal clientId={clientId} taxonomy={taxonomy} partners={partners} />
      </div>
      {rows.length === 0
        ? <p className="text-meta text-admin-muted">No services yet.</p>
        : rows.map((r) => (
            <ServiceRowClient
              key={r.id}
              row={r}
              partners={partners}
              taxonomy={taxonomy}
            />
          ))}
    </section>
  );
}
