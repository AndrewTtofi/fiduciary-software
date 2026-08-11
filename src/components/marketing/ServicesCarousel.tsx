"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Prototype-v2 services carousel: six cards on a 3D cylinder, autoplaying,
   arrow/dot controlled, with a flat card list on mobile. Geometry kept from
   the prototype: 400x500 cards, ring pushed back by the card radius so the
   front card rasterises 1:1. */

export type CarouselService = { key: string; title: string; blurb: string; icon: ReactNode };

const RADIUS = 380;
const AUTOPLAY_MS = 3800;

export function ServicesCarousel({ services }: { services: CarouselService[] }) {
  const router = useRouter();
  const n = services.length;
  const step = 360 / n;
  const [idx, setIdx] = useState(0);
  const [rot, setRot] = useState(0);
  const paused = useRef(false);

  // Cumulative rotation (never snapped back) so the ring always takes the
  // shortest way round and never visibly rewinds.
  const goTo = (t: number) => {
    let diff = t - idx;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    setIdx(((t % n) + n) % n);
    setRot((r) => r - diff * step);
  };

  useEffect(() => {
    const iv = setInterval(() => {
      if (!paused.current && !document.hidden) goTo(idx + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm around the current index
  }, [idx, n]);

  return (
    <div
      className="sc-wrap"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="sc-stage">
        <div className="sc-ring" style={{ transform: `translateZ(-${RADIUS}px) rotateY(${rot}deg)` }}>
          {services.map((s, i) => (
            <div className="sc-card" key={s.key} style={{ transform: `rotateY(${i * step}deg) translateZ(${RADIUS}px)` }}>
              <div
                className="sc-inner"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/services/${s.key}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/services/${s.key}`)}
              >
                <div className="sc-top">
                  <span className="sc-tag">0{i + 1}</span>
                  <span className="sc-ic">{s.icon}</span>
                </div>
                <div className="sc-body">
                  <h3>{s.title}</h3>
                  <p>{s.blurb}</p>
                  <span className="sc-cta">
                    Learn more{" "}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="sc-arrow l" onClick={() => goTo(idx - 1)} aria-label="Previous service">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="sc-arrow r" onClick={() => goTo(idx + 1)} aria-label="Next service">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className="sc-dots">
        {services.map((s, i) => (
          <button key={s.key} className={i === idx ? "on" : undefined} onClick={() => goTo(i)} aria-label={s.title} />
        ))}
      </div>
      <div className="sc-mobile">
        {services.map((s) => (
          <Link key={s.key} href={`/services/${s.key}`} className="svc-card">
            <div className="sic">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.blurb}</p>
            <span className="lm">
              Learn more{" "}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
