import type { PrismaClient, Role } from "@prisma/client";

let counter = 0;
const uniq = () => `${Date.now()}-${++counter}`;

export async function createUser(tx: PrismaClient, opts: { role?: Role; fullName?: string; email?: string } = {}) {
  return tx.user.create({
    data: {
      email: opts.email ?? `u-${uniq()}@test.local`,
      fullName: opts.fullName ?? "Test User",
      role: opts.role ?? "prospect",
      emailVerified: new Date(),
      passwordHash: "x",
    },
  });
}

export async function createProspect(tx: PrismaClient, opts: { userId?: string; status?: "pending" | "approved" | "needs_info" | "rejected" } = {}) {
  const userId = opts.userId ?? (await createUser(tx, { role: "prospect" })).id;
  return tx.prospect.create({
    data: {
      userId,
      referenceNumber: `ORO-TEST-${uniq()}`,
      status: opts.status ?? "approved",
      servicesSelected: [],
    },
  });
}

export async function createClient(tx: PrismaClient, opts: { userId?: string; prospectId?: string; primaryStaffId?: string } = {}) {
  const userId = opts.userId ?? (await createUser(tx, { role: "client" })).id;
  const prospectId = opts.prospectId ?? (await createProspect(tx, { userId })).id;
  const primaryStaffId = opts.primaryStaffId ?? (await createUser(tx, { role: "staff" })).id;
  return tx.client.create({
    data: { userId, prospectId, primaryStaffId },
  });
}

export async function createStaff(tx: PrismaClient) {
  return createUser(tx, { role: "staff" });
}
