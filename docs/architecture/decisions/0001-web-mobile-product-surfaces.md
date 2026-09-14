# ADR 0001: Web and Native Mobile Product Surfaces

Status: Accepted, user-approved.
Approval confirmed and recorded: 14 September 2026.
An earlier decision date has not been established.

## Context

Product Definition v0.1, dated 26 August 2026, proposed a C++/Qt desktop
client and shared performance engine. The removed implementation was only a
version-returning library, a single test and a display-only desktop shell.
Web, Android and iOS have no build or runtime dependency on that scaffold.
Keeping it implied an active commitment without demonstrated pilot demand.

## Decision

- Admin Web supports school administration.
- Native Staff Mobile supports fast daily staff workflows.
- Native Parent Mobile supports communication, tasks and multiple children.
- Student Mobile or responsive web supports notices, tasks and resources;
  pilot needs determine delivery priority and surface.
- Media administration, uploads, galleries, events, consent and
  selection/ordering start on web.

These are user experiences, not a decision to ship separate mobile binaries.
One role-aware app versus separate apps remains open.

Desktop is deferred. C++ is neither the default application engine nor the
default backend language. It may be reconsidered for measured
performance-critical workloads. No replacement backend language, framework,
provider or infrastructure is selected here.

This decision supersedes the provisional desktop/C++ technical direction
in Product Definition v0.1, including the suggested long-term engine share.
It does not change Connect, Manage or Capture, or the commercial entry
strategy of using photography relationships to introduce media and Connect.
Consequential AI output and external communications require appropriate
human review.

## Reconsideration

Revisit desktop when pilot evidence demonstrates a material need for
high-volume media ingest, offline upload queues, camera or Lightroom
integration, performance-intensive local processing, or live-event operations.
Record the workload, measured bottleneck, user benefit and maintenance cost
before selecting desktop technology or C++.

## Consequences

Remove the unused desktop app, root core library, CMake configuration and
C++ CI job. Keep the React/TypeScript, Kotlin and Swift foundations, shared
contracts, service boundaries and behaviour intact.

Existing modules remain development foundations. A first main merge is a
foundation checkpoint, not a completed MVP or production readiness claim.
See the [roadmap](../../product/mvp-roadmap.md) for pilot work, production
gates, open decisions and separate business validation.
