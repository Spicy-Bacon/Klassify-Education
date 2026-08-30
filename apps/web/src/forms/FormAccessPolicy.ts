import {
  DomainErrorCode,
  FormAudienceType,
  FormStatus,
  Permission,
  Role,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
  type FormAudience,
  type FormDefinition,
  type FormRecipient,
} from '@klassify/contracts';
import { isGuardianLinkedToStudent, isTeacherAssignedToClass } from '../identity/IdentityAccessPolicy';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { IdentityService } from '../identity/identityService';

const schoolWideFormRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
]);

const formManagementPermissions = new Set<Permission>([
  Permission.FormsCreate,
  Permission.FormsPublish,
  Permission.FormsViewResponses,
  Permission.FormsRemind,
]);

export class FormAccessPolicy {
  constructor(private readonly identityService: IdentityService) {}

  canCreate(userContext: AuthenticatedUserContext, schoolId: EntityId): DomainResult<true> {
    return this.requireCapability(userContext, schoolId, Permission.FormsCreate);
  }

  canPublishForm(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    const capability = this.requireCapabilityForForm(userContext, form, Permission.FormsPublish);
    if (!capability.ok) {
      return capability;
    }

    if (form.status !== FormStatus.Draft) {
      return failure(DomainErrorCode.ValidationError, 'Only draft forms can be published.');
    }

    return this.canManageForm(snapshot, userContext, form, Permission.FormsPublish);
  }

  canCloseForm(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    const capability = this.requireCapabilityForForm(userContext, form, Permission.FormsPublish);
    if (!capability.ok) {
      return capability;
    }

    if (form.status !== FormStatus.Published) {
      return failure(DomainErrorCode.ValidationError, 'Only published forms can be closed.');
    }

    return this.canManageForm(snapshot, userContext, form, Permission.FormsPublish);
  }

  canEditDraft(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    const capability = this.requireCapabilityForForm(userContext, form, Permission.FormsCreate);
    if (!capability.ok) {
      return capability;
    }

    if (form.status !== FormStatus.Draft) {
      return failure(DomainErrorCode.ValidationError, 'Published, closed and archived forms are read-only in this phase.');
    }

    return this.canManageForm(snapshot, userContext, form, Permission.FormsCreate);
  }

  canViewResponses(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    const capability = this.requireCapabilityForForm(userContext, form, Permission.FormsViewResponses);
    if (!capability.ok) {
      return capability;
    }

    return this.canManageForm(snapshot, userContext, form, Permission.FormsViewResponses);
  }

  canRequestReminder(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    const capability = this.requireCapabilityForForm(userContext, form, Permission.FormsRemind);
    if (!capability.ok) {
      return capability;
    }

    return this.canManageForm(snapshot, userContext, form, Permission.FormsRemind);
  }

  canTargetAudiences(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    audiences: FormAudience[],
    permission: Permission = Permission.FormsCreate,
  ): DomainResult<true> {
    for (const audience of audiences) {
      const validation = this.canTargetAudience(snapshot, userContext, schoolId, audience, permission);
      if (!validation.ok) {
        return validation;
      }
    }

    return { ok: true, value: true };
  }

  canViewForm(snapshot: IdentitySnapshot, userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    if (userContext.schoolId !== form.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school form access is not allowed.');
    }

    if (schoolWideFormRoles.has(userContext.role)) {
      return { ok: true, value: true };
    }

    if (userContext.role === Role.Teacher) {
      if (form.authorUserId === userContext.userId) {
        return { ok: true, value: true };
      }

      return form.audience.some((audience) => (
        audience.type === FormAudienceType.Class
        && audience.targetIds.some((classId) => isTeacherAssignedToClass(snapshot, userContext.userId, classId))
      ))
        ? { ok: true, value: true }
        : failure(DomainErrorCode.PermissionDenied, 'Form is outside the teacher scope.');
    }

    return failure(DomainErrorCode.PermissionDenied, 'Form administration access is not allowed.');
  }

