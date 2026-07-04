"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Scroll-in reveals + count-up stats for the marketing skin. Re-arms on every
 *  route change so client-side navigations animate like fresh loads. */
export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        el.textContent = el.dataset.count ?? "";
      });
      return;
    }

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

    const timers: ReturnType<typeof setInterval>[] = [];
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

    return () => {
      reveals.disconnect();
      counts.disconnect();
      timers.forEach(clearInterval);
    };
  }, [pathname]);

  return null;
}
