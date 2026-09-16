# Product Surface Simplification Progress

Branch: `refactor/simplify-product-surfaces`
Recorded: 14 September 2026.

## Completed Work

- Verified PR #7's exact head, complete diff, develop target, reviews,
  mergeability and passing CI run 18 before squash-merging it.
- PR #7 squash commit: `a5b8ce934cc0163ec6c92e2f9c5ffc64e606fb8d`.
  Post-merge develop CI run 19 passed Web, Android and the then-existing C++ job.
- Removed the unused `apps/desktop`, root `core`, root CMake configuration,
  C++ CI job and dedicated configuration/template entries. Web/native clients
  had no dependency on the scaffold; their sources and contracts are unchanged.
- Recorded [ADR 0001](../architecture/decisions/0001-web-mobile-product-surfaces.md):
  Admin Web, native staff/parent experiences, pilot-prioritised student delivery
  and web media. Mobile packaging and production providers stay open.
- Aligned agent, contributor, product, architecture and validation documentation.
  Older validation records are explicitly historical. The roadmap separates
  development foundations, pilot backlog, production gates and business validation.
- Preserved PR CI and Web/Android jobs; added main beside develop to push CI.

## Local Validation

- Node 24.16.0: `npm ci`, Web lint/TypeScript, all 112 tests and production build passed.
- `npm audit --omit=dev --audit-level=high`: zero production vulnerabilities.
- Java 17: Android unit-test and debug-assembly tasks passed using Gradle's
  up-to-date outputs; existing XML reports contain 18 tests, zero failures/errors.
- Swift 6.3.3: existing non-UI model/repository/service type-check passed.
- Working-tree diff checks against origin/develop and origin/main passed.
  Repeat the three-dot checks against the committed head before handoff.
- Reviewed workflow syntax/triggers and the complete diff. Local Markdown link
  targets resolve. Naming, dependency, secret-pattern and generated-artifact
  scans found no newly introduced defects or sensitive files.
- Remaining desktop/C++ mentions describe deferral, historical validation or
  browser viewports. `Desktop.ini` is an OS ignore; dependency names such as
  `@babel/core` are unrelated. Historical product filenames and internal
  identifiers do not change the customer-facing name, Klassify.

## Limitations and Owner Decisions

- Full dependency audit reports two moderate development-only Vitest/mocker
  advisories (GHSA-82fw-gwwq-j7x9). No dependencies were upgraded in this cleanup.
- Windows Swift type-checking does not validate SwiftUI, Xcode, signing or devices.
- No standalone YAML parser was available locally; workflow syntax/trigger review
  was manual. GitHub must validate and run the final pushed workflow.
- Read-only branch metadata reports main/develop unprotected with no required
  checks; the repository ruleset list is empty. Effective branch-rule endpoints
  were unavailable through the connector, so no broader protection claim is made.
  No mandatory C++ check mismatch was found in accessible settings.
- Recommend owner-managed PR/review requirements, passing Web and Android checks,
  and force-push/deletion restrictions for main/develop. No settings were changed.

## Handoff

Exact next action: review the `refactor: simplify Klassify product surfaces` PR
into develop and its final-head Web/Android results. The PR is the live source
for its URL and CI status; this pre-commit record does not assert future checks.
Do not merge it in this milestone. Main, release tags, deployment and frontend
implementation remain untouched. The screenshot-loop milestone is still deferred.