  canSubmitRecipient(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    form: FormDefinition,
    recipient: FormRecipient,
  ): DomainResult<true> {
    if (userContext.schoolId !== form.schoolId || recipient.schoolId !== form.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school form submission is not allowed.');
    }

    if (form.status !== FormStatus.Published) {
      return failure(DomainErrorCode.ValidationError, 'This form is not open for submissions.');
    }

    if (userContext.role !== Role.ParentGuardian || recipient.userId !== userContext.userId) {
      return failure(DomainErrorCode.PermissionDenied, 'This form task is not assigned to the current parent or guardian.');
    }

    if (recipient.studentId && !isGuardianLinkedToStudent(snapshot, userContext.userId, recipient.studentId)) {
      return failure(DomainErrorCode.PermissionDenied, 'The selected child is not linked to the current parent or guardian.');
    }

    return { ok: true, value: true };
  }

  private canManageForm(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    form: FormDefinition,
    permission: Permission,
  ): DomainResult<true> {
    if (userContext.schoolId !== form.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school form management is not allowed.');
    }

    if (schoolWideFormRoles.has(userContext.role)) {
      return { ok: true, value: true };
    }

    if (userContext.role !== Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'This role cannot manage forms.');
    }

    if (form.authorUserId !== userContext.userId) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers may only manage forms they authored.');
    }

    return this.canTargetAudiences(snapshot, userContext, form.schoolId, form.audience, permission);
  }

  private canTargetAudience(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    audience: FormAudience,
    permission: Permission,
  ): DomainResult<true> {
    if (userContext.schoolId !== schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school form access is not allowed.');
    }

    if (schoolWideFormRoles.has(userContext.role)) {
      return validateAudienceTargetsBelongToSchool(snapshot, schoolId, audience);
    }

    if (userContext.role !== Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'This role cannot target forms.');
    }

    if (audience.type !== FormAudienceType.Class) {
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

    return this.requireCapability(userContext, schoolId, permission, { classId: audience.targetIds[0] });
  }

  private requireCapabilityForForm(
    userContext: AuthenticatedUserContext,
    form: FormDefinition,
    permission: Permission,
  ): DomainResult<true> {
    const classId = form.audience.find((audience) => audience.type === FormAudienceType.Class)?.targetIds[0];
    return this.requireCapability(userContext, form.schoolId, permission, { classId, formId: form.id });
  }

  private requireCapability(
    userContext: AuthenticatedUserContext,
    schoolId: EntityId,
    permission: Permission,
    scope: { classId?: EntityId; formId?: EntityId } = {},
  ): DomainResult<true> {
    if (formManagementPermissions.has(permission) && userContext.role === Role.Teacher && !scope.classId) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers may only use Forms capabilities for assigned classes.');
    }

    const decision = this.identityService.can(userContext, permission, { schoolId, classId: scope.classId, formId: scope.formId });
    if (!decision.allowed) {
      return failure(DomainErrorCode.PermissionDenied, decision.reason ?? 'Forms permission is not granted.');
    }

    return { ok: true, value: true };
  }
}

export function validateAudienceTargetsBelongToSchool(
  snapshot: IdentitySnapshot,
  schoolId: EntityId,
  audience: FormAudience,
): DomainResult<true> {
  if (audience.type === FormAudienceType.School) {
    const valid = audience.targetIds.length === 1 && audience.targetIds[0] === schoolId;
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'School audience must target the form school.');
  }

  if (audience.type === FormAudienceType.YearGroup) {
    if (audience.targetIds.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'Year group audience requires at least one target.');
    }

    const valid = audience.targetIds.every((id) => snapshot.yearGroups.some((yearGroup) => yearGroup.id === id && yearGroup.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Year group audience targets must belong to the form school.');
  }

  if (audience.type === FormAudienceType.Class) {
    if (audience.targetIds.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'Class audience requires at least one target.');
    }

    const valid = audience.targetIds.every((id) => snapshot.classes.some((schoolClass) => schoolClass.id === id && schoolClass.schoolId === schoolId));
    return valid
      ? { ok: true, value: true }
      : failure(DomainErrorCode.InvalidRelationship, 'Class audience targets must belong to the form school.');
  }

  return failure(DomainErrorCode.ValidationError, 'Unsupported form audience type.');
}

function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}