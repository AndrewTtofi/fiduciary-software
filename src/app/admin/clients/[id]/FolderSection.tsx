import { DocumentRow, type DocRowProps } from "./DocumentRow";
import { UploadButton } from "./UploadButton";
import { CancelRequestClient } from "./CancelRequestClient";
import { BUCKET_KYC, BUCKET_CORRESPONDENCE } from "@/lib/services/documents-bucket";

export type DocRequestRow = {
  id: string;
  description: string;
  serviceTypeKey: string | null;
  dueAt: string | null;
  state: "open" | "fulfilled" | "cancelled";
};

export function FolderSection({
  id, clientId, folderKey, label, documents, openRequests,
}: {
  id: string;
  clientId: string;
  folderKey: string;
  label: string;
  documents: DocRowProps[];
  openRequests: DocRequestRow[];
}) {
  const isKyc = folderKey === BUCKET_KYC;
  const isCorrespondence = folderKey === BUCKET_CORRESPONDENCE;
  const serviceTypeKey = isKyc || isCorrespondence ? null : folderKey;
  const defaultPurpose: "passport" | "proof_of_address" | "sof" | "other" = isKyc ? "passport" : "other";

  return (
    <section id={id} className="bg-admin-surface border border-admin-border rounded-card p-6 mb-4 scroll-mt-24">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg">{label} <span className="text-meta text-admin-muted font-normal">({documents.length})</span></h3>
        <UploadButton clientId={clientId} serviceTypeKey={serviceTypeKey} defaultPurpose={defaultPurpose} />
      </div>

      {documents.length === 0 ? <p className="text-meta text-admin-muted">No documents yet.</p> : (
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FDFDFD" }}>
              <Th>Name</Th><Th>Type</Th><Th>Size</Th><Th>Uploaded</Th><Th>Status</Th><Th>{""}</Th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => <DocumentRow key={d.id} doc={d} />)}
          </tbody>
        </table>
      )}

      {openRequests.length > 0 && (
        <div className="mt-4 border-t border-admin-border pt-4">
          <div className="text-[11px] uppercase tracking-widest text-admin-muted font-semibold mb-2">Open requests</div>
          <ul className="flex flex-col gap-2">
            {openRequests.map((r) => (
              <li key={r.id} className="flex justify-between items-center text-meta">
                <span>
                  {r.description}
                  {r.dueAt && <span className="ml-2 font-mono text-[12px] text-admin-muted">due {new Date(r.dueAt).toLocaleDateString()}</span>}
                </span>
                <CancelRequestClient id={r.id} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-2 text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{children}</th>;
}
