# Identity Model

Phase 1A establishes the platform-neutral domain foundation for school structure and scoped access. It does not choose production authentication, persistence, cloud infrastructure, API framework or deployment architecture.

## Entities

- `School`: tenant boundary with status and timestamps.
- `User`: login identity shared across platform surfaces. Authentication credentials are outside this model.
- `StaffProfile`: staff-specific profile data attached to a staff user.
- `GuardianProfile`: guardian-specific profile marker attached to a parent or guardian user.
- `Student`: school-owned learner record with optional link to a student platform user.
- `YearGroup`: school-specific year or form grouping.
- `Class`: school-specific class structure.
- `ClassEnrollment`: explicit student-class relationship that can support future history.
- `StaffClassAssignment`: explicit staff-class relationship for teacher scope.
- `GuardianStudentLink`: explicit parent or guardian relationship to one student.

## Relationship Diagram

```text
School
 |
 +-- User
 |   +-- StaffProfile
 |   +-- GuardianProfile
 |
 +-- Student
 |
 +-- YearGroup
 |
 +-- Class
     +-- ClassEnrollment ------ Student
     +-- StaffClassAssignment - StaffProfile

GuardianStudentLink
Parent / Guardian User -------- Student
```

## Roles

Initial roles are:

- `school_owner`
- `principal`
- `school_admin`
- `it_admin`
- `teacher`
- `staff`
- `parent_guardian`
- `student`
- `media_operator`
- `external_service`

Roles are not sufficient for access control on their own. Access decisions must also consider school, class relationships, student relationships and explicit permissions.

## School Isolation

Every school-owned entity carries `schoolId`. Relationship creation validates that both sides belong to the same school. The current automated tests reject:

- School A guardian linked to School B student.
- School A teacher assigned to School B class.
- School A student enrolled into School B class.

This is a domain invariant only. Persistence-level tenant isolation is intentionally deferred.

## Permission Concept

The permission vocabulary is intentionally small and module-oriented:

- `school.manage_users`
- `school.manage_settings`
- `users.view`
- `classes.view`
- `classes.manage`
- `students.view`
- `announcements.create`
- `announcements.publish`
- `forms.create`
- `attendance.manage`
- `media.upload`
- `media.manage`
- `media.publish`

The current permission function is deterministic and local. It is designed to be replaced later by a backend-backed policy decision point without changing UI components.

Initial access behavior:

- Principal and school owner can access school-wide identity records in their own school only.
- School admin can manage users and classes in their own school only.
- Teacher can access assigned classes and students enrolled in those classes.
- Parent or guardian can access linked children only.
- Student can access their own student identity/profile only.
- Media operator does not receive general student administrative access by role alone.

## Development Authentication Boundary

`AuthenticatedUserContext` represents the authenticated actor. It contains user ID, school ID, role, optional student ID and optional explicit permissions.

The web app includes a development-only identity switcher guarded by `import.meta.env.DEV`. It lets developers switch between mock users to test scoped access before production authentication is selected.

## Deferred

- Production authentication provider.
- Password storage and credential handling.
- Production database and persistence model.
- Backend API framework and service topology.
- Complete authorization system.
- Identity sync with external systems.
- Attendance, announcements, forms, messaging, media, AI and reporting domains.

## C++ Core Decision

Identity contracts currently live in `packages/contracts` as TypeScript platform-neutral definitions because this feature is primarily a data contract, service boundary and Admin Web prototype. No C++ identity logic was added because there is no performance-sensitive native identity behavior yet.

The C++ core remains available for shared native logic where native performance provides material value, such as future media, audio, video or high-performance client engine work.
