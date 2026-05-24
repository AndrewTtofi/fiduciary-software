"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function CancelRequestClient({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function cancel() {
    if (!confirm("Cancel this request?")) return;
    start(async () => {
      const res = await fetch(`/api/admin/document-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "cancelled" }),
      });
      if (res.ok) router.refresh();
    });
  }
  return <button type="button" onClick={cancel} disabled={pending} className="text-[12px] underline">Cancel</button>;
}
