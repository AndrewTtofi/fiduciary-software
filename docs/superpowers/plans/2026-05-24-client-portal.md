# Client Portal v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `/app/*` portal so it works for converted Clients (in addition to its existing Prospect-stage support) per `docs/superpowers/specs/2026-05-24-client-portal-design.md`.

**Architecture:** Reuse the existing pages and shell; dispatch role-aware content inside each page. Add three new `/api/account/*` routes for self-service. New `client-portal.ts` service holds the orchestration helpers. No schema changes — all needed tables already exist.

**Tech Stack:** Next.js 15 App Router, Prisma + Postgres, Auth.js v5, Tailwind, Vitest. Same patterns as the two preceding sub-projects (KYC/AML, client page rewrite).

---

## Conventions used throughout

- **TDD** for the four service functions in `client-portal.ts` (each has deterministic Prisma + email interactions easy to mock).
- **Commits** after each passing test or coherent UI chunk. Conventional prefixes (`feat:`, `chore:`, `fix:`).
- **All file paths absolute from repo root.**
- **Existing patterns:**
  - Client-side route guard: `assertRole("prospect", "client", "staff", "partner")` from `src/lib/auth/guards.ts` (matches `/api/account/profile`)
  - Activity logging: `logActivity({ entityType, entityId, action, actorId, meta })`
  - Prisma client: `import { prisma } from '@/lib/db'`
  - Email provider: `import { email } from '@/lib/providers/email'` → `email().send({to, subject, html})`
- **Commit-message rule:** `git -c commit.gpgsign=false commit -m "..."` (signing disabled). NO Co-Authored-By line.

---

### Task 1: Extend ActivityAction union

**File:** Modify `src/lib/services/activity.ts`

- [ ] **Step 1:** Append `| "client.self_profile_updated"` to the `ActivityAction` union (preserve all existing entries).

- [ ] **Step 2: Type-check + test**

```bash
npm run typecheck
npm test
```

Both should pass (39 tests).

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/activity.ts
git -c commit.gpgsign=false commit -m "feat(activity): add client.self_profile_updated action"
```

---

### Task 2: `client-portal.ts` — messaging + unified read (TDD)

**Files:**
- Create: `src/lib/services/client-portal.ts`
- Create: `src/lib/services/__tests__/client-portal.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/services/__tests__/client-portal.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => {
  const messages: any[] = [];
  const userById = new Map<string, any>();
  const prospectByUserId = new Map<string, any>();
  const clientByUserId = new Map<string, any>();
  const docRequestById = new Map<string, any>();
  return {
    messages, userById, prospectByUserId, clientByUserId, docRequestById,
    reset() {
      messages.length = 0;
      userById.clear(); prospectByUserId.clear(); clientByUserId.clear(); docRequestById.clear();
    },
  };
});
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: async ({ where: { id } }: any) => db.userById.get(id) ?? null },
    prospect: {
      findUnique: async ({ where: { userId } }: any) => db.prospectByUserId.get(userId) ?? null,
    },
    client: {
      findUnique: async ({ where }: any) => {
        if (where.userId) return db.clientByUserId.get(where.userId) ?? null;
        return null;
      },
    },
    message: {
      create: async ({ data }: any) => {
        const m = { id: `m${db.messages.length + 1}`, ...data, createdAt: new Date() };
        db.messages.push(m);
        return m;
      },
      findMany: async ({ where }: any) => {
        return db.messages.filter((m) =>
          (where.OR ?? []).some((c: any) =>
            (c.prospectId !== undefined && c.prospectId === m.prospectId) ||
            (c.clientId   !== undefined && c.clientId   === m.clientId),
          ),
        );
      },
    },
    documentRequest: { findUnique: async ({ where: { id } }: any) => db.docRequestById.get(id) ?? null },
    activityLog: { create: async () => null },
  },
}));

const emailMock = vi.hoisted(() => ({ sent: [] as any[] }));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: async (args: any) => { emailMock.sent.push(args); return { ok: true }; } }),
}));

import { sendClientMessage, getMessagesForUser, updateClientSelfProfile } from "../client-portal";

beforeEach(() => { db.reset(); emailMock.sent.length = 0; });

describe("sendClientMessage", () => {
  it("writes Message.clientId when user is a Client; emails primaryStaff", async () => {
    db.userById.set("u1", { id: "u1", fullName: "Client User" });
    db.prospectByUserId.set("u1", { id: "p1", userId: "u1", reviewedById: null });
    db.clientByUserId.set("u1", { id: "c1", userId: "u1", primaryStaff: { email: "staff@x.com" } });
    await sendClientMessage("u1", "Hello");
    expect(db.messages[0].clientId).toBe("c1");
    expect(db.messages[0].prospectId).toBeUndefined();
    expect(emailMock.sent[0].to).toBe("staff@x.com");
  });
  it("writes Message.prospectId when user is still a Prospect; emails reviewer if any", async () => {
    db.userById.set("u2", { id: "u2", fullName: "Pending" });
    db.prospectByUserId.set("u2", { id: "p2", userId: "u2", reviewedBy: { email: "rev@x.com" } });
    await sendClientMessage("u2", "Hi");
    expect(db.messages[0].prospectId).toBe("p2");
    expect(db.messages[0].clientId).toBeUndefined();
    expect(emailMock.sent[0].to).toBe("rev@x.com");
  });
  it("throws on empty body", async () => {
    db.userById.set("u3", { id: "u3" });
    db.prospectByUserId.set("u3", { id: "p3", userId: "u3" });
    await expect(sendClientMessage("u3", "  ")).rejects.toThrow(/body/i);
  });
});

describe("getMessagesForUser", () => {
  it("returns messages tied to either prospect or client", async () => {
    db.userById.set("u4", { id: "u4" });
    db.prospectByUserId.set("u4", { id: "p4", userId: "u4" });
    db.clientByUserId.set("u4", { id: "c4", userId: "u4" });
    db.messages.push(
      { id: "m1", prospectId: "p4", body: "old prospect msg",  createdAt: new Date(1) },
      { id: "m2", clientId:   "c4", body: "new client msg",    createdAt: new Date(2) },
      { id: "m3", clientId:   "other", body: "other client",   createdAt: new Date(3) },
    );
    const out = await getMessagesForUser("u4");
    expect(out.map((m: any) => m.id).sort()).toEqual(["m1", "m2"]);
  });
});

