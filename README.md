# Klassify

Klassify is a modular school operations, communication, AI and media ecosystem.

Development status: **Pre-MVP / Foundation Stage**

Current milestone: **Product Surface Simplification / Documentation Alignment**

Upcoming product milestone: **Frontend Foundation / Design System** (not started).

The first merge into `main` will be a foundation checkpoint, not a completed MVP.

## Product

The product is organized around three pillars.

### Connect

Communication between schools, teachers, parents and students, including announcements, messaging, forms, calendars, translation and notifications.

### Manage

School administration and teacher workflow, including attendance, leave, events, approvals, documents, workflows and teacher productivity.

### Capture

Photography, web-based media upload, private galleries, event organisation,
consent and selections. Video and live-media functionality remain deferred.

The commercial entry strategy uses existing photography relationships to
introduce media and Connect to schools. Business validation is tracked
separately from engineering completion.

## Product Surfaces

Admin Web serves school administration; native Staff Mobile and Parent Mobile
serve daily workflows, communication and tasks. Student Mobile or responsive
web will follow pilot priorities. Media administration starts on web.
Separate mobile apps versus one role-aware app remains undecided.

Desktop is deferred until evidence supports high-volume ingest, offline queues,
camera/Lightroom integration, intensive local processing or live-event needs.
C++ is an optional future tool for measured performance workloads, not the
default engine or backend language. See [ADR 0001](docs/architecture/decisions/0001-web-mobile-product-surfaces.md).

## Applications

| Path | Purpose |
| --- | --- |
| `apps/web` | React and TypeScript web foundation for administration and rapid iteration. |
| `apps/android` | Kotlin Android foundation for future staff, parent and student experiences. |
| `apps/ios` | Swift iOS foundation and documented project structure. |
| `services` | Placeholder for backend decisions that are intentionally open. |
| `packages/contracts` | Platform-neutral contracts and shared concepts. |

## Completed Foundations

These are development implementations using fictional data and replaceable
repositories, not production-ready services.

- Identity and School Structure.
- Admin Portal Core.
- Announcements.
- Parent App V1.
- Forms / Digital Reply Slips.

## Identity & School Structure

The first real product feature establishes the school-owned identity foundation for schools, users, staff profiles, guardian profiles, students, year groups, classes, student enrolments, staff-class assignments, guardian-student links, roles and a small permission vocabulary.

The implementation is intentionally platform-neutral and development-only where persistence or authentication would otherwise be required. Production authentication, database and backend infrastructure choices remain deferred.

The web app consumes shared contracts through the npm workspace package `@klassify/contracts`.

## Branch Strategy

```text
main      Production/stable
develop   Active integration
feature/* Feature development
fix/*     Bug fixes
refactor/* Refactoring work
```

Normal feature development starts from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/<feature-name>
```

Open pull requests into `develop`. Do not merge feature branches directly into `main`.

## Current Scope

This repository provides identity and school structure, the Admin Portal core,
announcements, Parent App V1 and Forms / Digital Reply Slips as development
foundations. A form consent checkbox is not a complete Media Consent Centre;
recording a reminder request does not deliver a notification. Future media
selection/ordering does not authorise payment processing.

Payments, grading, full LMS functionality, admissions, livestreaming, facial
recognition, advanced video generation and cross-school analytics are deferred.

Backend provider, database, API framework, authentication, object storage, AI provider, deployment platform and service topology decisions are intentionally deferred.

## Build Quick Start

### Web

Use Node 22.12+ on the 22.x line or another version satisfying the locked
package engines. Install the existing lockfile without upgrading dependencies.

```bash
npm ci
npm run lint --workspace apps/web
npm test --workspace apps/web
npm run build --workspace apps/web
npm audit --omit=dev --audit-level=high
```

### Android

Open `apps/android` with Android Studio or run a Gradle build from that directory when the Android SDK is available.

### iOS

See `apps/ios/README.md`. A full Xcode project is intentionally deferred until the app identifier, signing and project generation approach are confirmed.

See [validation](docs/development/validation.md) for native commands and CI,
the [product source summary](docs/product/product-definition.md) for externally
maintained confidential sources, and the [roadmap](docs/product/mvp-roadmap.md)
for pilot areas, production gates and business validation.

## Parent App V1

Phase 4 adds the first native parent/guardian mobile experience in Android and iOS source foundations, covering linked children, announcements, read state, forms and settings without choosing production authentication or backend infrastructure.
