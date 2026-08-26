# Validation

Run the checks relevant to the area you changed before opening a pull request.

## C++ Core

```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

## Web

```bash
cd apps/web
npm install
npm run build
```

## Desktop

The desktop target is built from the root CMake project when Qt Widgets is available.

## Android

Use Android Studio or Gradle from `apps/android` when the Android SDK is available.

## iOS

Use Xcode once a project file or generator workflow has been selected.
