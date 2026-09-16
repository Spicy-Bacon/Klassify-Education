# Announcements Architecture

Phase 3 introduces the first end-to-end Connect workflow for Klassify: targeted school announcements with drafting, publication, scheduling state and readership tracking.

## Domain

The shared contracts define:

- Announcement: school-owned message content, lifecycle state, author, audiences, recipient groups and optional attachment metadata.
- AnnouncementAudience: explicit targeting by school, year group, class or selected users using IDs rather than labels.
- AnnouncementRecipientGroup: parent_guardians, students and staff.
- AnnouncementRecipient: per-user delivery and read state.
- AnnouncementAttachment: metadata placeholder only. Production storage is intentionally deferred.

Statuses are intentionally small: draft, scheduled, published and archived.

## Audience Model

One announcement can target multiple audiences. The service resolves all audiences into unique recipients so a user linked through more than one class or target receives one delivery record.

Supported audience types:

- Whole school: targets the current school ID exactly.
- Year group: targets school-owned year group IDs.
- Class: targets school-owned class IDs.
- Selected users: targets users belonging to the same school.

Class and year group audience targets must be non-empty. Selected-user targets must also be non-empty. A school audience must target exactly the current school.

## Recipient Resolution

`AnnouncementAudienceResolver` converts audiences and recipient groups into user recipients by reading the identity graph:

- Class parent/guardian recipients are guardians linked to actively enrolled students.
- Class student recipients are active student users where a student platform user exists.
- Class staff recipients are staff users assigned to the class.
- Year group recipients are resolved through classes in that year group.
- Whole-school recipients are active users in the selected recipient groups.
- Selected users are filtered by selected recipient groups.

The resolver removes duplicate users before delivery records are created.

## Permissions

Announcement code uses the identity permission vocabulary:

- announcements.create
- announcements.publish

The UI is not the security boundary. `AnnouncementAccessPolicy` centrally enforces capability, school and resource scope.

Initial rules:

- School owner, principal and school admin may manage announcements in their own school.
- Teachers may create, edit, publish, schedule and cancel only announcements they authored that target assigned classes.
- Teachers cannot target whole school, unassigned classes or year groups in this phase.
- Parents, students and media operators cannot create or manage announcements by role alone.
- Cross-school targeting and management are rejected.

## Publishing

Publishing is structured as one coherent service operation:

1. validate announcement content;
2. validate actor capability and write scope;
3. validate audience targets;
4. resolve recipients;
5. reject zero-recipient delivery;
6. create unique delivery records;
7. mark the announcement published and set `publishedAt`.

Published and archived announcements are read-only in Phase 3. Correction/version history is deferred.

## Scheduling Boundary

Scheduling stores:

- `status = scheduled`
- `scheduledFor = ISO 8601 timestamp`

The service rejects invalid, current or past timestamps and also rejects schedules that resolve to zero recipients.

No production scheduler, background worker, queue, cloud provider or database has been selected. Actual scheduled delivery processing belongs to a later backend phase.

## Read Tracking

Readership is derived from `AnnouncementRecipient` records rather than stored read counts.

Normal admin detail returns aggregate-only readership:

- delivered;
- read;
- unread;
- read rate;
- recipient-group breakdown.

Individual recipient audit views are intentionally deferred for privacy and product review.

## Development Repository

`DevelopmentAnnouncementRepository` is an in-memory implementation behind `AnnouncementRepository`. It contains only fictional development notices and placeholder attachment metadata. It is replaceable by a future backend/API repository.

## Development Inbox

`/dev/inbox` is a development-only route guarded by `import.meta.env.DEV`. It allows developers to switch between fictional identities and inspect only announcements delivered to the selected identity through `AnnouncementService.getInbox`.

Opening an inbox announcement calls `markRead`, which persists `readAt` in the development repository. Draft and scheduled announcements do not appear in the inbox.

## Future Native Consumption

Native Parent, Staff and Student apps should consume the same announcement concepts through future platform APIs. This branch does not implement native apps, push notifications, email/SMS delivery, AI writing, translation, production authentication, production persistence or backend infrastructure.
