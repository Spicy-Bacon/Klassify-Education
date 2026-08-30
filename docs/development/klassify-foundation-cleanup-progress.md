# Klassify Foundation Cleanup Progress

Feature branch: `feature/klassify-foundation-cleanup`
Merged by: pull request 6
Squash-merge commit: `b48d6ac765b2e60cfa221fd42e60388731677b89`

## Current Milestone
Foundation cleanup - complete

## Completed
- [x] Documentation and roadmap cleanup
- [x] Customer-facing product name standardized to `Klassify`
- [x] TypeScript workspace/package rename
- [x] Android package rename
- [x] CMake project rename
- [x] Root `AGENTS.md` added with repository-level agent guidance
- [x] Repository-wide stale naming review
- [x] Final display-name and agent-guidance adjustments
- [x] Final branch validation
- [x] Pull request 6 squash-merged into `develop`

## Last Successful Validation
- `npm ci` passed with Node engine warnings because local Node is 22.11.0 and Vite requests 22.12.0 or newer.
- `npm run lint --workspace apps/web` passed.
- `npm test --workspace apps/web` passed: 112 tests.
- `npm run build --workspace apps/web` passed.
- `apps/android/.\gradlew.bat testDebugUnitTest --no-daemon` passed with Java 17.
- `apps/android/.\gradlew.bat assembleDebug --no-daemon` passed with Java 17.
- iOS non-UI Swift type-check passed for parent models, repositories and service.
- Final PR-head CI run 16 passed its Web, C++, and Android jobs for commit `2e994451a817da6a496917a2efbe29befa0f2abf`.
- Post-merge `develop` CI run 17 passed its Web, C++, and Android jobs for squash commit `b48d6ac765b2e60cfa221fd42e60388731677b89`.

## Known Issues
- CMake is not installed in the local Windows environment, so local C++ configure/build/test validation could not be run.
- Android source still uses the existing deprecated `Icons.Filled.FactCheck` symbol; replacement is outside this naming cleanup.
- npm reports existing engine warnings for Vite and @vitejs/plugin-react because the local temporary Node runtime is 22.11.0.

## Deferred By Design
- Do not implement Playwright screenshot capture or the screenshot-loop frontend redesign in this milestone.
- The screenshot-loop workflow is documented in `AGENTS.md` for the next frontend milestone only.

## Final Naming Scan
- `AGENTS.md` retains `Klassify Education` only in the rule that prohibits it as a customer-facing name.
- `docs/product/product-definition.md` retains the historical `AI_School_Platform_Product_Definition_v0.1.docx` filename.
- `klassify-education`, `KlassifyEducation`, `KlassifyEducationAndroid`, `klassify_education_desktop`, and `KlassifyEducationApp` remain only as repository, package, CMake, Gradle, executable, or Swift implementation identifiers.
- No remaining old-name occurrence is customer-facing.

## Next Exact Action
Prepare the first foundation release from `develop` to `main`.

## Commits
- `6a590f6` - `refactor: align project identity with Klassify`
- `e609c29` - `chore: standardize Klassify display name and agent guidance`
- `6c125b2` - `chore: complete Klassify foundation cleanup`
