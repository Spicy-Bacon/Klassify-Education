# Validation

Run relevant checks before opening a pull request. The active surfaces and
deferred desktop decision are documented in
[ADR 0001](../architecture/decisions/0001-web-mobile-product-surfaces.md).
Old milestone records describe historical checks, not current setup commands.

## Web

Use Node 22.12+ on the 22.x line or another version satisfying the locked
package engines. From the repository root:

```bash
npm ci
npm run lint --workspace apps/web
npm test --workspace apps/web
npm run build --workspace apps/web
npm audit --omit=dev --audit-level=high
git diff --check origin/develop...HEAD
git diff --check origin/main...HEAD
```

The development baseline contains 112 Web tests. Investigate unexpected loss
of coverage. Do not upgrade dependencies merely to make cleanup validation pass.

## Android

Use Java 17 and the configured Android SDK. From `apps/android`:

```bash
./gradlew testDebugUnitTest --no-daemon
./gradlew assembleDebug --no-daemon
```

On Windows use `.\gradlew.bat` with the same tasks and flags. Set `JAVA_HOME`
to the Java 17 installation for the build process.

## iOS

A generated Xcode project/signing setup is still deferred. Where Swift is
available, the existing non-UI check runs from `apps/ios`:

```bash
swiftc -typecheck App/Parent/Model/ParentModels.swift App/Parent/Data/ParentRepositories.swift App/Parent/Data/DevelopmentParentRepository.swift App/Parent/Services/ParentAppService.swift
```

This validates only models, repositories and service sources. It does not
validate SwiftUI, Xcode project integration, signing, a simulator or a device.
Report missing toolchains rather than claiming checks ran.

## CI And Review

GitHub Actions keeps Web and Android jobs for pull requests and pushes to both
`develop` and `main`. The unused C++ job was removed with the scaffold.
Inspect YAML syntax and triggers when editing the workflow.

Review tracked sources for dangling build references, broken documentation
links, secrets, confidential originals and generated artifacts. Confirm final
CI against the actual pushed commit; pending is not passing. No screenshot
capture is part of the surface-removal milestone.
