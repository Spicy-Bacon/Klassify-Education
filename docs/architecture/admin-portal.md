# Admin Portal Architecture

Phase 2 established the first extensible Klassify Education school administration workspace. Phase 3 extends it with Announcements while still deferring forms, attendance, messaging, media, AI, production authentication and production persistence.

## Purpose

The Admin Portal is the browser workspace for principals, school administrators, IT administrators and selected staff users. It is intended for configuration and review workflows that are too complex for mobile apps.

The guiding product boundary is:

```text
Complex configuration belongs on web.
Fast daily actions belong on mobile.
```

## Audience

- Principals and school owners.
- School administrators.
- IT administrators.
- Teachers with limited school-structure visibility.

Parent and student accounts are not treated as school administration users. In development mode they can be selected to prove access denial, but they should see a clear restricted state when opening `/admin`.

## Route Architecture

The web app uses `react-router-dom` for Admin Portal routes. The route shell is split from page implementation:

```text
apps/web/src/admin/
  AdminPortal.tsx
  AdminApp.tsx
  AdminLayout.tsx
  routes.tsx
  components/
  pages/
```

Current functional routes:

```text
/admin
/admin/users
/admin/students
/admin/students/:studentId
/admin/parents
/admin/parents/:guardianUserId
/admin/staff
/admin/classes
/admin/classes/:classId
/admin/announcements
/admin/announcements/:announcementId
/admin/announcements/new
/admin/announcements/:announcementId/edit
```

Future route extension points are listed but disabled for:

```text
Forms
Attendance
Events
Media
Analytics
Settings
```

These modules are deliberately not implemented in Phase 2.

## Role-Aware Navigation

Navigation is derived from `IdentityService.getVisibleAdminSections`.

- Principals, school owners, school administrators and IT administrators see the full current school-structure navigation.
- Teachers see a limited portal with Overview, Students and Classes.
- Parents and students are denied access to the Admin Portal.

Navigation visibility is not the security boundary. Direct route access is checked by `IdentityService.canAccessAdminSection`.

## Permission Boundary

The identity service remains the permission and scope boundary. Admin pages request scoped data through service methods such as:

- `getAdminOverview`
- `getVisibleUsers`
- `getVisibleStudents`
- `getStudentDetailById`
- `getVisibleGuardians`
- `getGuardianByUserId`
- `getVisibleStaff`
- `getVisibleClasses`
- `getClassById`

Admin UI components must not read unrestricted repository snapshots. Explicit permissions grant capabilities only; they do not bypass school, class or student resource scope.

## Current Pages

- Overview dashboard with scoped school-structure metrics and class summaries.
- Users list.
- Students list, filters and identity detail route.
- Parents / guardians list and linked-child detail route.
- Staff list and basic staff creation form.
- Classes list, filters and class detail route.

Creation workflows remain development/prototype quality and are backed by the in-memory development identity repository through the service interface.

## Reusable Shell Components

The Admin Portal uses small reusable components for:

- Sidebar navigation.
- Top bar and development identity switcher.
- Page headers.
- Tables.
- Status badges.
- Empty, loading, error and permission-denied states.
- Simple form and detail containers.

The styles define a modest set of local tokens for color, spacing, radius and surfaces. No broad design-system package has been introduced.

## Deferred

The following remain intentionally undecided or unimplemented:

- Production authentication provider.
- Production database or persistence model.
- Cloud provider.
- Backend API framework.
- Deployment platform.
- Object storage.
- AI model provider.
- Forms.
- Attendance.
- Events.
- Messaging.
- Media galleries.
- Analytics engine.
