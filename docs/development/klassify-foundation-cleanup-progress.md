# Klassify Foundation Cleanup Progress

Branch: feature/klassify-foundation-cleanup

## Current Milestone
Foundation cleanup

## Completed
- [x] Documentation and roadmap cleanup
- [x] Customer-facing product name standardized to `Klassify`
- [x] TypeScript workspace/package rename
- [x] Android package rename
- [x] CMake project rename
- [x] Root `AGENTS.md` added with repository-level agent guidance
- [x] Repository-wide stale naming review
- [x] Full validation before final display-name/agent-guidance adjustments
- [ ] Pull Request

## Last Successful Validation
- `npm ci` passed with Node engine warnings because local Node is 22.11.0 and Vite requests 22.12.0 or newer.
- `npm run lint --workspace apps/web` passed.
- `npm test --workspace apps/web` passed: 112 tests.
- `npm run build --workspace apps/web` passed.
- `apps/android/.\gradlew.bat testDebugUnitTest` passed with Java 17.
- `apps/android/.\gradlew.bat assembleDebug` passed with Java 17.
- iOS non-UI Swift type-check passed for parent models, repositories and service.

## Known Issues
- CMake is not installed in the local Windows environment, so local C++ configure/build/test validation could not be run.
- Android compile still reports the existing deprecated `Icons.Filled.FactCheck` warning.
- npm reports existing engine warnings for Vite and @vitejs/plugin-react because the local temporary Node runtime is 22.11.0.
- The final display-name and `AGENTS.md` commit should be revalidated by CI before merge.

## Deferred By Design
- Do not implement Playwright screenshot capture or the screenshot-loop frontend redesign in this milestone.
- The screenshot-loop workflow is documented in `AGENTS.md` for the next frontend milestone only.

## Next Exact Action
Open a pull request into `develop`, run CI, review the final foundation diff, and stop before beginning the screenshot-loop frontend design milestone.

## Commits
- `refactor: align project identity with Klassify`
- Pending final commit: customer-facing `Klassify` display name and root `AGENTS.md` guidance.
