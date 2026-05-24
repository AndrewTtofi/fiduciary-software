"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function VerifyButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    start(async () => {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? "Failed to verify");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[12px] font-semibold px-3 py-1.5 rounded-inner bg-accent text-dark disabled:opacity-50"
    >
      {pending ? "Verifying…" : "Verify email"}
    </button>
  );
}
