"use client";
import Link from "next/link";

export function QuickActions({ clientId }: { clientId: string }) {
  function scrollToKeyDates() {
    const el = document.querySelector('input[name="description"]') as HTMLInputElement | null;
    if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }
  return (
    <div>
      <div className="text-[12px] font-bold uppercase text-admin-muted tracking-widest mb-3">Quick Actions</div>
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/admin/clients/${clientId}/messages`} className="p-2 bg-admin-surface border border-admin-border rounded-inner text-[12px] font-semibold text-center hover:border-accent hover:text-accent">Send Message</Link>
        <Link href={`/admin/clients/${clientId}/request-docs`} className="p-2 bg-admin-surface border border-admin-border rounded-inner text-[12px] font-semibold text-center hover:border-accent hover:text-accent">Request Docs</Link>
        <a href="#services" className="p-2 bg-admin-surface border border-admin-border rounded-inner text-[12px] font-semibold text-center hover:border-accent hover:text-accent">Add Service ↑</a>
        <button type="button" onClick={scrollToKeyDates} className="p-2 bg-admin-surface border border-admin-border rounded-inner text-[12px] font-semibold text-center hover:border-accent hover:text-accent">Add Key Date ↑</button>
      </div>
    </div>
  );
}