describe("updateClientSelfProfile", () => {
  it("rejects fields not in whitelist", async () => {
    db.userById.set("u5", { id: "u5" });
    db.clientByUserId.set("u5", { id: "c5", userId: "u5" });
    await expect(
      updateClientSelfProfile("u5", { companyName: "x" } as any),
    ).rejects.toThrow(/unknown/i);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npx vitest run src/lib/services/__tests__/client-portal.test.ts
```

- [ ] **Step 3: Implement `client-portal.ts` (messaging + read + profile)**

`src/lib/services/client-portal.ts`:
```ts
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { email } from "@/lib/providers/email";

/** Read messages tied to the user across their lifecycle (prospect or client). */
export async function getMessagesForUser(userId: string) {
  const [prospect, client] = await Promise.all([
    prisma.prospect.findUnique({ where: { userId }, select: { id: true } }),
    prisma.client.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  const orClauses: { prospectId?: string; clientId?: string }[] = [];
  if (prospect) orClauses.push({ prospectId: prospect.id });
  if (client) orClauses.push({ clientId: client.id });
  if (orClauses.length === 0) return [];
  return prisma.message.findMany({
    where: { OR: orClauses },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, fullName: true, role: true } } },
  });
}

/** Client (or pre-conversion prospect) posts a message into the thread. */
export async function sendClientMessage(userId: string, body: string) {
  if (!body || body.trim().length === 0) throw new Error("Message body required");

  const client = await prisma.client.findUnique({
    where: { userId },
    include: { primaryStaff: { select: { email: true, fullName: true } } },
  });
  let prospect: { id: string; reviewedBy?: { email: string } | null } | null = null;
  if (!client) {
    prospect = await prisma.prospect.findUnique({
      where: { userId },
      include: { reviewedBy: { select: { email: true } } },
    });
    if (!prospect) throw new Error("No prospect or client for user");
  }

  const data: { senderId: string; body: string; clientId?: string; prospectId?: string } = {
    senderId: userId, body,
  };
  if (client) data.clientId = client.id;
  else data.prospectId = prospect!.id;

  const msg = await prisma.message.create({ data });

  const recipient = client?.primaryStaff?.email ?? prospect?.reviewedBy?.email ?? null;
  if (recipient) {
    try {
      await email().send({
        to: recipient,
        subject: "New message from client",
        html: `<p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>`,
      });
    } catch (e) {
      console.error("[sendClientMessage] email failed:", (e as Error).message);
    }
  }

  await logActivity({
    entityType: "message", entityId: msg.id,
    action: "message.sent", actorId: userId,
    meta: { side: "client", clientId: client?.id, prospectId: prospect?.id },
  });

  return msg;
}

export interface SelfProfilePatch {
  fullName?: string;
  phone?: string | null;
  languagePref?: "en" | "ru";
  address?: string | null;
  taxResidency?: string | null;
}

const ALLOWED_USER_FIELDS = new Set(["fullName", "phone", "languagePref"]);
const ALLOWED_CLIENT_FIELDS = new Set(["address", "taxResidency"]);
const ALLOWED_FIELDS = new Set([...ALLOWED_USER_FIELDS, ...ALLOWED_CLIENT_FIELDS]);

export async function updateClientSelfProfile(userId: string, patch: SelfProfilePatch) {
  for (const k of Object.keys(patch)) {
    if (!ALLOWED_FIELDS.has(k)) throw new Error(`Unknown field: ${k}`);
  }

  const userData: Record<string, unknown> = {};
  if (patch.fullName !== undefined) userData.fullName = patch.fullName;
  if (patch.phone !== undefined) userData.phone = patch.phone;
  if (patch.languagePref !== undefined) userData.languagePref = patch.languagePref;

  const clientData: Record<string, unknown> = {};
  if (patch.address !== undefined) clientData.address = patch.address;
  if (patch.taxResidency !== undefined) clientData.taxResidency = patch.taxResidency;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({ where: { id: userId }, data: userData });
    }
    if (Object.keys(clientData).length > 0) {
      const client = await tx.client.findUnique({ where: { userId }, select: { id: true } });
      if (client) {
        await tx.client.update({ where: { id: client.id }, data: clientData });
      }
      // If no client, silently skip — prospects don't have these fields.
    }
  });

  await logActivity({
    entityType: "user", entityId: userId,
    action: "client.self_profile_updated", actorId: userId,
    meta: { fieldsChanged: Object.keys(patch) },
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
```

- [ ] **Step 4: Run, confirm pass + commit**

```bash
npx vitest run src/lib/services/__tests__/client-portal.test.ts
git add src/lib/services/client-portal.ts src/lib/services/__tests__/client-portal.test.ts
git -c commit.gpgsign=false commit -m "feat(client-portal): messaging + unified read + self-profile services (TDD)"
```

---

### Task 3: `client-portal.ts` — `uploadClientDocument` (ownership-checked wrapper)

**Files:** Modify `src/lib/services/client-portal.ts` (append). Extend tests.

- [ ] **Step 1: Add the failing test (append to existing test file)**

In `src/lib/services/__tests__/client-portal.test.ts`, add at the bottom (before the closing braces of the last describe — or as a new top-level describe):

```ts
import { uploadClientDocument } from "../client-portal";

// We mock uploadDocument from documents.ts; the test only verifies
// uploadClientDocument's ownership check + correct args forwarding.
const uploadDocMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/documents", () => ({
  uploadDocument: uploadDocMock,
  MAX_BYTES: 10 * 1024 * 1024,
}));

