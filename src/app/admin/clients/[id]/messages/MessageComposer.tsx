"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MessageComposer({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");

  function send() {
    if (!body.trim()) return;
    start(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Send failed");
      }
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">Compose</div>
        <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted">
          Visible to client
        </div>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKey}
        placeholder="Address the client. Be precise."
        rows={4}
        className="input w-full"
        style={{ borderColor: "transparent", background: "transparent", padding: "8px 0", fontSize: "15px", lineHeight: "1.6" }}
      />
      <hr className="hairline my-3" />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted">
          ⌘ + Enter to send
        </span>
        <button
          type="button"
          onClick={send}
          disabled={pending || !body.trim()}
          className="btn btn-primary disabled:opacity-40"
        >
          {pending ? "Sending…" : "Send →"}
        </button>
      </div>
    </div>
  );
}
