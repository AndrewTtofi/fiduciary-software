import { vi } from "vitest";

export type TestUser = {
  id: string;
  email: string;
  fullName: string;
  role: "prospect" | "client" | "staff" | "partner";
};

/**
 * Stubs @/lib/auth's `auth()` to return a session for the duration of the test.
 * Must be called BEFORE any module that imports auth() is loaded.
 */
export function mockSession(user: TestUser | null) {
  vi.doMock("@/lib/auth", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/auth")>();
    return {
      ...actual,
      auth: async () => (user ? { user } : null),
    };
  });
}

export function resetAuth() {
  vi.doUnmock("@/lib/auth");
}
