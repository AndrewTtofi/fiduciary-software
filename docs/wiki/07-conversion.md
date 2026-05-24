# 07 — Converting a prospect to a client

This is the bridge between the sales/intake side of the platform and the
operational side. It's the single most important state transition in the
system.

## Pre-conditions

The Convert button on the submission detail page only enables when:

1. `Prospect.status === "approved"` — a staff member has explicitly
   approved the application.
2. `ComplianceFile.status === "cleared"` — the compliance subsystem has
   signed off.
3. `ComplianceFile.riskRating` is set (low / standard / high).

These conditions are enforced by `assertConvertible()` in
`src/lib/services/compliance/gate.ts`. The UI button is a hint; the
backend will reject a malformed request with `COMPLIANCE_NOT_CLEARED` or
`PROSPECT_NOT_APPROVED`.

## The conversion modal

Click **Convert to client** on `/admin/submissions/[ref]`. The modal asks
for:

- **Company name** — the legal name the firm will use on contracts.
  Required.
- **Initial services** — one or more `Service` rows. Pre-checked with the
  services the prospect originally requested.
- **Primary staff** — the account manager. Defaults to the current user.
- **Key dates** (optional) — initial deadlines like "incorporation
  certificate due", "first VAT return". Each one creates a `KeyDate` row.

## What `convertProspectToClient()` does

The service in `src/lib/services/clients.ts` wraps the whole thing in a
transaction:

```ts
await prisma.$transaction(async (tx) => {
  await assertConvertible(prospect);                  // gate
  await tx.user.update({ where: { id: userId }, data: { role: "client" } });
  const client = await tx.client.create({ data: { ... } });
  for (const svc of selectedServices) {
    await tx.clientService.create({ data: { clientId, serviceTypeKey, status: "pending" } });
  }
  for (const kd of keyDates) {
    await tx.keyDate.create({ data: { clientId, dueDate, status: "upcoming" } });
  }
  await logActivity({ entityType: "client", entityId: client.id, action: "client.created", actorId, meta: { fromProspectId } });
});
```

Important guarantees:

- **User upgrade is atomic with Client creation.** If any step fails, the
  user stays a prospect.
- **ComplianceFile is re-linked, not duplicated.** The file's `prospectId`
  is cleared and `clientId` is set — the audit trail follows the human.
- **Activity is logged** so subsequent pages can show "Converted on
  YYYY-MM-DD by Eleni Christodoulou".
- **The prospect can no longer log in to /onboarding** — their role is
  `client`. The next request bounces them to `/app`.

## Side effects after conversion

- The original Prospect row is **kept**, not deleted. It stays linked to
  the User so historical context (original wizard answers, initial
  documents) survives.
- All Documents the prospect uploaded transfer ownership to the Client
  implicitly via the User → Client relation.
- The compliance file remains intact and accessible from
  `/admin/clients/[id]/compliance` (same dashboard, just routed under
  /clients now).

## Rolling back a conversion

There is **no UI** for reversing a conversion. If the firm needs to undo
one (very rare; usually the right answer is to put the client on
`on_hold` instead), it requires a manual SQL operation. The reason: an
undo would have to decide what to do with services already started,
messages already sent, and bookings already taken — the system doesn't
encode those choices.

## Failure modes

| HTTP error | Meaning |
|---|---|
| 403 `FORBIDDEN` | Caller isn't `staff` |
| 422 `PROSPECT_NOT_APPROVED` | Status isn't `approved` |
| 422 `COMPLIANCE_NOT_CLEARED` | File status isn't `cleared` |
| 422 `RISK_UNSET` | `riskRating` is null |
| 409 `ALREADY_CONVERTED` | The prospect already has a Client row |
| 500 | Unexpected — transaction rolled back, nothing changed |

## Tests

The conversion service is covered by:

- `src/lib/services/__tests__/conversion-gate.test.ts` — the gate logic
- `src/app/api/admin/clients/convert/__tests__/route.test.ts` — the route
- `e2e/convert-to-client.spec.ts` — end-to-end Playwright spec that walks
  the full flow

## What changes for the user

Before conversion, signing in lands them on `/onboarding`. After
conversion, the same user signing in lands on `/app` — see
[12 — Client portal](./12-client-portal.md).
