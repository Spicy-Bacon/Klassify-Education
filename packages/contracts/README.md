# Platform Contracts

This package contains platform-neutral contracts shared across clients and future services.

Current identity and school structure concepts include:

- School
- User
- Role
- UserStatus
- Student
- StudentStatus
- ParentGuardian
- Staff
- StaffProfile
- GuardianProfile
- YearGroup
- Class
- ClassEnrollment
- GuardianStudentLink
- StaffClassAssignment
- Permission

The permission model will eventually need to consider:

- School tenant.
- User role.
- Class or year.
- Parent-child relationship.
- Explicit permission.
- Media consent.

Schemas are intentionally still lightweight. Production persistence, authentication credentials and full authorization infrastructure remain deferred.
