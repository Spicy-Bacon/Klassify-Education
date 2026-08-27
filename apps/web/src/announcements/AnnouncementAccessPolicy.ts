import {
  AnnouncementAudienceType,
  DomainErrorCode,
  EnrollmentStatus,
  Permission,
  RelationshipStatus,
  Role,
  type AnnouncementAudience,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
} from '@ai-school-platform/contracts';
import { isTeacherAssignedToClass } from '../identity/IdentityAccessPolicy';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { IdentityService } from '../identity/identityService';

const schoolWideAnnouncementRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
]);

export class AnnouncementAccessPolicy {
  constructor(private readonly identityService: IdentityService) {}

  canCreate(userContext: AuthenticatedUserContext, schoolId: EntityId): DomainResult<true> {
    return this.requireCapability(userContext, schoolId, Permission.AnnouncementsCreate);
  }

  canPublish(userContext: AuthenticatedUserContext, schoolId: EntityId): DomainResult<true> {
    return this.requireCapability(userContext, schoolId, Permission.AnnouncementsPublish);
  }

  canTargetAudiences(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    audiences: AnnouncementAudience[],
  ): DomainResult<true> {
    for (const audience of audiences) {
      const validation = this.canTargetAudience(snapshot, userContext, schoolId, audience);
      if (!validation.ok) {
        return validation;
      }
    }

    return { ok: true, value: true };
  }

  canViewAnnouncement(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    authorUserId: EntityId,
    audiences: AnnouncementAudience[],
  ): DomainResult<true> {
    if (userContext.schoolId !== schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school announcement access is not allowed.');
    }

    if (schoolWideAnnouncementRoles.has(userContext.role)) {
      return { ok: true, value: true };
    }

    if (userContext.role === Role.Teacher) {
      if (authorUserId === userContext.userId) {
        return { ok: true, value: true };
      }

      return audiences.some((audience) => (
        audience.type === AnnouncementAudienceType.Class
        && audience.targetIds.some((classId) => isTeacherAssignedToClass(snapshot, userContext.userId, classId))
      ))
        ? { ok: true, value: true }
        : failure(DomainErrorCode.PermissionDenied, 'Announcement is outside the teacher scope.');
    }

    return failure(DomainErrorCode.PermissionDenied, 'Announcement administration access is not allowed.');
  }

  private requireCapability(
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    permission: Permission,
  ): DomainResult<true> {
    const decision = this.identityService.can(userContext, permission, { schoolId });
    if (!decision.allowed) {
      return failure(DomainErrorCode.PermissionDenied, decision.reason ?? 'Announcement permission is not granted.');
    }

    return { ok: true, value: true };
  }

  private canTargetAudience(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    audience: AnnouncementAudience,
  ): DomainResult<true> {
    if (userContext.schoolId !== schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school announcement access is not allowed.');
    }

    if (schoolWideAnnouncementRoles.has(userContext.role)) {
      return validateAudienceTargetsBelongToSchool(snapshot, schoolId, audience);
    }

    if (userContext.role !== Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'This role cannot target school announcements.');
    }

    if (audience.type !== AnnouncementAudienceType.Class) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers may only target assigned classes in this phase.');
    }

    const targetValidation = validateAudienceTargetsBelongToSchool(snapshot, schoolId, audience);
    if (!targetValidation.ok) {
      return targetValidation;
    }

    const allAssigned = audience.targetIds.every((classId) => isTeacherAssignedToClass(snapshot, userContext.userId, classId));
    if (!allAssigned) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers may only target classes assigned to them.');
    }

    return { ok: true, value: true };
  }
}

export function validateAudienceTargetsBelongToSchool(
  snapshot: IdentitySnapshot,
  schoolId: EntityId,
  audience: AnnouncementAudience,
): DomainResult<true> {
  if (audience.type === AnnouncementAudienceType.School) {
    const valid = audience.targetIds.length === 1 && audience.targetIds[0] === schoolId;
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'School audience must target the announcement school.');
  }

  if (audience.type === AnnouncementAudienceType.YearGroup) {
    const valid = audience.targetIds.every((id) => snapshot.yearGroups.some((yearGroup) => yearGroup.id === id && yearGroup.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Year group audience targets must belong to the announcement school.');
  }

  if (audience.type === AnnouncementAudienceType.Class) {
    const valid = audience.targetIds.every((id) => snapshot.classes.some((schoolClass) => schoolClass.id === id && schoolClass.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Class audience targets must belong to the announcement school.');
  }

  const valid = audience.targetIds.every((id) => snapshot.users.some((user) => user.id === id && user.schoolId === schoolId));
  return valid
    ? { ok: true, value: true }
    : failure(DomainErrorCode.InvalidRelationship, 'Selected users must belong to the announcement school.');
}

function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}

export function getActiveStudentIdsForClass(snapshot: IdentitySnapshot, classId: EntityId): EntityId[] {
  return snapshot.classEnrollments
    .filter((enrollment) => enrollment.classId === classId && enrollment.status === EnrollmentStatus.Active)
    .map((enrollment) => enrollment.studentId);
}

export function getActiveGuardianIdsForStudent(snapshot: IdentitySnapshot, studentId: EntityId): EntityId[] {
  return snapshot.guardianStudentLinks
    .filter((link) => link.studentId === studentId && link.status === RelationshipStatus.Active)
    .map((link) => link.guardianUserId);
}