describe("uploadClientDocument", () => {
  beforeEach(() => { uploadDocMock.mockReset(); });

  it("rejects fulfillment of a DocumentRequest not owned by the user's client", async () => {
    db.userById.set("u6", { id: "u6" });
    db.clientByUserId.set("u6", { id: "c6", userId: "u6", prospectId: "p6" });
    db.docRequestById.set("dr1", { id: "dr1", clientId: "other-client", serviceTypeKey: "company_formation" });
    await expect(
      uploadClientDocument("u6", {
        file: Buffer.from("x"), originalName: "x.pdf", mime: "application/pdf",
        fulfillsRequestId: "dr1",
      }),
    ).rejects.toThrow(/not yours/i);
    expect(uploadDocMock).not.toHaveBeenCalled();
  });

  it("forwards purpose=other + the request's serviceTypeKey on fulfillment", async () => {
    db.userById.set("u7", { id: "u7" });
    db.clientByUserId.set("u7", { id: "c7", userId: "u7", prospectId: "p7" });
    db.docRequestById.set("dr2", { id: "dr2", clientId: "c7", serviceTypeKey: "tax_residency" });
    uploadDocMock.mockResolvedValue({ ok: true, doc: { id: "d99" } });
    await uploadClientDocument("u7", {
      file: Buffer.from("x"), originalName: "x.pdf", mime: "application/pdf",
      fulfillsRequestId: "dr2",
    });
    expect(uploadDocMock).toHaveBeenCalledWith(expect.objectContaining({
      prospectId: "p7",
      userId: "u7",
      purpose: "other",
      type: "other",
      serviceTypeKey: "tax_residency",
      fulfillsRequestId: "dr2",
    }));
  });

  it("requires a Client when not provided a serviceTypeKey or request (still uploads as Correspondence)", async () => {
    db.userById.set("u8", { id: "u8" });
    db.clientByUserId.set("u8", { id: "c8", userId: "u8", prospectId: "p8" });
    uploadDocMock.mockResolvedValue({ ok: true, doc: { id: "d100" } });
    await uploadClientDocument("u8", {
      file: Buffer.from("x"), originalName: "y.pdf", mime: "application/pdf",
    });
    expect(uploadDocMock).toHaveBeenCalledWith(expect.objectContaining({
      prospectId: "p8",
      serviceTypeKey: null,
    }));
  });
});
```

- [ ] **Step 2: Confirm fail**

```bash
npx vitest run src/lib/services/__tests__/client-portal.test.ts
```

- [ ] **Step 3: Implement** (append to `src/lib/services/client-portal.ts`)

Add at the bottom of the file (above `escapeHtml`):

```ts
import { uploadDocument } from "@/lib/services/documents";

export interface ClientUploadArgs {
  file: Buffer;
  originalName: string;
  mime: string;
  serviceTypeKey?: string | null;
  fulfillsRequestId?: string | null;
}

export async function uploadClientDocument(userId: string, args: ClientUploadArgs) {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true, prospectId: true },
  });
  if (!client) throw new Error("No client for user");

  let serviceTypeKey: string | null = args.serviceTypeKey ?? null;
  if (args.fulfillsRequestId) {
    const req = await prisma.documentRequest.findUnique({
      where: { id: args.fulfillsRequestId },
      select: { clientId: true, serviceTypeKey: true, state: true },
    });
    if (!req) throw new Error("Request not found");
    if (req.clientId !== client.id) throw new Error("Request is not yours");
    // Inherit the request's serviceTypeKey if caller didn't override
    if (!args.serviceTypeKey) serviceTypeKey = req.serviceTypeKey;
  }

  return uploadDocument({
    prospectId: client.prospectId,
    userId,
    type: "other",
    purpose: "other",
    originalName: args.originalName,
    mime: args.mime,
    buffer: args.file,
    serviceTypeKey,
    fulfillsRequestId: args.fulfillsRequestId ?? null,
  });
}
```

- [ ] **Step 4: Run, confirm pass + commit**

```bash
npx vitest run src/lib/services/__tests__/client-portal.test.ts
git add src/lib/services/client-portal.ts src/lib/services/__tests__/client-portal.test.ts
git -c commit.gpgsign=false commit -m "feat(client-portal): add uploadClientDocument (ownership-checked)"
```

---

### Task 4: Extend `/api/account/profile` route

**File:** Modify `src/app/api/account/profile/route.ts`

- [ ] **Step 1: Read current contents**

```bash
cat src/app/api/account/profile/route.ts
```

- [ ] **Step 2: Replace contents**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { updateClientSelfProfile } from "@/lib/services/client-portal";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).nullable().optional(),
  languagePref: z.enum(["en", "ru"]).optional(),
  address: z.string().max(500).nullable().optional(),
  taxResidency: z.string().length(2).nullable().optional(),
}).strict();

export async function POST(req: Request) {
  const user = await assertRole("prospect", "client", "staff", "partner");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  try {
    await updateClientSelfProfile(user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/account/profile/route.ts
git -c commit.gpgsign=false commit -m "feat(api): extend /api/account/profile with address + taxResidency"
```

---

### Task 5: POST `/api/account/messages` route

**File:** Create `src/app/api/account/messages/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { sendClientMessage } from "@/lib/services/client-portal";

export const runtime = "nodejs";

const schema = z.object({ body: z.string().min(1).max(10000) });

export async function POST(req: Request) {
  const user = await assertRole("prospect", "client");
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  try {
    const msg = await sendClientMessage(user.id, body.data.body);
    return NextResponse.json({ ok: true, id: msg.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
printf "POST /api/account/messages -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost/api/account/messages" -H "Content-Type: application/json" -d '{"body":"x"}'
git add src/app/api/account/messages
git -c commit.gpgsign=false commit -m "feat(api): POST /api/account/messages"
```

---

### Task 6: POST `/api/account/documents` route

