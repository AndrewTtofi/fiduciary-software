import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => {
  const messages: any[] = [];
  return {
    messages,
    reset() { messages.length = 0; },
  };
});
vi.mock("@/lib/db", () => ({
  prisma: {
    message: {
      create: async ({ data }: any) => {
        const row = { id: `m-${db.messages.length + 1}`, ...data, createdAt: new Date() };
        db.messages.push(row);
        return row;
      },
      findMany: async () => db.messages,
    },
    client: {
      findUnique: async () => ({ id: "c1", user: { email: "c@x.com", fullName: "Client" } }),
    },
    activityLog: { create: async () => null },
  },
}));

const emailMock = vi.hoisted(() => ({ sent: [] as any[] }));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({
    send: async (args: any) => { emailMock.sent.push(args); return { ok: true }; },
  }),
}));

// The portal switch decides whether the client is emailed at all.
const portal = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/services/settings", () => ({
  getClientLoginEnabled: async () => portal.on,
}));

vi.mock("@/lib/services/branding-server", () => ({
  getServerBranding: async () => ({
    brandName: "Acme", legalName: "Acme Ltd", referencePrefix: "ACME",
    contactEmail: null, jurisdiction: "Cyprus",
  }),
}));

import { sendMessage, listThread } from "../messages";

beforeEach(() => { db.reset(); emailMock.sent.length = 0; });

describe("sendMessage", () => {
  it("creates a Message row and fires an email", async () => {
    await sendMessage({ clientId: "c1", senderId: "s1", body: "Hello" });
    expect(db.messages).toHaveLength(1);
    expect(db.messages[0].body).toBe("Hello");
    expect(emailMock.sent).toHaveLength(1);
    expect(emailMock.sent[0].to).toBe("c@x.com");
  });
  it("listThread returns rows", async () => {
    await sendMessage({ clientId: "c1", senderId: "s1", body: "A" });
    await sendMessage({ clientId: "c1", senderId: "s1", body: "B" });
    expect(await listThread("c1")).toHaveLength(2);
  });
});

describe("sendMessage with the client portal switched off", () => {
  it("records the message but does not email the client", async () => {
    const { sendMessage } = await import("../messages");
    portal.on = false;
    emailMock.sent.length = 0;
    db.reset();

    await sendMessage({ clientId: "c1", senderId: "s1", body: "Internal note to self" });

    expect(db.messages).toHaveLength(1);        // still on the staff-side history
    expect(emailMock.sent).toHaveLength(0);     // nothing reached the client
    portal.on = true;
  });
});
