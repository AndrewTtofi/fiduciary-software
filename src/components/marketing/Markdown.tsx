import type { ReactNode } from "react";

/* Minimal markdown renderer for Insights article bodies — headings (with
   anchor ids for the contents list), lists, tables, bold/italic and links. Deliberately dependency-free: article authors are
   staff (trusted input), and everything renders through React elements so
   nothing is injected as raw HTML. */

function inline(text: string, keyBase: string): ReactNode[] {
  // images first (![alt](src) contains a link pattern), then links, then
  // bold, then italic — each pass splits the remaining strings
  const out: ReactNode[] = [];
  const linkRe = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = linkRe.exec(text))) {
    if (m.index > last) out.push(...emphasis(text.slice(last, m.index), `${keyBase}-t${i}`));
    const [, bang, label, href] = m;
    if (bang) {
      // eslint-disable-next-line @next/next/no-img-element -- author-supplied URL, no next/image loader for it
      out.push(<img key={`${keyBase}-img${i}`} src={href} alt={label} loading="lazy" />);
    } else {
      out.push(
        <a key={`${keyBase}-l${i}`} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener">
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(...emphasis(text.slice(last), `${keyBase}-t${i}`));
  return out;
}

/** A block that is nothing but an image renders standalone, not inside a <p>. */
const LONE_IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function emphasis(text: string, keyBase: string): ReactNode[] {
  return text.split(/\*\*([^*]+)\*\*/g).map((seg, i) =>
    i % 2 === 1 ? (
      <b key={`${keyBase}-b${i}`}>{seg}</b>
    ) : (
      seg.split(/\*([^*]+)\*/g).map((s, j) => (j % 2 === 1 ? <i key={`${keyBase}-i${i}-${j}`}>{s}</i> : s))
    ),
  );
}

/** Heading anchor id: "Who qualifies for Non-Dom?" → "who-qualifies-for-non-dom". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*_`[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type MdHeading = { level: 2 | 3; text: string; id: string };

/** H2/H3 headings in document order — drives the contents list on long
 *  articles. Same splitting rules as the renderer, so ids always match. */
export function extractHeadings(text: string): MdHeading[] {
  const out: MdHeading[] = [];
  for (const block of text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const b = block.trim();
    if (b.startsWith("### ")) out.push({ level: 3, text: b.slice(4).trim(), id: headingId(b.slice(4)) });
    else if (b.startsWith("## ")) out.push({ level: 2, text: b.slice(3).trim(), id: headingId(b.slice(3)) });
    else if (b.startsWith("# ")) out.push({ level: 2, text: b.slice(2).trim(), id: headingId(b.slice(2)) });
  }
  return out;
}

/** "| a | b |" rows → cells; a separator row (|---|---|) is skipped. */
function tableRows(lines: string[]): string[][] | null {
  if (!lines.every((l) => l.trim().startsWith("|"))) return null;
  const rows = lines
    .map((l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));
  return rows.length ? rows : null;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        if (b.startsWith("### ")) return <h3 key={bi} id={headingId(b.slice(4))}>{inline(b.slice(4), `h${bi}`)}</h3>;
        if (b.startsWith("## ")) return <h2 key={bi} id={headingId(b.slice(3))}>{inline(b.slice(3), `h${bi}`)}</h2>;
        if (b.startsWith("# ")) return <h2 key={bi} id={headingId(b.slice(2))}>{inline(b.slice(2), `h${bi}`)}</h2>;
        const rows = tableRows(b.split("\n"));
        if (rows && rows.length > 1) {
          const [head, ...body] = rows;
          return (
            <div key={bi} className="article-table">
              <table>
                <thead><tr>{head.map((c, ci) => <th key={ci}>{inline(c, `t${bi}h${ci}`)}</th>)}</tr></thead>
                <tbody>
                  {body.map((r, ri) => (
                    <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `t${bi}r${ri}c${ci}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const lone = b.match(LONE_IMAGE);
        if (lone) {
          return (
            <figure key={bi} className="article-figure">
              {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied URL, no next/image loader for it */}
              <img src={lone[2]} alt={lone[1]} loading="lazy" />
              {lone[1] && <figcaption>{lone[1]}</figcaption>}
            </figure>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l.trim()))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.trim().slice(2), `u${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{inline(lines.join(" "), `p${bi}`)}</p>;
      })}
    </>
  );
}
