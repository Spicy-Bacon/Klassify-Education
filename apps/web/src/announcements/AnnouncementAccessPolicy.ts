import {
  AnnouncementAudienceType,
  AnnouncementStatus,
  DomainErrorCode,
  EnrollmentStatus,
  Permission,
  RelationshipStatus,
  Role,
  type Announcement,
  type AnnouncementAudience,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
} from '@klassify/contracts';
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

  canEditAnnouncement(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    announcement: Announcement,
  ): DomainResult<true> {
    const capability = this.requireCapability(userContext, announcement.schoolId, Permission.AnnouncementsCreate);
    if (!capability.ok) {
      return capability;
    }

    return this.canManageAnnouncement(snapshot, userContext, announcement);
  }

  canPublishAnnouncement(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    announcement: Announcement,
  ): DomainResult<true> {
    const capability = this.requireCapability(userContext, announcement.schoolId, Permission.AnnouncementsPublish);
    if (!capability.ok) {
      return capability;
    }

    if (![AnnouncementStatus.Draft, AnnouncementStatus.Scheduled].includes(announcement.status)) {
      return failure(DomainErrorCode.ValidationError, 'Only draft or scheduled announcements can be published.');
    }

    return this.canManageAnnouncement(snapshot, userContext, announcement);
  }

  canScheduleAnnouncement(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    announcement: Announcement,
  ): DomainResult<true> {
    const capability = this.requireCapability(userContext, announcement.schoolId, Permission.AnnouncementsPublish);
    if (!capability.ok) {
      return capability;
    }

    if (![AnnouncementStatus.Draft, AnnouncementStatus.Scheduled].includes(announcement.status)) {
      return failure(DomainErrorCode.ValidationError, 'Only draft or scheduled announcements can be scheduled.');
    }

    return this.canManageAnnouncement(snapshot, userContext, announcement);
  }

  canCancelSchedule(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    announcement: Announcement,
  ): DomainResult<true> {
    const capability = this.requireCapability(userContext, announcement.schoolId, Permission.AnnouncementsPublish);
    if (!capability.ok) {
      return capability;
    }

    return this.canManageAnnouncement(snapshot, userContext, announcement);
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

  private canManageAnnouncement(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    announcement: Announcement,
  ): DomainResult<true> {
    if (userContext.schoolId !== announcement.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school announcement management is not allowed.');
    }

    if (schoolWideAnnouncementRoles.has(userContext.role)) {
      return { ok: true, value: true };
    }

    if (userContext.role !== Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'This role cannot manage announcements.');
    }

    if (announcement.authorUserId !== userContext.userId) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers may only manage announcements they authored.');
    }

    return this.canTargetAudiences(snapshot, userContext, announcement.schoolId, announcement.audience);
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
    if (audience.targetIds.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'Year group audience requires at least one target.');
    }

    const valid = audience.targetIds.every((id) => snapshot.yearGroups.some((yearGroup) => yearGroup.id === id && yearGroup.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Year group audience targets must belong to the announcement school.');
  }

  if (audience.type === AnnouncementAudienceType.Class) {
    if (audience.targetIds.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'Class audience requires at least one target.');
    }

    const valid = audience.targetIds.every((id) => snapshot.classes.some((schoolClass) => schoolClass.id === id && schoolClass.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Class audience targets must belong to the announcement school.');
  }

  if (audience.targetIds.length === 0) {
    return failure(DomainErrorCode.ValidationError, 'Selected-user audience requires at least one target.');
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
