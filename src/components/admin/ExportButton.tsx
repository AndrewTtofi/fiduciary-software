import type { ExportKind } from "@/lib/services/export";

/** "Export to Excel" link for the pipeline tables. A plain anchor: the route
 *  is staff-only and answers with an attachment, so the browser downloads it
 *  without any client-side state. */
export function ExportButton({ kind }: { kind: ExportKind }) {
  return (
    <a href={`/api/admin/export/${kind}`} download className="btn btn-ghost btn-sm" style={{ gap: 8 }}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width={16} height={16}>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Export to Excel
    </a>
  );
}
