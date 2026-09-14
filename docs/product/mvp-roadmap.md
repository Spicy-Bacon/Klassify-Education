# Product Roadmap

Klassify remains Pre-MVP / Foundation Stage. Engineering completion is distinct
from production readiness and commercial validation. Connect, Manage and
Capture remain the product pillars. The first main merge is a foundation
checkpoint, not a completed MVP.

## Completed Development Foundations

- Phase 1: Identity and school structure, relationships and scoped local rules.
- Phase 2: Admin Portal shell and school-structure administration.
- Phase 3: Announcements, audiences and development read tracking.
- Phase 4: Native parent experience with linked children and multi-child context.
- Phase 5: Forms / Digital Reply Slips and development submissions.
- Repository naming and release hygiene foundations.

These modules use fictional data and development repositories. They are not
production-ready services or evidence of a deployed school pilot.

## Upcoming Frontend Milestone

Frontend Foundation / Design System is the next product implementation
milestone after foundation review/release preparation. Its screenshot-loop
workflow is defined in [AGENTS.md](../../AGENTS.md) but has not started.
This documentation and surface cleanup does not implement it.

## Pilot Feature Backlog

Pilot evidence determines sequencing and acceptance criteria; this list does
not claim delivery or commit to a schedule.

| Pillar / area | Pilot scope and current boundary |
| --- | --- |
| Connect: notifications | Notification delivery and reminders. Recording a reminder request is not notification delivery. |
| Connect: calendar and messaging | Calendar/events and basic school-family messaging remain backlog. |
| Manage: staff workflows | Native staff actions, attendance and leave; current role/relationship models are foundations only. |
| Connect: parent experience | Communication, tasks, forms and multi-child support; validate the existing development flows with pilot families. |
| Student experience | Notices, homework/tasks and resources via mobile or responsive web; priority and surface depend on pilot needs. |
| Capture: web media | Media administration, upload, private galleries and event organisation start on web. |
| Capture: consent | Consent records, scope, withdrawal and controlled media access. A form consent checkbox is not a complete Media Consent Centre. |
| Capture: selections | Basic photo selection/ordering; this does not authorise payment processing. |
| AI assistance | Drafting, translation, summaries and authorised school-document Q&A, with permission checks and appropriate human review of consequential output. |
| Manage: reporting | Basic operational reporting; development counts do not constitute a production reporting service. |

Existing photography relationships provide the commercial entry for media
and Connect. They do not bypass school permissions, consent or human review.

## Production-Readiness Gates

Before real school use, demonstrate and review:

- Production authentication, session handling and account lifecycle.
- Server-enforced permissions and school/tenant isolation across every API and data path.
- Durable persistence and safe migrations; replace development repositories.
- Secure media access, consent enforcement and revocation.
- Audit records for access and consequential changes.
- Backup/recovery procedures and tested restoration.
- Authorised data export.
- Retention/deletion policies and verifiable deletion workflows.
- Departure removal: revoke leavers' access, sessions, relationships and media
  permissions; reconcile retained records with approved retention rules.
- Operational monitoring, support ownership and incident handling appropriate
  to the agreed pilot.

Providers and detailed implementation choices remain undecided. Local
permission tests and a successful build do not satisfy these gates.

## Deferred Functionality And Open Decisions

[ADR 0001](../architecture/decisions/0001-web-mobile-product-surfaces.md)
defers desktop until evidence supports high-volume ingest, offline upload
queues, camera/Lightroom integration, intensive local processing or live events.
C++ remains an option for measured performance-critical workloads, not the
default application engine or backend language.

Open decisions: separate mobile apps versus one role-aware app; student
delivery priority/surface; production backend/framework, database, authentication,
API gateway, storage, AI provider, hosting and service topology.

Deferred functionality: payments/accounting, grading/report cards, complex
timetable generation, full LMS, admissions, automatic student facial
recognition, livestreaming, advanced video generation, full student generative
AI, cross-school analytics and large integration frameworks.
Klassify should not become an eClass clone.

## Business Validation (Separate Track)

No completion is asserted for the following activities:

- School interviews and workflow evidence.
- Founding-school candidates.
- Written pilot intentions.
- Pricing and procurement feedback.
- Agreed pilot success criteria.

Track evidence and owners as it becomes available. These activities inform
product scope and pilot decisions; they are not prerequisites for this
code-only foundation merge.
