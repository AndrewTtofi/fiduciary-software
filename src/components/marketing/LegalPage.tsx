export type LegalSection = { h: string; p: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
  legalName,
  contactEmail,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  legalName: string;
  contactEmail: string | null;
}) {
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">Legal</span>
          <h1>{title}</h1>
          <p className="sub">Last updated {updated}</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <div className="note">
            <span>This is a template provided for the platform and is not legal advice. Review and adapt with qualified counsel before relying on it.</span>
          </div>

          <p className="body">{intro}</p>

          <div className="mt-8 flex flex-col gap-8">
            {sections.map((s, i) => (
              <section key={s.h}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 8 }}>
                  {i + 1}. {s.h}
                </h3>
                {s.p.map((para, j) => (
                  <p key={j} style={{ fontSize: "0.9375rem", lineHeight: 1.7, marginBottom: 8, color: "var(--mk-grey)" }}>{para}</p>
                ))}
              </section>
            ))}
          </div>

          <hr className="hr mt-10" />
          <p style={{ fontSize: "0.8125rem", color: "var(--mk-grey)" }}>
            Questions about this document? Contact {legalName}{contactEmail ? ` at ${contactEmail}` : ""}.
          </p>
        </div>
      </section>
    </main>
  );
}
