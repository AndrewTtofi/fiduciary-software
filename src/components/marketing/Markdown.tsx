import type { ReactNode } from "react";

/* Minimal markdown renderer for Insights article bodies — headings, lists,
   bold/italic and links. Deliberately dependency-free: article authors are
   staff (trusted input), and everything renders through React elements so
   nothing is injected as raw HTML. */

function inline(text: string, keyBase: string): ReactNode[] {
  // links first, then bold, then italic — each pass splits the remaining strings
  const out: ReactNode[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = linkRe.exec(text))) {
    if (m.index > last) out.push(...emphasis(text.slice(last, m.index), `${keyBase}-t${i}`));
    out.push(
      <a key={`${keyBase}-l${i}`} href={m[2]} target={m[2].startsWith("http") ? "_blank" : undefined} rel="noopener">
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(...emphasis(text.slice(last), `${keyBase}-t${i}`));
  return out;
}

function emphasis(text: string, keyBase: string): ReactNode[] {
  return text.split(/\*\*([^*]+)\*\*/g).map((seg, i) =>
    i % 2 === 1 ? (
      <b key={`${keyBase}-b${i}`}>{seg}</b>
    ) : (
      seg.split(/\*([^*]+)\*/g).map((s, j) => (j % 2 === 1 ? <i key={`${keyBase}-i${i}-${j}`}>{s}</i> : s))
    ),
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        if (b.startsWith("### ")) return <h3 key={bi}>{inline(b.slice(4), `h${bi}`)}</h3>;
        if (b.startsWith("## ")) return <h2 key={bi}>{inline(b.slice(3), `h${bi}`)}</h2>;
        if (b.startsWith("# ")) return <h2 key={bi}>{inline(b.slice(2), `h${bi}`)}</h2>;
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
