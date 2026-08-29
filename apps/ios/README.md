# iOS Application

The iOS client is a native Swift foundation for future staff, parent and student experiences.

A generated Xcode project is intentionally deferred until the final app identifier, signing setup and project generation workflow are confirmed. The Swift files in `App/` document the intended app source and can be imported into an Xcode iOS app target.

Current scope:

- SwiftUI app entry point.
- Parent experience module inside the role-aware mobile foundation.
- Development-only parent session using fictional Demo School data.
- Parent Home with unread announcement count, outstanding form count, latest notices, forms and linked children.
- Announcements list and detail with read/unread state through a service boundary.
- Forms list and detail with development-only submission through a service boundary.
- Children list and detail for linked children only.
- Settings with profile, language preference options and development build indicator.
- Initial English and Traditional Chinese localization resource paths.

Deferred:

- Generated Xcode project and signing.
- Production authentication.
- Production API and persistence.
- Calendar, leave requests, messaging, media, AI and push notifications.
- Final commercial packaging decision between one role-aware app and separate role-specific apps.