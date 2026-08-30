# AGENTS.md

This file contains repository-level instructions for coding agents working on Klassify.

## Product identity

- The customer-facing product name is exactly **Klassify**.
- Do not display **Klassify Education** in user-facing application titles, headings, labels, or marketing copy.
- Existing technical identifiers may retain `education` where they are implementation details, including the repository name, Android package/application ID, CMake project identifier, and similar internal names. Do not rename those unless a milestone explicitly requires it.
- Product pillars are **Connect**, **Manage**, and **Capture**.
- AI should assist, draft, and summarise. It must not quietly make consequential school decisions.

## Git workflow

- `main` is production/stable.
- `develop` is the active integration branch.
- Create `feature/*`, `fix/*`, or `refactor/*` branches from the latest `develop`.
- Open feature pull requests into `develop`, not `main`.
- Prefer squash merge for feature pull requests.
- Do not merge, force-push, delete protected work, or modify `main` unless the task explicitly requires it.

## Milestone discipline

- Complete only the current milestone. Do not begin the next milestone automatically.
- Before starting, inspect branch status/history and any milestone progress file.
- Resume from the first incomplete checkpoint rather than restarting completed work.
- Keep changes coherent and bounded to the requested milestone.
- If interrupted, finish the smallest safe unit, run the relevant validation, commit/push it, record the exact next action, and stop.
- Do not report work as complete unless it is supported by code, tests, commits, or an explicitly stated environment limitation.

## Architecture

Preserve the current application boundary:

```text
UI
  -> Services
  -> Access Policies
  -> Repository Interfaces
  -> Development / Production Implementations
```

- Keep school/tenant isolation explicit.
- Preserve class/year scope, guardian-child relationship checks, consent/media visibility boundaries, and service-account restrictions where applicable.
- UI code must not bypass service or access-policy boundaries to read sensitive repository state directly.
- Do not broaden permissions merely to simplify a UI flow.
- Keep development fixtures and development-only persistence clearly separated from future production infrastructure.
- Do not choose a production backend, database, authentication provider, storage provider, AI provider, or deployment platform unless the milestone explicitly asks for that decision.

## Platform conventions

### Web

- React + TypeScript + Vite.
- Keep dependencies small and justified.
- Do not add a large UI framework, state-management framework, or CSS framework without a concrete need.
- Prefer reusable tokens and shared components over page-specific styling hacks.

### Android

- Kotlin + Jetpack Compose + Material 3.
- Use Java/JVM 17 for Gradle builds.
- Current compile/target SDK is API 35 unless a dedicated upgrade milestone changes it.
- Keep Android interactions native rather than forcing pixel-identical Web behaviour.

### iOS

- Swift + SwiftUI source foundation.
- Do not claim Xcode, simulator, signing, or full SwiftUI validation from a Windows-only environment.
- Keep iOS behaviour native while preserving Klassify's shared visual language and product rules.

### C++ / Desktop

- C++20 shared core.
- Qt desktop client remains a focused foundation for future media-heavy/operator workflows.
- Avoid broad C++ refactors during unrelated product milestones.

## Validation

Run the validation relevant to the files changed.

Web:

```bash
npm run lint --workspace apps/web
npm test --workspace apps/web
npm run build --workspace apps/web
```

Android:

```powershell
cd apps/android
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebug
```

C++ when CMake is available:

```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

For iOS on non-macOS environments, run only supported non-UI Swift type-checks and state the limitation accurately.

## Frontend visual-design workflow

The screenshot-loop frontend redesign is a separate milestone. Do not implement it unless the current task explicitly starts that milestone.

When that milestone is active:

- Start with the primary desktop viewport at `1440x1000`.
- Use `1280x800` as the secondary desktop viewport, `768x1024` for tablet, and `390x844` for mobile.
- Complete the primary viewport iteration first, then check the responsive targets later in the same milestone.
- Work on one visual target at a time.
- Use deterministic, fixed-size screenshots so iterations are comparable.
- Capture the current state before changing it.
- Inspect the rendered screenshot before editing code.
- Identify only the 3-5 highest-impact visual issues for an iteration.
- Implement one focused visual iteration while preserving functionality and architecture.
- Run relevant Web validation.
- Capture the same view at the same viewport after the change.
- Compare before and after, record what improved and what remains, then stop for human review.
- Preserve approved visual elements in later iterations rather than repeatedly redesigning them.
- Prefer changes to shared design tokens/components over one-off CSS fixes.
- Do not combine visual redesign with new product functionality.

Klassify's intended visual character is modern, calm, premium, efficient, and trustworthy. It should be suitable for schools without feeling childish, bureaucratic, or like a generic SaaS template.