**File:** Create `src/app/api/account/documents/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { uploadClientDocument } from "@/lib/services/client-portal";
import { MAX_BYTES } from "@/lib/services/documents";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await assertRole("prospect", "client");

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form payload" }, { status: 400 });

  const file = form.get("file");
  const serviceTypeKey = form.get("serviceTypeKey")?.toString() || null;
  const fulfillsRequestId = form.get("fulfillsRequestId")?.toString() || null;

  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await uploadClientDocument(user.id, {
      file: buffer,
      originalName: file.name,
      mime: file.type || "application/octet-stream",
      serviceTypeKey,
      fulfillsRequestId,
    });
    if (!("ok" in result) || !result.ok) {
      return NextResponse.json({ error: ("reason" in result ? result.reason : "Upload failed") }, { status: 422 });
    }
    return NextResponse.json({ ok: true, documentId: result.doc.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
printf "POST /api/account/documents -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost/api/account/documents"
git add src/app/api/account/documents
git -c commit.gpgsign=false commit -m "feat(api): POST /api/account/documents (client upload with ownership check)"
```

---

### Task 7: Messages page — unified read + composer wiring

**Files:**
- Modify: `src/app/app/messages/page.tsx`
- Modify: `src/app/app/messages/MessageComposer.tsx`

- [ ] **Step 1: Read current files**

```bash
cat src/app/app/messages/page.tsx src/app/app/messages/MessageComposer.tsx
```

- [ ] **Step 2: Replace `page.tsx` to use unified read**

