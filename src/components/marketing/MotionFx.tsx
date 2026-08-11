"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* Prototype-v2 motion layer for the marketing skin. One component drives:
   - entry reveals (auto-tagged .rv-init → .rv-in, plus legacy .reveal → .in)
   - count-up stats ([data-count])
   - word-by-word heading reveals (.mo-w)
   - ambient backgrounds: aurora + beams + sparkles on dark sections,
     drifting dots on light sections, lamp bloom behind centred headings
   - 3d tilt + cursor sheen on cards, magnetic pills (delegated handlers)
   - scroll-bound layer: progress hairline, vhero travel + transparent
     header, closing-wordmark slide, edge-rail rotation/ticks, knot draw
   Everything is skipped under prefers-reduced-motion; the page must read
   as a complete document with zero motion (the CSS enforces the same). */

const reduced = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** Torus-knot polyline points (the woven-emblem line drawing). */
function knotPath(cx: number, R: number, r: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rad = R + r * Math.cos(3 * t);
    pts.push(`${(cx + rad * Math.cos(2 * t)).toFixed(1)},${(cx + rad * Math.sin(2 * t) * 0.92).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

export function MotionFx({ edgeLeft, edgeRight }: { edgeLeft: string; edgeRight: string }) {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const edgeLRef = useRef<HTMLDivElement>(null);
  const edgeRRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".shell-marketing");
    if (!shell) return;
    const RM = reduced();
    const observers: IntersectionObserver[] = [];
    const timers: ReturnType<typeof setInterval>[] = [];

    /* ── legacy reveals + count-up (kept from the previous skin) ───── */
    if (!("IntersectionObserver" in window) || RM) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        el.textContent = el.dataset.count ?? "";
      });
    } else {
      const reveals = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              reveals.unobserve(en.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => reveals.observe(el));
      observers.push(reveals);

      const counts = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue;
            const el = en.target as HTMLElement;
            counts.unobserve(el);
            const target = parseInt(el.dataset.count ?? "0", 10);
            let cur = 0;
            const step = Math.max(1, Math.round(target / 40));
            const iv = setInterval(() => {
              cur += step;
              if (cur >= target) {
                cur = target;
                clearInterval(iv);
              }
              el.textContent = String(cur);
            }, 28);
            timers.push(iv);
          }
        },
        { threshold: 0.4 },
      );
      document.querySelectorAll("[data-count]").forEach((el) => counts.observe(el));
      observers.push(counts);
    }

    if (!RM && "IntersectionObserver" in window) {
      /* ── ambient backgrounds ─────────────────────────────────────── */
      shell.querySelectorAll<HTMLElement>("section, .phero, .final").forEach((s) => {
        if (s.querySelector(":scope > .mo-bg, :scope > .mo-dots")) return;
        const dark =
          s.classList.contains("strip") || s.classList.contains("final") || s.classList.contains("phero");
        if (dark) {
          const a = document.createElement("div");
          a.className = "mo-bg";
          s.prepend(a);
          const b = document.createElement("div");
          b.className = "mo-beams";
          s.prepend(b);
          s.classList.add("mo-aurora");
          for (let i = 0; i < 7; i++) {
            const sp = document.createElement("i");
            sp.className = "mo-spark";
            sp.style.left = `${8 + Math.random() * 84}%`;
            sp.style.top = `${20 + Math.random() * 70}%`;
            sp.style.animationDuration = `${(5 + Math.random() * 6).toFixed(1)}s`;
            sp.style.animationDelay = `${(Math.random() * 6).toFixed(1)}s`;
            s.prepend(sp);
          }
        } else if (s.classList.contains("sec") || s.classList.contains("sec-tight")) {
          const d = document.createElement("div");
          d.className = "mo-dots";
          s.prepend(d);
        }
      });

      /* lamp bloom behind centred section headings */
      shell.querySelectorAll(".sec .sec-center").forEach((c) => c.classList.add("mo-lamp"));

      /* ── word-by-word heading reveals ────────────────────────────── */
      shell.querySelectorAll<HTMLElement>("main h1, main h2").forEach((el) => {
        if (el.dataset.moW || el.closest(".vhero, .wm, .calc, .form-card, .sc-ring")) return;
        const walk = (n: Node) => {
          [...n.childNodes].forEach((c) => {
            if (c.nodeType === 3 && c.textContent?.trim()) {
              const frag = document.createDocumentFragment();
              c.textContent.split(/(\s+)/).forEach((w) => {
                if (!w.trim()) {
                  frag.appendChild(document.createTextNode(w));
                  return;
                }
                const s = document.createElement("span");
                s.className = "mo-w";
                s.textContent = w;
                frag.appendChild(s);
              });
              c.replaceWith(frag);
            } else if (c.nodeType === 1 && !(c as HTMLElement).classList.contains("mo-w")) {
              walk(c);
            }
          });
        };
        walk(el);
        el.dataset.moW = "1";
        el.querySelectorAll<HTMLElement>(".mo-w").forEach((w, i) => {
          w.style.transitionDelay = `${Math.min(i * 55, 700)}ms`;
        });
        const io = new IntersectionObserver(
          (es) =>
            es.forEach((x) => {
              if (x.isIntersecting) {
                x.target.classList.add("mo-on");
                io.disconnect();
              }
            }),
          { threshold: 0.25 },
        );
        io.observe(el);
        observers.push(io);
      });

      /* article headings grow their gold rule even when not word-split */
      shell.querySelectorAll(".article-body h2").forEach((el) => {
        const io = new IntersectionObserver(
          (es) =>
            es.forEach((x) => {
              if (x.isIntersecting) {
                x.target.classList.add("mo-on");
                io.disconnect();
              }
            }),
          { threshold: 0.3 },
        );
        io.observe(el);
        observers.push(io);
      });

      /* ── tilt cards + magnetic pills ─────────────────────────────── */
      shell
        .querySelectorAll(
          ".svc-card, .icard, .price-card, .stat, .feat, .fq4, .gcard, .step, .how-card, .belief-list li, .pcard",
        )
        .forEach((c) => {
          if (!c.closest(".sc-ring, .form-card")) c.classList.add("mo-tilt");
        });
      shell.querySelectorAll(".pill").forEach((b) => b.classList.add("mo-magnet"));

      /* ── generic entry reveals (tag, observe, reveal once, untag) ── */
      const sel =
        ".phero h1,.phero .sub,.sec-center h2,.sec-center .lead,.svc-card,.ins4-grid .icard,.stat,.price-card,.fq4," +
        ".step,.how-card,.faq4-head .l,.article-body p,.article-body h2,.article-body ul,.cta-box," +
        ".belief-list li,.feat,.wtc-grid > div,.hero-g > div";
      const els = [...shell.querySelectorAll<HTMLElement>(sel)].filter(
        (e) => !e.closest(".vhero, .form-card, .sc-ring") && !e.classList.contains("rv-init") && !e.classList.contains("reveal"),
      );
      const byParent = new Map<Element | null, number>();
      els.forEach((e) => {
        const n = byParent.get(e.parentElement) ?? 0;
        byParent.set(e.parentElement, n + 1);
        e.style.transitionDelay = `${Math.min(n * 70, 420)}ms`;
        e.classList.add("rv-init");
      });
      const rvIO = new IntersectionObserver(
        (es) =>
          es.forEach((x) => {
            if (!x.isIntersecting) return;
            const t = x.target as HTMLElement;
            t.classList.add("rv-in");
            rvIO.unobserve(t);
            setTimeout(() => {
              t.classList.remove("rv-init", "rv-in");
              t.style.transitionDelay = "";
            }, 1400);
          }),
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      els.forEach((e) => rvIO.observe(e));
      observers.push(rvIO);

      /* ── strip knot: draws itself on first entry ─────────────────── */
      const kd = document.getElementById("knotDraw");
      if (kd && !kd.dataset.done) {
        kd.dataset.done = "1";
        kd.innerHTML = `<path d="${knotPath(120, 62, 34, 520)}" fill="none" stroke="#C49E54" stroke-width="1.5" stroke-linecap="round"/>`;
        const path = kd.querySelector<SVGPathElement>("path")!;
        const L = path.getTotalLength();
        path.style.strokeDasharray = String(L);
        path.style.strokeDashoffset = String(L);
        const io = new IntersectionObserver(
          (es) =>
            es.forEach((x) => {
              if (x.isIntersecting) {
                path.style.transition = "stroke-dashoffset 2.2s cubic-bezier(.4,0,.2,1)";
                requestAnimationFrame(() => {
                  path.style.strokeDashoffset = "0";
                });
                io.disconnect();
              }
            }),
          { threshold: 0.3 },
        );
        io.observe(kd);
        observers.push(io);
      }
    }

    /* ── delegated pointer handlers (tilt + magnet) ──────────────────── */
    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const c = target?.closest?.(".mo-tilt") as HTMLElement | null;
      if (c) {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        c.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        c.classList.add("mo-live");
        c.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateY(-6px) scale(1.02)`;
      }
      const b = target?.closest?.(".mo-magnet") as HTMLElement | null;
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - (r.left + r.width / 2)) * 0.16).toFixed(1)}px,${((e.clientY - (r.top + r.height / 2)) * 0.28).toFixed(1)}px)`;
      }
    };
    const onOut = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const c = target?.closest?.(".mo-tilt") as HTMLElement | null;
      if (c && !c.contains(e.relatedTarget as Node)) {
        c.classList.remove("mo-live");
        c.style.transform = "";
      }
      const b = target?.closest?.(".mo-magnet") as HTMLElement | null;
      if (b && !b.contains(e.relatedTarget as Node)) b.style.transform = "";
    };
    if (!RM) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
    }

    /* ── scroll-bound layer ──────────────────────────────────────────── */
    const vhero = document.querySelector<HTMLElement>(".vhero");
    const vhIn = document.querySelector<HTMLElement>(".vhero .vh-in");
    const wmSection = document.querySelector<HTMLElement>(".final");
    const wm = document.querySelector<HTMLElement>(".final .wm");
    const ticks = [
      ...(edgeLRef.current?.querySelectorAll<HTMLElement>(".edge-ticks i") ?? []),
    ];
    const knots = [edgeLRef.current, edgeRRef.current]
      .map((el) => el?.querySelector<SVGSVGElement>(".edge-knot"))
      .filter(Boolean) as SVGSVGElement[];

    const onScroll = () => {
      const y = window.scrollY;
      /* transparent header over the vhero */
      shell.classList.toggle("on-hero", !!vhero && y < vhero.offsetHeight - 120);
      if (RM) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const q = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (barRef.current) barRef.current.style.width = `${(q * 100).toFixed(2)}%`;
      if (vhIn) {
        const k = Math.min(y, window.innerHeight);
        vhIn.style.transform = `translateY(${(k * 0.28).toFixed(1)}px)`;
        vhIn.style.opacity = Math.max(0, 1 - k / (window.innerHeight * 0.85)).toFixed(3);
      }
      knots.forEach((k, i) => {
        const dir = i ? -1 : 1;
        k.style.transform = `rotate(${(q * 300 * dir).toFixed(1)}deg) translateY(${(q * 80 * dir).toFixed(1)}px)`;
      });
      const lit = Math.round(q * ticks.length);
      ticks.forEach((t, i) => t.classList.toggle("on", i < lit));
      if (wm && wmSection) {
        const rc = wmSection.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (window.innerHeight - rc.top) / (window.innerHeight + rc.height * 0.6)));
        wm.style.transform = `translateY(${(0.38 - 0.2 * p).toFixed(3)}em)`;
        [...wm.children].forEach((s, i) => {
          (s as HTMLElement).style.transform = `translateX(${((i - 1) * (1 - p) * -3).toFixed(2)}vw)`;
        });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach(clearInterval);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      shell.classList.remove("on-hero");
    };
  }, [pathname]);

  const rep = (t: string) => `${t} · `.repeat(6);
  const kp = knotPath(29, 17, 9, 300);
  return (
    <>
      <div className="sfx-bar" ref={barRef} aria-hidden />
      <div className="edge l" ref={edgeLRef} aria-hidden>
        <div className="edge-txt">
          <span>{rep(edgeLeft)}</span>
          <span>{rep(edgeLeft)}</span>
        </div>
        <svg className="edge-knot" viewBox="0 0 58 58"><path d={kp} /></svg>
        <div className="edge-ticks">
          {Array.from({ length: 26 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="edge r" ref={edgeRRef} aria-hidden>
        <div className="edge-txt">
          <span>{rep(edgeRight)}</span>
          <span>{rep(edgeRight)}</span>
        </div>
        <svg className="edge-knot" viewBox="0 0 58 58"><path d={kp} /></svg>
      </div>
    </>
  );
}
