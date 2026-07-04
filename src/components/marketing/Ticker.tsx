// Market ticker strip (concept's Oceano-style top tape). Static, illustrative
// values — clearly labelled as a preview; swap for a live feed if the firm
// licenses one.
const ITEMS: [string, string, string, boolean][] = [
  ["EUR/USD", "1.0842", "+0.21%", true],
  ["GBP/EUR", "1.1712", "-0.08%", false],
  ["FTSE 100", "10,639.45", "+0.34%", true],
  ["DAX 40", "25,792.55", "+0.70%", true],
  ["GOLD", "2,948.10", "+0.52%", true],
  ["BRENT", "78.14", "-0.36%", false],
  ["BTC/USD", "96,420", "+1.12%", true],
  ["CY10Y", "3.02%", "+0.01", true],
];

export function Ticker() {
  const loop = [...ITEMS, ...ITEMS]; // duplicated so the -50% keyframe loops seamlessly
  return (
    <>
      <div className="ticker" aria-hidden>
        <div className="tk-in">
          {loop.map(([sym, px, chg, up], i) => (
            <span key={i}>
              <b>{sym}</b> {px} <em className={up ? "up" : "dn"}>{chg}</em>
            </span>
          ))}
        </div>
      </div>
      <div className="ticker-note">Market ticker — illustrative preview</div>
    </>
  );
}
