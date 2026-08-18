import { ServiceRowClient } from "./ServiceRowClient";
import { AddServiceModal } from "./AddServiceModal";

export type ServiceRow = {
  id: string;
  clientId: string;
  serviceType: string;
  status: "pending" | "in_progress" | "completed";
  startDate: string | null;
  notes: string | null;
};

export type StageWording = Record<ServiceRow["status"], string>;

const DEFAULT_WORDING: StageWording = { pending: "Pending", in_progress: "In progress", completed: "Completed" };

export function ServicesEngagedList({
  clientId, rows, taxonomy, stageLabels = {},
}: {
  clientId: string;
  rows: ServiceRow[];
  taxonomy: { key: string; label: string }[];
  /** Firm-edited stage wording per service key (Admin → Status stages). */
  stageLabels?: Record<string, StageWording>;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-meta font-bold uppercase tracking-widest text-admin-muted">Services Engaged</h2>
        <AddServiceModal clientId={clientId} taxonomy={taxonomy} />
      </div>
      {rows.length === 0
        ? <p className="text-meta text-admin-muted">No services yet.</p>
        : rows.map((r) => (
            <ServiceRowClient
              key={r.id}
              row={r}
              taxonomy={taxonomy}
              stages={stageLabels[r.serviceType] ?? DEFAULT_WORDING}
            />
          ))}
    </section>
  );
}
