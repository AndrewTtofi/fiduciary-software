/* Services ticker, rebuilt as a static centred row: the scrolling version
   moved too quickly to read and clipped the first and last items at both
   edges (review, 4.4 / Services 1.5). Renders on the server, no JS. */
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="mo-ticker" aria-label="Our services">
      {items.map((t, i) => (
        <span className="it" key={i}>
          <b aria-hidden>◆</b>
          {t}
        </span>
      ))}
    </div>
  );
}
