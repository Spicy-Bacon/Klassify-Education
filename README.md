# AI School Platform

AI School Platform is a modular school operations, communication, AI and media ecosystem.

Development status: **Pre-MVP / Foundation Stage**

Current active product area: **Identity & School Structure**

## Product

The product is organized around three pillars.

### Connect

Communication between schools, teachers, parents and students, including announcements, messaging, forms, calendars, translation and notifications.

### Manage

School administration and teacher workflow, including attendance, leave, events, approvals, documents, workflows and teacher productivity.

### Capture

Photography, private media and future high-performance media services, including private galleries, media management and future video or live-media workflows.

## Applications

| Path | Purpose |
| --- | --- |
| `apps/web` | React and TypeScript web foundation for administration and rapid iteration. |
| `apps/desktop` | C++ and Qt desktop foundation for media-heavy operator workflows. |
| `apps/android` | Kotlin Android foundation for future staff, parent and student experiences. |
| `apps/ios` | Swift iOS foundation and documented project structure. |
| `core` | Shared C++20 client core for performance-sensitive cross-platform logic. |
| `services` | Placeholder for backend decisions that are intentionally open. |
| `packages/contracts` | Placeholder for future platform-neutral contracts and shared concepts. |

## Identity & School Structure

The first real product feature establishes the school-owned identity foundation for schools, users, staff profiles, guardian profiles, students, year groups, classes, student enrolments, staff-class assignments, guardian-student links, roles and a small permission vocabulary.

The implementation is intentionally platform-neutral and development-only where persistence or authentication would otherwise be required. Production authentication, database and backend infrastructure choices remain deferred.

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

This repository currently provides only the platform foundation. It does not implement production business logic, payments, grading, LMS functionality, admissions, livestreaming, facial recognition, advanced video generation or cross-school analytics.

Backend provider, database, API framework, authentication, object storage, AI provider, deployment platform and service topology decisions are intentionally deferred.

## Build Quick Start

### C++ Core

```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

The desktop target is configured only when Qt Widgets is available.

### Web

```bash
cd apps/web
npm install
npm run lint
npm test
npm run build
```

### Android

Open `apps/android` with Android Studio or run a Gradle build from that directory when the Android SDK is available.

### iOS

See `apps/ios/README.md`. A full Xcode project is intentionally deferred until the app identifier, signing and project generation approach are confirmed.
