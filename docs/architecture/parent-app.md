# Parent App Architecture

Phase 4 introduces the first native parent/guardian experience for Klassify. This is a parent experience module inside the existing mobile foundations, not a final decision to ship a separate permanent Parent App binary.

## Product Purpose

The parent experience answers four questions:

- What do I need to know?
- Which child does this relate to?
- What has changed?
- What do I need to do next?

The initial scope is Parent Home, Children, Announcements, and Settings. Forms, calendar, leave requests, messaging, media, AI, payments, push notifications, production authentication, production API, and production persistence remain deferred.

## Shared Behaviour

Android and iOS use native models with matching product meaning:

- `ParentSession`: authenticated parent context with `userId`, `schoolId`, role, and development state.
- `ParentProfile`: display name, email, and school ownership only.
- `ChildSummary`: student identifier, display name, student number, year group, and class name.
- `ParentAnnouncement`: published notice content already authorised for the parent recipient.
- `LanguagePreference`: extensible language preference with English and Traditional Chinese as the initial options.

The mobile apps do not import TypeScript contracts directly. A future backend/API contract can become the canonical cross-platform contract once backend architecture is chosen.

## Parent Session

Production authentication is intentionally deferred. Development builds may initialise fictional parent data for Amy Wong at Demo School. Production builds must not silently log in as the development parent; they show an authentication-not-configured state until a real identity provider is selected.

## Linked Children

The parent service returns only children linked to the current parent identity. Development fixtures demonstrate one parent linked to multiple children, Chloe and Ethan. Unrelated students and cross-school students are excluded by repository/service boundaries.

## Announcement Consumption

Mobile clients consume announcements that are already resolved and delivered to the signed-in parent recipient. Admin audience resolution remains a server-side/platform concern for production. The future API boundary should provide the parent with already-authorised resources conceptually similar to:

- current user/session
- linked children
- parent announcements
- announcement detail
- mark announcement as read

No HTTP backend or permanent URL scheme is introduced in this phase.

## Read State

Read state belongs to the announcement recipient, not only to component state. The development repositories keep recipient read state in memory for this phase. Production persistence is deferred.

## Android Architecture

Android uses Kotlin, Jetpack Compose, and Material 3. The current package remains the development placeholder `com.klassify.education.dev` until final packaging is decided.

Key areas:

- `gradlew`, `gradlew.bat`, and `gradle/wrapper`: Gradle 8.11.1 wrapper for reproducible Android builds.
- `parent/model`: mobile-facing parent DTOs.
- `parent/data`: repository interfaces and development repository.
- `parent/service`: service boundary and development composition.
- `parent/ui`: Compose screens for Home, Announcements, Children, Settings, and shared state views.

## iOS Architecture

iOS uses Swift and SwiftUI source only. A generated Xcode project is still deferred because final bundle identifier and signing configuration are not decided.

Key areas:

- `Parent/Model`: mobile-facing parent DTOs.
- `Parent/Data`: repository interfaces and development repository.
- `Parent/Services`: parent service and development composition.
- `Parent/Views`: SwiftUI tabs and feature screens.
- `Resources`: initial localization resource paths.

## Navigation

Both native apps expose the same V1 information architecture:

- Home
- Announcements
- Children
- Settings

Android uses a bottom navigation bar backed by a small `ParentNavigationState` model. Selected child context, opened child detail, opened announcement detail, and selected tab are separate concepts so changing tabs does not leave stale detail screens active. iOS uses a `TabView` with `NavigationStack` detail navigation.

## Localization

The initial preference options are English and Traditional Chinese. Full screen translation is deferred, but resource paths and UI layout choices are prepared for longer Traditional Chinese strings such as æœ€æ–°æ¶ˆæ¯, æˆ‘çš„å­å¥³, and è¨­å®š.

## Privacy And Security

- No real school, student, or parent data is included.
- Fictional development emails use `example.test`.
- Parent access is scoped to linked children.
- Parent announcements are scoped to delivered recipient records.
- Cross-school development data is excluded.
- Development identity cannot silently become production identity.

## Future Modules

Forms/reply slips are the next product stage. Calendar, leave requests, messaging, media galleries, notifications, and AI should plug into the same parent session, linked-child, and authorised-resource boundaries.
