import Link from "next/link";

export type ClientDocRow = {
  id: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  status: "received" | "under_review" | "approved" | "reupload_needed";
  uploadedAt: Date;
};

export function ClientFolderBlock({ id, label, documents }: { id: string; label: string; documents: ClientDocRow[] }) {
  return (
    <section id={id} className="bg-[var(--client-surface)] border border-token rounded-card p-6 mb-4 scroll-mt-24">
      <h3 className="font-display text-lg mb-3">{label} <span className="text-meta text-muted font-normal">({documents.length})</span></h3>
      {documents.length === 0 ? <p className="text-meta text-muted">No documents in this folder yet.</p> : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex justify-between items-center text-meta">
              <Link href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="underline">{d.originalName}</Link>
              <span className="text-[11px] text-muted">
                {(d.sizeBytes / 1024).toFixed(0)} KB · {new Date(d.uploadedAt).toLocaleDateString()} · {d.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
