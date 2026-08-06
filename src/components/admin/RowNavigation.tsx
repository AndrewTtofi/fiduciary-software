"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Makes `<tr data-href="...">` rows navigable.

   This replaces an inline `<script dangerouslySetInnerHTML>` that several
   admin pages used to attach click handlers. React never executes a script
   tag it renders on the client, so those handlers only ever ran on a full
   page load — every client-side navigation into the page left the rows dead.

   Listening on the document (rather than per row) means rows added by a later
   render are covered without re-wiring, and one listener serves the page. */
export function RowNavigation() {
  const router = useRouter();

  useEffect(() => {
    function hrefFor(target: EventTarget | null): string | null {
      if (!(target instanceof Element)) return null;
      // A real link or control inside the row owns its own click.
      if (target.closest("a, button, input, select, textarea, label")) return null;
      return target.closest("tr[data-href]")?.getAttribute("data-href") ?? null;
    }

    const onClick = (e: MouseEvent) => {
      // Let modified clicks fall through to the browser's own behaviour.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = hrefFor(e.target);
      if (href) router.push(href);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.defaultPrevented) return;
      const href = hrefFor(e.target);
      if (href) {
        e.preventDefault();
        router.push(href);
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return null;
}