```tsx
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/client/ClientShell";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getMessagesForUser } from "@/lib/services/client-portal";
import { MessageComposer } from "./MessageComposer";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser();
  const [prospect, client, messages] = await Promise.all([
    prisma.prospect.findUnique({ where: { userId: user.id }, select: { id: true, status: true } }),
    prisma.client.findUnique({ where: { userId: user.id }, select: { id: true } }),
    getMessagesForUser(user.id),
  ]);
  if (!prospect && !client) redirect("/onboarding");

  const isApproved = (prospect?.status === "approved") || !!client;

  return (
    <ClientShell active="messages" approved={isApproved}>
      <div className="max-w-[800px]">
        <div className="mb-10">
          <p className="eyebrow mb-2">Messages</p>
          <h1 className="font-display text-3xl">Conversation with the ORO team</h1>
          <p className="text-muted mt-2 text-meta">
            We&apos;ll reach out here if we need anything else. You can also send us a note at any time.
          </p>
        </div>

        <div className="bg-[var(--client-surface)] border border-token rounded-card p-6 mb-6 flex flex-col gap-4">
          {messages.length === 0 && <p className="text-muted text-meta">No messages yet. Send the first one below.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.senderId === user.id ? "items-end" : "items-start"}`}>
              <div className="text-[11px] text-muted">
                {m.sender?.fullName ?? "ORO team"} · {new Date(m.createdAt).toLocaleString()}
              </div>
              <div className={`mt-1 rounded-card px-4 py-2 max-w-[70%] ${m.senderId === user.id ? "bg-accent text-dark" : "bg-[var(--client-bg)]"}`}>
                <p className="text-meta whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        <MessageComposer />
      </div>
    </ClientShell>
  );
}
```

- [ ] **Step 3: Replace `MessageComposer.tsx` to use new API**

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MessageComposer() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");

  function send() {
    if (!body.trim()) return;
    start(async () => {
      const res = await fetch(`/api/account/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) { setBody(""); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Send failed"); }
    });
  }

  return (
    <div className="bg-[var(--client-surface)] border border-token rounded-card p-4">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" rows={4} className="input w-full" />
      <div className="flex justify-end mt-3">
        <button type="button" onClick={send} disabled={pending || !body.trim()} className="btn btn-primary px-4 py-2 disabled:opacity-50">
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
```

NOTE: If `MessageComposer` is currently called as `<MessageComposer prospectId={...} />` (or with any prop), drop the prop at the call site too (already handled by the page rewrite above).

- [ ] **Step 4: Type-check + smoke + commit**

```bash
npm run typecheck
printf "GET /app/messages -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/app/messages"
git add 'src/app/app/messages/page.tsx' 'src/app/app/messages/MessageComposer.tsx'
git -c commit.gpgsign=false commit -m "feat(portal): unified messages read + new /api/account/messages composer"
```

---

### Task 8: Dashboard split (ClientDashboard for converted clients)

**Files:**
- Modify: `src/app/app/dashboard/page.tsx`
- Create: `src/app/app/dashboard/ClientDashboard.tsx`

- [ ] **Step 1: Read current `page.tsx`**

```bash
cat src/app/app/dashboard/page.tsx
```

- [ ] **Step 2: Create `ClientDashboard.tsx`**

`src/app/app/dashboard/ClientDashboard.tsx`:
```tsx
import Link from "next/link";

type Service = { id: string; serviceType: string; status: string };
type KeyDate = { id: string; description: string; dueDate: Date; status: string };
type DocReq  = { id: string; description: string; dueAt: Date | null };
type Activity = { id: string; action: string; createdAt: Date };

export function ClientDashboard({
  name, since, complianceStatus, riskRating,
  services, upcomingKeyDates, openRequests, unreadMessageCount,
  recentActivity, hasUpcomingBookingWithin14Days,
}: {
  name: string;
  since: Date;
  complianceStatus: "open" | "in_review" | "cleared" | "blocked" | null;
  riskRating: "low" | "standard" | "high" | null;
  services: Service[];
  upcomingKeyDates: KeyDate[];
  openRequests: DocReq[];
  unreadMessageCount: number;
  recentActivity: Activity[];
  hasUpcomingBookingWithin14Days: boolean;
}) {
  return (
    <>
      <div className="mb-10">
        <p className="eyebrow mb-2">Welcome back</p>
        <h1 className="font-display text-3xl">{name}</h1>
        <p className="text-muted mt-2 text-meta">
          Active client since {since.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        {complianceStatus && (
          <div className="mt-3 flex gap-2 items-center text-meta">
            <span className={`badge ${complianceStatus === "cleared" ? "badge-approved" : "badge-pending"} capitalize`}>
              {complianceStatus.replace("_", " ")}
            </span>
            {riskRating && (
              <span className="text-muted">risk: <span className="font-semibold capitalize">{riskRating}</span></span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-10">
        <Stat label="Active services" value={services.filter((s) => s.status !== "completed").length} />
        <Stat label="Upcoming dates (30d)" value={upcomingKeyDates.length} />
        <Stat label="Open requests" value={openRequests.length} />
        <Stat label="Messages from us (7d)" value={unreadMessageCount} />
      </div>

      {openRequests.length > 0 && (
        <Section title="ORO has requested">
          <ul className="flex flex-col gap-2">
            {openRequests.slice(0, 5).map((r) => (
              <li key={r.id} className="flex justify-between text-meta">
                <span>{r.description}</span>
                {r.dueAt && <span className="font-mono text-muted">due {new Date(r.dueAt).toLocaleDateString()}</span>}
              </li>
            ))}
          </ul>
          <Link href="/app/documents" className="text-meta underline mt-3 inline-block">Open documents →</Link>
        </Section>
      )}

      <Section title="Upcoming key dates">
        {upcomingKeyDates.length === 0
          ? <p className="text-muted text-meta">None in the next 30 days.</p>
          : <ul className="flex flex-col gap-2">{upcomingKeyDates.slice(0, 5).map((kd) => (
              <li key={kd.id} className="flex justify-between text-meta">
                <span>{kd.description}</span>
                <span className="font-mono text-muted">{new Date(kd.dueDate).toLocaleDateString()}</span>
              </li>
            ))}</ul>}
      </Section>

      {!hasUpcomingBookingWithin14Days && (
        <div className="mt-6 bg-[var(--client-surface)] border border-token rounded-card p-4 flex justify-between items-center">
          <span className="text-meta">Need to talk? Book a follow-up consultation.</span>
          <Link href="/app/booking" className="btn btn-primary px-4 py-2">Book</Link>
        </div>
      )}

      {recentActivity.length > 0 && (
        <Section title="Recent activity">
          <ul className="flex flex-col gap-2">{recentActivity.slice(0, 5).map((a) => (
            <li key={a.id} className="text-meta">
              <span className="font-mono text-[11px] text-muted mr-2">{new Date(a.createdAt).toLocaleDateString()}</span>
              {a.action.replace(/_/g, " ")}
            </li>
          ))}</ul>
        </Section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--client-surface)] border border-token rounded-elem p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 bg-[var(--client-surface)] border border-token rounded-card p-6">
      <h2 className="text-meta font-bold uppercase tracking-widest text-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Replace `page.tsx` to dispatch**

```tsx
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/client/ClientShell";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getProspectForUser } from "@/lib/services/client-view";
import { ClientDashboard } from "./ClientDashboard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { fullName: true } });
  const prospect = await getProspectForUser(user.id);
  if (!prospect) redirect("/onboarding");

  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    include: {
      services: true,
      keyDates: { where: { status: { in: ["upcoming", "overdue"] }, dueDate: { lte: in30days() } }, orderBy: { dueDate: "asc" } },
      documentRequests: { where: { state: "open" }, orderBy: { createdAt: "desc" } },
      complianceFile: { select: { status: true, riskRating: true } },
    },
  });

  if (!client) {
    // Existing prospect-stage dashboard — keep the rendering inline (copied from the prior page.tsx).
    return <LegacyProspectDashboard prospect={prospect} />;
  }

  const recentStaffMessages = await prisma.message.count({
    where: {
      clientId: client.id,
      sender: { role: "staff" },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const recentActivity = await prisma.activityLog.findMany({
    where: { OR: [{ entityType: "client", entityId: client.id }, { entityType: "prospect", entityId: prospect.id }] },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const next14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const hasUpcomingBooking = prospect.bookings.some(
    (b) => b.status === "confirmed" && b.startsAt >= new Date() && b.startsAt <= next14,
  );

  return (
    <ClientShell active="dashboard" approved={true}>
      <ClientDashboard
        name={dbUser?.fullName ?? "Client"}
        since={client.createdAt}
        complianceStatus={client.complianceFile?.status ?? null}
        riskRating={client.complianceFile?.riskRating ?? null}
        services={client.services.map((s) => ({ id: s.id, serviceType: s.serviceType, status: s.status }))}
        upcomingKeyDates={client.keyDates.map((kd) => ({ id: kd.id, description: kd.description, dueDate: kd.dueDate, status: kd.status }))}
        openRequests={client.documentRequests.map((r) => ({ id: r.id, description: r.description, dueAt: r.dueAt }))}
        unreadMessageCount={recentStaffMessages}
        recentActivity={recentActivity.map((a) => ({ id: a.id, action: a.action, createdAt: a.createdAt }))}
        hasUpcomingBookingWithin14Days={hasUpcomingBooking}
      />
    </ClientShell>
  );
}

function in30days() { return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); }

// Inline the existing prospect-dashboard rendering so we don't break it during the refactor.
// Take the JSX body from the original page.tsx (status badge + bookings + services-selected
// list + CTA) and place it here as a private component receiving `prospect`.
function LegacyProspectDashboard({ prospect }: { prospect: Awaited<ReturnType<typeof getProspectForUser>> }) {
  if (!prospect) return null;
  // PASTE the original page.tsx JSX here, slightly adapted to wrap in <ClientShell>.
  // The original is at HEAD~ src/app/app/dashboard/page.tsx — preserve it verbatim.
  return null; // placeholder to be filled with original JSX during implementation
}
```

- [ ] **Step 4: Preserve the original prospect-dashboard JSX in `LegacyProspectDashboard`**

Open the previous version of `src/app/app/dashboard/page.tsx` (via `git show HEAD:src/app/app/dashboard/page.tsx`) and copy the rendering JSX — the entire `return ( ... )` block including `<ClientShell active="dashboard" approved={isApproved}>` — into the `LegacyProspectDashboard` function above, adapting the variable names so it consumes `prospect` from props. Keep `services`, `statusBadge`, `upcomingBooking` calculations inline.

(You may also keep the legacy implementation as a side-by-side new file like `LegacyProspectDashboard.tsx` for cleanliness — but inline is fine.)

- [ ] **Step 5: Smoke + type-check + commit**

```bash
npm run typecheck
printf "GET /app/dashboard -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/app/dashboard"
git add 'src/app/app/dashboard'
git -c commit.gpgsign=false commit -m "feat(portal): role-aware dashboard (ClientDashboard for converted clients)"
```

---

### Task 9: Documents page rewrite (requests block + folder sections + arbitrary upload)

**Files:**
- Modify: `src/app/app/documents/page.tsx`
- Create: `src/app/app/documents/RequestsBlock.tsx`
- Create: `src/app/app/documents/ClientFolderBlock.tsx`
- Create: `src/app/app/documents/FulfillButton.tsx`
- Create: `src/app/app/documents/ArbitraryUploadModal.tsx`

- [ ] **Step 1: `FulfillButton`**

`src/app/app/documents/FulfillButton.tsx`:
```tsx
"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export function FulfillButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("fulfillsRequestId", requestId);
      const res = await fetch("/api/account/documents", { method: "POST", body: fd });
      if (res.ok) router.refresh();
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Upload failed"); }
      if (inputRef.current) inputRef.current.value = "";
    });
  }
  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onChange} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className="btn btn-primary px-3 py-1.5 text-meta">
        {pending ? "Uploading…" : "Upload"}
      </button>
    </>
  );
}
```

- [ ] **Step 2: `RequestsBlock`**

`src/app/app/documents/RequestsBlock.tsx`:
```tsx
import { FulfillButton } from "./FulfillButton";

export type ReqRow = { id: string; description: string; serviceTypeKey: string | null; dueAt: Date | null };

export function RequestsBlock({ requests }: { requests: ReqRow[] }) {
  if (requests.length === 0) return null;
  return (
    <section className="bg-[var(--client-surface)] border border-token rounded-card p-6 mb-6">
      <h2 className="text-meta font-bold uppercase tracking-widest text-muted mb-3">Requested by ORO</h2>
      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.id} className="flex justify-between items-center">
            <div>
              <div className="text-meta font-semibold">{r.description}</div>
              {r.dueAt && <div className="text-[11px] text-muted font-mono">due {new Date(r.dueAt).toLocaleDateString()}</div>}
            </div>
            <FulfillButton requestId={r.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `ClientFolderBlock`**

`src/app/app/documents/ClientFolderBlock.tsx`:
```tsx
import Link from "next/link";

export type ClientDocRow = {
  id: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  status: "received" | "under_review" | "approved" | "reupload_needed";
  uploadedAt: Date;
};

export function ClientFolderBlock({ id, label, documents }: { id: string; label: string; documents: ClientDocRow[] }) {
  return (
    <section id={id} className="bg-[var(--client-surface)] border border-token rounded-card p-6 mb-4 scroll-mt-24">
      <h3 className="font-display text-lg mb-3">{label} <span className="text-meta text-muted font-normal">({documents.length})</span></h3>
      {documents.length === 0 ? <p className="text-meta text-muted">No documents in this folder yet.</p> : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex justify-between items-center text-meta">
              <Link href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="underline">{d.originalName}</Link>
              <span className="text-[11px] text-muted">
                {(d.sizeBytes / 1024).toFixed(0)} KB · {new Date(d.uploadedAt).toLocaleDateString()} · {d.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: `ArbitraryUploadModal`**

`src/app/app/documents/ArbitraryUploadModal.tsx`:
```tsx
"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

export function ArbitraryUploadModal({ folders }: { folders: { key: string | null; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) { alert("Pick a file first."); return; }
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      if (folder) fd.append("serviceTypeKey", folder);
      const res = await fetch("/api/account/documents", { method: "POST", body: fd });
      if (res.ok) { setOpen(false); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Upload failed"); }
    });
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="btn btn-primary px-4 py-2">Upload a document</button>;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-[var(--client-surface)] p-6 rounded-card w-[420px] max-w-[90vw] flex flex-col gap-3">
        <h3 className="font-display text-xl">Upload a document</h3>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="input">
          <option value="">General correspondence</option>
          {folders.map((f) => f.key && <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="text-meta" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setOpen(false)} className="btn px-4 py-2">Cancel</button>
          <button type="button" onClick={submit} disabled={pending} className="btn btn-primary px-4 py-2">{pending ? "Uploading…" : "Upload"}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `page.tsx`**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientShell } from "@/components/client/ClientShell";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { bucketDocument, BUCKET_KYC, BUCKET_CORRESPONDENCE } from "@/lib/services/documents-bucket";
import { RequestsBlock, type ReqRow } from "./RequestsBlock";
import { ClientFolderBlock, type ClientDocRow } from "./ClientFolderBlock";
import { ArbitraryUploadModal } from "./ArbitraryUploadModal";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function MyDocumentsPage() {
  const user = await requireUser();
  const [prospect, client] = await Promise.all([
    prisma.prospect.findUnique({ where: { userId: user.id }, include: { documents: { orderBy: { uploadedAt: "desc" } } } }),
    prisma.client.findUnique({
      where: { userId: user.id },
      include: { services: true, documentRequests: { where: { state: "open" }, orderBy: { createdAt: "desc" } } },
    }),
  ]);
  if (!prospect) redirect("/onboarding");
  const isApproved = prospect.status === "approved" || !!client;

  // Build folder list
  const taxonomy = client ? await prisma.service.findMany({ where: { active: true }, select: { key: true, label: true }, orderBy: { sortOrder: "asc" } }) : [];
  const labelFor = (key: string) => {
    if (key === BUCKET_KYC) return "KYC Documents";
    if (key === BUCKET_CORRESPONDENCE) return "Correspondence";
    return taxonomy.find((t) => t.key === key)?.label ?? key;
  };
  const folderKeys = [BUCKET_KYC, ...(client?.services.map((s) => s.serviceType) ?? []), BUCKET_CORRESPONDENCE];

  const byFolder = new Map<string, ClientDocRow[]>();
  for (const d of prospect.documents) {
    const k = bucketDocument({ purpose: d.purpose, partyId: d.partyId, serviceTypeKey: d.serviceTypeKey });
    if (!byFolder.has(k)) byFolder.set(k, []);
    byFolder.get(k)!.push({
      id: d.id, originalName: d.originalName, mime: d.mime, sizeBytes: d.sizeBytes,
      status: d.status, uploadedAt: d.uploadedAt,
    });
  }

  const requests: ReqRow[] = (client?.documentRequests ?? []).map((r) => ({
    id: r.id, description: r.description, serviceTypeKey: r.serviceTypeKey, dueAt: r.dueAt,
  }));

  const arbitraryFolders = [
    { key: null, label: "General correspondence" },
    ...(client?.services.map((s) => ({ key: s.serviceType, label: taxonomy.find((t) => t.key === s.serviceType)?.label ?? s.serviceType })) ?? []),
  ];

  return (
    <ClientShell active="documents" approved={isApproved}>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-10">
        <div>
          <p className="eyebrow mb-2">Documents</p>
          <h1 className="font-display text-3xl">Your documents</h1>
          <p className="text-muted mt-2 text-meta">Encrypted at rest, accessible only to authorized ORO staff and assigned partners.</p>
        </div>
        {client && <ArbitraryUploadModal folders={arbitraryFolders} />}
      </div>

      {client && <RequestsBlock requests={requests} />}

      {client ? folderKeys.map((k) => (
        <ClientFolderBlock key={k} id={`docs-${slugify(labelFor(k))}`} label={labelFor(k)} documents={byFolder.get(k) ?? []} />
      )) : (
        <ClientFolderBlock id="docs-uploaded" label="Your uploaded files" documents={Array.from(byFolder.values()).flat()} />
      )}
    </ClientShell>
  );
}

function slugify(s: string) { return s.replace(/\s+/g, "-").toLowerCase(); }
```

- [ ] **Step 6: Smoke + commit**

```bash
npm run typecheck
printf "GET /app/documents -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/app/documents"
git add 'src/app/app/documents'
git -c commit.gpgsign=false commit -m "feat(portal): per-folder documents + request fulfillment + arbitrary upload"
```

---

### Task 10: Application page notice + ClientShell role badge

**Files:**
- Modify: `src/app/app/application/page.tsx`
- Modify: `src/components/client/ClientShell.tsx`

- [ ] **Step 1: Application notice**

Read `src/app/app/application/page.tsx`. At the top of the rendered content (just inside the outer `<ClientShell>` wrapper), insert when `isApproved` is true (which now also captures clients via the existing `isApproved` flag computed from prospect.status === "approved"):

```tsx
        <div className="mb-6 p-3 rounded-elem bg-[var(--client-bg)] text-meta text-muted">
          This is your original submission. For your current service status, see your <Link href="/app/dashboard" className="underline">Dashboard</Link>.
        </div>
```

(Make sure `import Link from "next/link"` is already present at the top of the file; add it if missing.)

- [ ] **Step 2: ClientShell role badge** (optional polish — small change)

Read `src/components/client/ClientShell.tsx`. Where the brand wordmark renders ("ORO CORPORATE"), add a small subtitle that displays the role when known. To keep the change minimal: don't add a new prop; just leave a placeholder. (If you want a real role badge later, take a `roleLabel?: string` prop and wire from the pages — but keep this task small.)

For v1, only the application-page notice is required from this task. Skip the badge if it would require threading a prop through every page.

- [ ] **Step 3: Commit**

```bash
git add 'src/app/app/application/page.tsx' 'src/components/client/ClientShell.tsx'
git -c commit.gpgsign=false commit -m "feat(portal): application page notice for converted clients"
```

---

### Task 11: SettingsForms — extend with Client fields

**File:** Modify `src/app/app/settings/SettingsForms.tsx` (and probably `src/app/app/settings/page.tsx` to pass new initial data).

- [ ] **Step 1: Read current files**

```bash
cat src/app/app/settings/page.tsx src/app/app/settings/SettingsForms.tsx
```

- [ ] **Step 2: Extend `page.tsx` to load Client fields**

In `src/app/app/settings/page.tsx`, fetch the user's Client (if any) and pass `address`, `taxResidency`, `companyName`, `registrationNumber`, `vatNumber`, `engagementLetterDate` as `clientFields` prop.

Concrete shape:

```tsx
const client = await prisma.client.findUnique({
  where: { userId: user.id },
  select: { address: true, taxResidency: true, companyName: true, registrationNumber: true, vatNumber: true, engagementLetterDate: true },
});

return (
  <ClientShell active="settings" approved={isApproved}>
    <div className="max-w-[680px]">
      <div className="mb-10">
        <p className="eyebrow mb-2">Settings</p>
        <h1 className="font-display text-3xl">Account preferences</h1>
      </div>
      <SettingsForms
        initial={{
          fullName: dbUser.fullName,
          phone: dbUser.phone ?? "",
          languagePref: dbUser.languagePref,
        }}
        clientFields={client ? {
          address: client.address,
          taxResidency: client.taxResidency,
          companyName: client.companyName,
          registrationNumber: client.registrationNumber,
          vatNumber: client.vatNumber,
          engagementLetterDate: client.engagementLetterDate?.toISOString() ?? null,
        } : null}
      />
    </div>
  </ClientShell>
);
```

- [ ] **Step 3: Extend `SettingsForms.tsx`**

Add an optional `clientFields` prop. The component should:
- Keep the existing User-field form (fullName, phone, languagePref) — submit goes to `POST /api/account/profile` unchanged.
- When `clientFields` is provided (user is a Client), add a second section with:
  - Editable `address` (textarea), `taxResidency` (2-char input)
  - Read-only display of `companyName`, `registrationNumber`, `vatNumber`, `engagementLetterDate` with a small tooltip/text "Contact your account manager to change."
  - Submit button sends ALL editable fields in one POST to `/api/account/profile` (the route now accepts both User + Client fields).

Concrete sketch of the extended component:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SettingsForms({ initial, clientFields }: {
  initial: { fullName: string; phone: string; languagePref: "en" | "ru" };
  clientFields: { address: string | null; taxResidency: string | null; companyName: string | null; registrationNumber: string | null; vatNumber: string | null; engagementLetterDate: string | null } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState({
    ...initial,
    address: clientFields?.address ?? "",
    taxResidency: clientFields?.taxResidency ?? "",
  });

  function save() {
    start(async () => {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: draft.fullName,
          phone: draft.phone || null,
          languagePref: draft.languagePref,
          ...(clientFields ? { address: draft.address || null, taxResidency: draft.taxResidency || null } : {}),
        }),
      });
      if (res.ok) router.refresh();
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Save failed"); }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-[var(--client-surface)] border border-token rounded-card p-6 flex flex-col gap-4">
        <h2 className="text-meta font-bold uppercase tracking-widest text-muted">Account</h2>
        <Field label="Full name"><input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className="input" /></Field>
        <Field label="Phone"><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="input" /></Field>
        <Field label="Language">
          <select value={draft.languagePref} onChange={(e) => setDraft({ ...draft, languagePref: e.target.value as "en" | "ru" })} className="input">
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </Field>
      </section>

      {clientFields && (
        <section className="bg-[var(--client-surface)] border border-token rounded-card p-6 flex flex-col gap-4">
          <h2 className="text-meta font-bold uppercase tracking-widest text-muted">Company</h2>
          <Field label="Registered address"><textarea value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} rows={2} className="input" /></Field>
          <Field label="Tax residency (ISO 2)"><input maxLength={2} value={draft.taxResidency} onChange={(e) => setDraft({ ...draft, taxResidency: e.target.value.toUpperCase() })} className="input" /></Field>
          <ReadOnly label="Company name" value={clientFields.companyName} />
          <ReadOnly label="Registration number" value={clientFields.registrationNumber} />
          <ReadOnly label="VAT number" value={clientFields.vatNumber} />
          <ReadOnly label="Engagement letter date" value={clientFields.engagementLetterDate ? new Date(clientFields.engagementLetterDate).toLocaleDateString("en-GB") : null} />
        </section>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary px-5 py-2.5 disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-muted font-semibold">{label}</span>
      {children}
    </label>
  );
}
function ReadOnly({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted">{label}</div>
      <div className="font-mono text-meta">{value ?? "—"}</div>
      <div className="text-[11px] text-muted">Contact your account manager to change.</div>
    </div>
  );
}
```

NOTE: if the existing SettingsForms passes additional initial state (e.g., the existing implementation may store separate `email`, etc.), preserve those bits.

- [ ] **Step 4: Type-check + smoke + commit**

```bash
npm run typecheck
printf "GET /app/settings -> HTTP "
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/app/settings"
git add 'src/app/app/settings'
git -c commit.gpgsign=false commit -m "feat(portal): settings form gains Company section for clients"
```

---

### Task 12: E2E smoke

**Files:** none.

- [ ] **Step 1: Restart web** so all changes pick up cleanly:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
until curl -fsS http://localhost/api/health > /dev/null 2>&1; do sleep 1; done && echo ready
```

- [ ] **Step 2: Sign in as a converted client.**

Either:
- Use an existing seeded client account (e.g., `dmitry@meridian.io` / `oroDemo!1` from the seed), OR
- As staff (`staff@oro.local`), convert an approved prospect first (`elena.p@limassol.cy`) via `/admin/clients` → ConvertModal.

- [ ] **Step 3: Verify the dashboard**

- `/app/dashboard` shows **ClientDashboard** (not ProspectDashboard) — stat cards present, compliance pill visible.

- [ ] **Step 4: Messages round-trip**

- Staff sends a message from `/admin/clients/<id>/messages` → log out → log in as that client → `/app/messages` → confirm the staff message is visible.
- Client posts a reply from the composer → log out → log in as staff → confirm the reply shows on the admin thread.

- [ ] **Step 5: Documents**

- As staff, create a DocumentRequest from `/admin/clients/<id>/request-docs`.
- As client, go to `/app/documents` — confirm "Requested by ORO" block shows the request.
- Click `Upload` on the request → pick a PDF → confirm the request disappears and the doc shows up in the matching folder.
- Click "Upload a document" → pick a folder → upload → confirm it appears in that folder.

- [ ] **Step 6: Settings**

- Edit address + taxResidency → Save → as staff, open `/admin/clients/<id>` and confirm the new values show in the header.

- [ ] **Step 7: Final checks**

```bash
npm test
npm run typecheck
```

Both should pass.

- [ ] **Step 8: Commit any fixups**

```bash
git status --short
# If anything: git add -A && git -c commit.gpgsign=false commit -m "chore(portal): post-smoke fixups"
```

---

## Self-review (executed by plan author)

**Spec coverage:**
- §3 Data model (no changes) → ✓
- §4.1 `getClientPortalContext` → not needed; pages do their own fetches (simpler). Removed.
- §4.2 `getMessagesForUser` → Task 2 ✓
- §4.3 `sendClientMessage` → Task 2 ✓
- §4.4 `uploadClientDocument` → Task 3 ✓
- §4.5 `updateClientSelfProfile` → Task 2 ✓
- §5 API surface (3 endpoints) → Tasks 4, 5, 6 ✓
- §6 UI per page (dashboard, application, messages, documents, booking, settings) → Tasks 7, 8, 9, 10, 11 ✓ (booking unchanged)
- §7 Lifecycle flows → exercised by smoke (Task 12)
- §8 Edge cases → enforced in service + API
- §9 Out of scope → respected

**Placeholder scan:**
- Task 8 Step 4 says "PASTE the original page.tsx JSX here" — that's an instruction, not a placeholder. The original JSX is in git history and unambiguous to copy.
- Task 10 Step 2 explicitly says "skip the badge for v1" — that's a scope decision, not a placeholder.

**Type consistency:**
- `ReqRow` (`src/app/app/documents/RequestsBlock.tsx`) and the inline request type in `page.tsx` (Task 9 Step 5) match.
- `ClientDocRow` shape consistent between `ClientFolderBlock.tsx` and `page.tsx`.
- `SelfProfilePatch` shape consistent between `client-portal.ts` and the API route schema.
- `getMessagesForUser` return shape (Message with `sender` selection) used in messages page.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-24-client-portal.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review per the workflow used for the prior two sub-projects.

**2. Inline Execution** — Execute tasks in this session using executing-plans.
