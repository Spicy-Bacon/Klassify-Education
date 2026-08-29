# Android Application

The Android client is a native Kotlin foundation for future staff, parent and student experiences.

The current namespace, `com.klassify.education.dev`, is a development placeholder and should be renamed once the final company and product identifier are confirmed.

Current scope:

- Kotlin and Jetpack Compose application foundation.
- Parent experience module inside the role-aware mobile foundation.
- Development-only parent session using fictional Demo School data.
- Parent Home with unread announcement count, latest notices and linked children.
- Announcements inbox and detail with read/unread state through a service boundary.
- Children list and detail for linked children only.
- Settings with profile, language preference options and development build indicator.
- Repository/service boundaries for future API replacement.
- Checked-in Gradle wrapper using Gradle 8.11.1.

Development commands:

```powershell
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebug
```

On Linux/macOS:

```bash
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

Notes:

- Primary navigation and common labels use Android string resources.
- Language preference is stored through `AppPreferenceRepository`; live app-locale switching is deferred.
- Child context selection, child detail navigation, and announcement detail navigation are separate state concepts.

Deferred:

- Production authentication.
- Production API and persistence.
- Forms, calendar, leave requests, messaging, media, AI and push notifications.
- Final commercial packaging decision between one role-aware app and separate role-specific apps.
