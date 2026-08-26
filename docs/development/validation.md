# Validation

Run the checks relevant to the area you changed before opening a pull request.

## C++ Core

```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

## Web

From the repository root:

```bash
npm install
npm run lint --workspace apps/web
npm test --workspace apps/web
npm run build --workspace apps/web
```

Use `npm ci` instead of `npm install` in clean CI environments once `package-lock.json` is present.

GitHub Actions runs these checks for pull requests and pushes to `develop`.

## Desktop

The desktop target is built from the root CMake project when Qt Widgets is available.

## Android

Use Android Studio or Gradle from `apps/android` when the Android SDK is available.

## iOS

Use Xcode once a project file or generator workflow has been selected.

On non-macOS environments, document that iOS build validation was not performed.
