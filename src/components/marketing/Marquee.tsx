/* Infinite keyword marquee (prototype-v2). Pure CSS animation over a
   duplicated row, so it renders on the server with no client JS. */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="mo-marquee" aria-hidden>
      <div className="row">
        {row.map((t, i) => (
          <span className="it" key={i}>
            <b>◆</b>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
