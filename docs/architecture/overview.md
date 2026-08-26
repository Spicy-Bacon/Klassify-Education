# Architecture Overview

AI School Platform is a modular school operations, communication, AI and media ecosystem organized around Connect, Manage and Capture.

## Client Direction

- Core: C++20 and CMake for shared high-performance client logic where native performance provides material value.
- Desktop: C++ and Qt for Windows and Linux media-heavy power workflows.
- Android: Native Kotlin by default, with Java only where platform requirements justify it.
- iOS: Native Swift by default, with Objective-C only where interoperability or platform requirements justify it.
- Web: TypeScript and React for administration, configuration and rapid iteration.

The long-term direction expects a meaningful amount of performance-sensitive cross-platform engine code to live in C++. This is not a current line-count target.

## Backend Boundary

The backend is intentionally open. This repository does not yet choose a cloud provider, database, API framework, authentication provider, object storage provider, AI vendor or deployment platform.

## Engineering Principles

1. Privacy and security are product requirements.
2. School tenants must ultimately be isolated.
3. Permissions must be consistent across platforms.
4. AI assists, drafts and summarizes; it does not silently make high-stakes decisions.
5. AI external communications require appropriate human review.
6. Common teacher mobile actions should eventually be completable quickly.
7. C++ should be used where native performance provides material value, not everywhere by default.
8. Mobile experiences should remain native.
9. Web should optimize for administration and rapid iteration.
10. Desktop should optimize for media-heavy power workflows.
11. Avoid premature infrastructure decisions.
12. Pilot evidence should determine roadmap expansion.
