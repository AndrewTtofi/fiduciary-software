"use client";

import { useState, type ReactNode } from "react";

/* Guided questionnaire: one question per screen, a progress bar, back and
   restart. Shared by the permit and citizenship tools. Answers are keyed by
   question id; the caller turns them into a result. */

export type WizardQuestion = {
  id: string;
  title: string;
  help?: string;
  options: { value: string; label: string }[];
};

export function Wizard({
  questions,
  result,
  intro,
}: {
  questions: WizardQuestion[];
  /** Renders the result once every question is answered. */
  result: (answers: Record<string, string>) => ReactNode;
  intro?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = i >= questions.length;
  const q = questions[i];

  const pick = (v: string) => {
    setAnswers((a) => ({ ...a, [q.id]: v }));
    setI((n) => n + 1);
  };

  return (
    <div className="calc wiz">
      <div className="calc-body">
        <div className="fsteps" aria-hidden>
          {questions.map((_, k) => (
            <div key={k} className={`fs${k < i || done ? " on" : ""}`} />
          ))}
        </div>
        <div className="fstep-label">{done ? "Your result" : `Question ${i + 1} of ${questions.length}`}</div>
        {!done && intro && i === 0 && <p className="fine" style={{ marginBottom: 14 }}>{intro}</p>}
        {!done ? (
          <div key={q.id} className="mo-step">
            <h3 className="wiz-q">{q.title}</h3>
            {q.help && <p className="fine" style={{ marginBottom: 12 }}>{q.help}</p>}
            <div className="optlist one" role="radiogroup" aria-label={q.title}>
              {q.options.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={answers[q.id] === o.value} className={`optb${answers[q.id] === o.value ? " sel" : ""}`} onClick={() => pick(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div key="result" className="mo-step">{result(answers)}</div>
        )}
        <div className="fnav">
          {i > 0 ? (
            <button type="button" className="pill sm ghost" onClick={() => setI((n) => Math.max(0, n - 1))}>Back</button>
          ) : <span />}
          {done && (
            <button type="button" className="pill sm ghost" onClick={() => { setAnswers({}); setI(0); }}>Start again</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** A named route in a wizard result. */
export function RouteCard({
  title,
  lines,
  timeline,
  documents,
  secondary,
  children,
}: {
  title: string;
  lines: string[];
  timeline?: string;
  documents?: string[];
  /** A second route worth considering. */
  secondary?: string;
  children?: ReactNode;
}) {
  return (
    <div className="route-card">
      <span className="kicker" style={{ marginBottom: 6 }}>The route that usually applies here</span>
      <h3>{title}</h3>
      {lines.map((l, k) => <p key={k}>{l}</p>)}
      {timeline && <p><b>Usual timeline:</b> {timeline}</p>}
      {documents && documents.length > 0 && (
        <>
          <p><b>Documents typically required:</b></p>
          <ul>{documents.map((d, k) => <li key={k}>{d}</li>)}</ul>
        </>
      )}
      {secondary && <p className="route-alt"><b>Also worth considering:</b> {secondary}</p>}
      {children}
    </div>
  );
}
