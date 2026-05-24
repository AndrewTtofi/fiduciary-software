# 09 — Messaging

A single conversation thread per relationship. The thread is shared
between client (or prospect) and the staff team assigned to them.

## Data shape

A `Message` row has:

```
id, createdAt,
fromUserId,                          // sender
clientId | prospectId,               // which relationship
body (text),
attachmentIds (Document[])           // optional, multiple
readByUserIds (string[])             // who's read it
```

Either `clientId` or `prospectId` is set, never both. The pair tells the
service who can see the message.

## Visibility

`getMessagesForUser(user)` (in `src/lib/services/client-portal.ts` and
`messages.ts`) does the visibility filter:

- A **client** sees messages where `clientId` matches their `Client.id`.
- A **prospect** sees messages where `prospectId` matches their
  `Prospect.id`.
- **Staff** see every message attached to any client/prospect — the
  whole inbox.
- **Partners** see only messages for clients they're assigned to via
  `ClientService.assignedPartnerId`.

The same authoritative filter runs server-side regardless of which UI
surface called it.

## Sending

| Surface | Endpoint |
|---|---|
| Client portal `/app/messages` | `POST /api/account/messages` |
| Prospect onboarding | (uses the same endpoint — sender role decides target) |
| Admin client page `/admin/clients/[id]/messages` | `POST /api/admin/clients/[id]/messages` |
| Admin submission page | `POST /api/admin/submissions/[id]/messages` (via the same service) |

All four route handlers call `sendClientMessage()` or `sendStaffMessage()`
in `src/lib/services/messages.ts`. The service:

1. Validates the sender can post to that thread.
2. Creates the Message row.
3. Logs `message.sent`.
4. Emails the other party (if `OrgSettings.messageEmailEnabled`).
5. Returns the persisted row so the UI can append it without a refetch.

## Internal notes

Distinct from messages. `InternalNote` is staff-only — never visible to
the client or prospect. Used for handoff context ("Maria takes over next
week"), risk-discussion shorthand, or anything that should not leave the
firm.

Endpoint: `POST /api/admin/notes` with `{ entityType: "client" |
"prospect", entityId, body }`. Visible only to roles `staff` and
`partner` viewing the same entity.

## Unread counts

The dashboard widgets ("3 unread messages") compute the count as
`Message.readByUserIds NOT CONTAINS current_user_id` within the thread.
When a user opens the messages page, the service marks all returned
messages as read in a single batch update.

## Attachments

A message can carry one or more `Document` attachments. The UI:

1. Uploads each file first (`POST /api/documents/upload`).
2. Collects the returned document IDs.
3. Submits the message with `attachmentIds: [...]`.

Recipients can click any attachment to download it (subject to the
storage / encryption flow from [08 — Documents](./08-documents.md)).

## What this is NOT

- **Not real-time.** There's no WebSocket layer. The UI revalidates on
  navigation and on send. Polling could be added but isn't.
- **Not threaded.** One thread per relationship. No reply-to-message
  semantics.
- **Not WhatsApp.** Twilio + WhatsApp integration is scaffolded in the
  env but disabled by default. Turning it on would require provisioning a
  WhatsApp Business sender and adding a forward path in the message
  service.

## Editing / deleting

Currently **not supported**. Once sent, a message is permanent. This is a
deliberate restraint — turning fiduciary correspondence into something
the sender can quietly rewrite would undermine the audit value. Bucket
B of the v1 roadmap proposed adding an "edit within 5 min" window; this
hasn't shipped.
