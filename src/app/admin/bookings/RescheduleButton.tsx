"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/* Moving a consultation used to mean emailing the person and editing the
   database by hand — there was no reschedule and no cancel anywhere in the
   admin. The slot list comes from the same configured grid the public picker
   uses, so staff cannot put a call outside the firm's own hours. */
export function RescheduleButton({
  bookingId,
  currentStartsAt,
  timezone,
  slots,
}: {
  bookingId: string;
  currentStartsAt: string;
  timezone: string;
  /** Free slots on the configured grid, ISO strings. */
  slots: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: timezone });

  /* Cancelling tells the attendee, so it is confirmed rather than instant. */
  function cancelBooking() {
    if (!window.confirm("Cancel this consultation? The attendee is emailed to let them know.")) return;
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(j.error ?? "Could not cancel it."); return; }
      router.refresh();
    });
  }

  function submit() {
    if (!slot) { setError("Pick a new time first."); return; }
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUtc: slot, note: note.trim() || undefined }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(j.error ?? "Could not move it."); return; }
      setOpen(false);
      setSlot("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="row gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
          Reschedule
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--danger)" }}
          disabled={pending}
          onClick={cancelBooking}
        >
          Cancel
        </button>
      </div>

      {error && !open && <p className="help" style={{ color: "var(--danger)" }}>{error}</p>}

      {open && (
        <div className="scrim" onClick={() => !pending && setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Reschedule consultation">
            <div className="modal-head">
              <h3>Move this consultation</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="modal-body">
              <p className="muted mb-4" style={{ fontSize: "var(--fs-sm)" }}>
                Currently <strong>{fmt(currentStartsAt)}</strong> ({timezone.replace(/_/g, " ")}).
                The attendee is emailed a replacement calendar invite.
              </p>

              <label className="field">
                <span className="flabel">New time</span>
                <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)}>
                  <option value="">Choose a slot…</option>
                  {slots.map((s) => <option key={s} value={s}>{fmt(s)}</option>)}
                </select>
                {slots.length === 0 && (
                  <span className="help">
                    No free slots on the grid. Widen your hours under Bookings → Consultation hours.
                  </span>
                )}
              </label>

              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Note to the attendee (optional)</span>
                <textarea
                  className="textarea" rows={3} maxLength={500} value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Apologies — a conflict came up on our side."
                />
              </label>

              {error && <p className="note mt-4" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={pending || !slot}>
                {pending ? "Moving…" : "Move and notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
