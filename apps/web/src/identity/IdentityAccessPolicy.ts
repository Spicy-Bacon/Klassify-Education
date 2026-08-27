import {
  EnrollmentStatus,
  Permission,
  RelationshipStatus,
  Role,
  type AuthenticatedUserContext,
  type EntityId,
  type PermissionDecision,
  type ResourceContext,
} from '@ai-school-platform/contracts';
import type { IdentitySnapshot } from './identityRepository';

const schoolWideRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
  Role.ItAdmin,
]);

const schoolAdminCapabilities = new Set<Permission>([
  Permission.SchoolManageUsers,
  Permission.UsersView,
  Permission.ClassesView,
  Permission.ClassesManage,
  Permission.StudentsView,
  Permission.AnnouncementsCreate,
  Permission.AnnouncementsPublish,
]);

const itAdminCapabilities = new Set<Permission>([
  Permission.SchoolManageUsers,
  Permission.SchoolManageSettings,
  Permission.UsersView,
  Permission.ClassesView,
]);

const teacherCapabilities = new Set<Permission>([
  Permission.ClassesView,
  Permission.StudentsView,
  Permission.AttendanceManage,
  Permission.AnnouncementsCreate,
  Permission.AnnouncementsPublish,
]);

const parentCapabilities = new Set<Permission>([
  Permission.StudentsView,
]);

const studentCapabilities = new Set<Permission>([
  Permission.ClassesView,
  Permission.StudentsView,
]);

export class IdentityAccessPolicy {
  can(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    permission: Permission,
    resourceContext: ResourceContext,
  ): PermissionDecision {
    if (userContext.schoolId !== resourceContext.schoolId) {
      return { allowed: false, reason: 'Cross-school access is not allowed.' };
    }

    if (!this.hasCapability(userContext, permission)) {
      return { allowed: false, reason: 'The requested capability is not granted.' };
    }

    if (!this.isWithinResourceScope(snapshot, userContext, permission, resourceContext)) {
      return { allowed: false, reason: 'The requested resource is outside the user scope.' };
    }

    return { allowed: true };
  }

  canViewSchoolAdministration(userContext: AuthenticatedUserContext): boolean {
    return schoolWideRoles.has(userContext.role);
  }

  private hasCapability(userContext: AuthenticatedUserContext, permission: Permission): boolean {
    if (userContext.role === Role.SchoolOwner || userContext.role === Role.Principal) {
      return true;
    }

    if (userContext.explicitPermissions?.includes(permission)) {
      return true;
    }

    if (userContext.role === Role.SchoolAdmin) {
      return schoolAdminCapabilities.has(permission);
    }

    if (userContext.role === Role.ItAdmin) {
      return itAdminCapabilities.has(permission);
    }

    if (userContext.role === Role.Teacher) {
      return teacherCapabilities.has(permission);
    }

    if (userContext.role === Role.ParentGuardian) {
      return parentCapabilities.has(permission);
    }

    if (userContext.role === Role.Student) {
      return studentCapabilities.has(permission);
    }

    if (userContext.role === Role.MediaOperator) {
      return [
        Permission.MediaUpload,
        Permission.MediaManage,
        Permission.MediaPublish,
      ].some((mediaPermission) => mediaPermission === permission);
    }

    return false;
  }

  private isWithinResourceScope(
    snapshot: IdentitySnapshot,
    userContext: AuthenticatedUserContext,
    permission: Permission,
    resourceContext: ResourceContext,
  ): boolean {
    if (schoolWideRoles.has(userContext.role)) {
      return true;
    }

    if (permission === Permission.SchoolManageUsers || permission === Permission.ClassesManage || permission === Permission.SchoolManageSettings) {
      return false;
    }

    if (userContext.role === Role.Teacher) {
      if (permission === Permission.ClassesView && resourceContext.classId) {
        return isTeacherAssignedToClass(snapshot, userContext.userId, resourceContext.classId);
      }

      if ((permission === Permission.StudentsView || permission === Permission.AttendanceManage) && resourceContext.studentId) {
        return isTeacherAssignedToStudent(snapshot, userContext.userId, resourceContext.studentId);
      }
    }

    if (userContext.role === Role.ParentGuardian && permission === Permission.StudentsView && resourceContext.studentId) {
      return isGuardianLinkedToStudent(snapshot, userContext.userId, resourceContext.studentId);
    }

    if (userContext.role === Role.Student) {
      if (permission === Permission.StudentsView && resourceContext.studentId) {
        return userContext.studentId === resourceContext.studentId;
      }

      if (permission === Permission.ClassesView && resourceContext.classId) {
        return isStudentEnrolledInClass(snapshot, userContext.studentId, resourceContext.classId);
      }
    }

    return !resourceContext.classId && !resourceContext.studentId;
  }
}

export function isTeacherAssignedToClass(snapshot: IdentitySnapshot, staffUserId: EntityId, classId: EntityId): boolean {
  return snapshot.staffClassAssignments.some((assignment) => assignment.staffUserId === staffUserId && assignment.classId === classId);
}

export function isTeacherAssignedToStudent(snapshot: IdentitySnapshot, staffUserId: EntityId, studentId: EntityId): boolean {
  const assignedClassIds = snapshot.staffClassAssignments
    .filter((assignment) => assignment.staffUserId === staffUserId)
    .map((assignment) => assignment.classId);

  return snapshot.classEnrollments.some((enrollment) => (
    enrollment.studentId === studentId
    && enrollment.status === EnrollmentStatus.Active
    && assignedClassIds.includes(enrollment.classId)
  ));
}

export function isGuardianLinkedToStudent(snapshot: IdentitySnapshot, guardianUserId: EntityId, studentId: EntityId): boolean {
  return snapshot.guardianStudentLinks.some((link) => (
    link.guardianUserId === guardianUserId
    && link.studentId === studentId
    && link.status === RelationshipStatus.Active
  ));
}

export function isStudentEnrolledInClass(snapshot: IdentitySnapshot, studentId: EntityId | undefined, classId: EntityId): boolean {
  if (!studentId) {
    return false;
  }

  return snapshot.classEnrollments.some((enrollment) => (
    enrollment.studentId === studentId
    && enrollment.classId === classId
    && enrollment.status === EnrollmentStatus.Active
  ));
}
