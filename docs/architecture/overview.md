# Architecture Overview

Klassify is a modular school operations, communication, AI and media ecosystem organized around Connect, Manage and Capture.

## Client Direction

- Android: Native Kotlin by default, with Java only where platform requirements justify it.
- iOS: Native Swift by default, with Objective-C only where interoperability or platform requirements justify it.
- Web: TypeScript and React for administration, configuration and rapid iteration.

The active surfaces are Admin Web, native Staff Mobile, native Parent Mobile,
and Student Mobile or responsive web with pilot-dependent priority. Media
administration, upload, galleries, events, consent and selections start on web.
Separate mobile apps versus a single role-aware app remains an open decision.

[ADR 0001](decisions/0001-web-mobile-product-surfaces.md) supersedes the
provisional desktop/C++ engine direction in Product Definition v0.1. Desktop
is deferred pending evidence; C++ may serve measured performance workloads
in the future, but is not the default engine or backend language.

Shared definitions remain in `packages/contracts`; native clients retain
their model and service boundaries. The removed root core had no consumer
in Web, Android or iOS.

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
10. Media administration starts on web; reconsider desktop only for demonstrated operator needs.
11. Avoid premature infrastructure decisions.
12. Pilot evidence should determine roadmap expansion.

## Readiness

Current identity, Admin, announcement, parent and form modules are development
foundations. Production authentication, server-enforced access controls,
persistence and operational safety remain gates in the
[roadmap](../product/mvp-roadmap.md). A first main merge does not certify an MVP.
