"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/* A sortable admin table.

   Cells arrive pre-rendered from the server component that owns the page, so
   every table keeps its own bespoke markup (flags, avatars, badges) while the
   sorting, row activation and empty state live here once. Each row carries a
   parallel `sort` array — the value to order by for the column at that index —
   because sorting the rendered ReactNode is not possible. */

export type DataColumn = {
  label: string;
  /** Omit to make the column unsortable (actions, free text). */
  sortable?: boolean;
  /** Right-align numeric columns. */
  numeric?: boolean;
};

export type DataRow = {
  key: string;
  cells: ReactNode[];
  /** Sort keys, one per column. `null` always sorts last. */
  sort?: (string | number | null)[];
  /** Navigate here when the row is activated. */
  href?: string;
};

function compare(a: string | number | null | undefined, b: string | number | null | undefined) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;   // blanks sink, in both directions
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function DataTable({
  title,
  count,
  columns,
  rows,
  emptyTitle = "No records",
  emptyBody = "Nothing matches this filter yet.",
  foot,
  onRowClick,
}: {
  title?: string;
  count?: ReactNode;
  columns: DataColumn[];
  rows: DataRow[];
  emptyTitle?: string;
  emptyBody?: string;
  foot?: ReactNode;
  /** Client-side row activation; takes precedence over row.href. */
  onRowClick?: (key: string) => void;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);

  const ordered = useMemo(() => {
    if (!sort) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    // Blanks sink regardless of direction, so undo the flip for them.
    return [...rows].sort((a, b) => {
      const av = a.sort?.[sort.col] ?? null;
      const bv = b.sort?.[sort.col] ?? null;
      const aEmpty = av === null || av === "";
      const bEmpty = bv === null || bv === "";
      if (aEmpty || bEmpty) return compare(av, bv);
      return dir * compare(av, bv);
    });
  }, [rows, sort]);

  function toggle(col: number) {
    setSort((s) => (s?.col === col && s.dir === "asc" ? { col, dir: "desc" } : { col, dir: "asc" }));
  }

  function activate(row: DataRow) {
    if (onRowClick) onRowClick(row.key);
    else if (row.href) router.push(row.href);
  }

  /** A click on a control inside the row belongs to that control. Without this
   *  a Reschedule, Verify or Deactivate button navigates the row instead of
   *  doing its job — the click bubbles straight into the row handler. */
  function fromControl(target: EventTarget | null) {
    return target instanceof Element && !!target.closest("a, button, input, select, textarea, label");
  }

  const interactive = !!onRowClick || rows.some((r) => r.href);

  return (
    <div className="tbl-wrap">
      {(title || count !== undefined) && (
        <div className="tbl-toolbar">
          {title && <strong>{title}</strong>}
          {count !== undefined && <span className="muted right" style={{ fontSize: "var(--fs-xs)" }}>{count}</span>}
        </div>
      )}
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c, i) => {
              const active = sort?.col === i;
              return c.sortable === false || !c.sortable ? (
                <th key={c.label} className={c.numeric ? "t-num" : undefined}>{c.label}</th>
              ) : (
                <th
                  key={c.label}
                  className={`th-sort${c.numeric ? " t-num" : ""}`}
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  tabIndex={0}
                  role="columnheader"
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}
                >
                  {c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty"><h3>{emptyTitle}</h3><p>{emptyBody}</p></div>
              </td>
            </tr>
          ) : (
            ordered.map((r) => (
              <tr
                key={r.key}
                {...(interactive
                  ? {
                      "data-rowkey": r.key,
                      tabIndex: 0,
                      onClick: (e: React.MouseEvent) => { if (!fromControl(e.target)) activate(r); },
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" && !fromControl(e.target)) { e.preventDefault(); activate(r); }
                      },
                    }
                  : {})}
              >
                {r.cells.map((cell, i) => (
                  <td key={i} className={columns[i]?.numeric ? "t-num" : undefined}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {foot && <div className="tbl-foot">{foot}</div>}
    </div>
  );
}
