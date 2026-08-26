import {
  DomainErrorCode,
  EnrollmentStatus,
  GuardianRelationshipType,
  Permission,
  RelationshipStatus,
  Role,
  StaffClassAssignmentType,
  StudentStatus,
  UserStatus,
  type AuthenticatedUserContext,
  type Class,
  type ClassEnrollment,
  type DomainResult,
  type EntityId,
  type GuardianStudentLink,
  type PermissionDecision,
  type ResourceContext,
  type StaffClassAssignment,
  type StaffProfile,
  type Student,
  type User,
  type YearGroup,
} from '../../../../packages/contracts/src';
import type { IdentityRepository, IdentitySnapshot } from './identityRepository';

export interface StudentInput {
  schoolId: EntityId;
  studentNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  yearGroupId?: EntityId;
}

export interface StaffUserInput {
  schoolId: EntityId;
  displayName: string;
  email: string;
  role: Role.Teacher | Role.Staff | Role.SchoolAdmin | Role.ItAdmin | Role.Principal;
  staffNumber?: string;
  jobTitle?: string;
  department?: string;
}

export interface GuardianUserInput {
  schoolId: EntityId;
  displayName: string;
  email: string;
}

export interface ClassInput {
  schoolId: EntityId;
  yearGroupId?: EntityId;
  name: string;
  academicYear?: string;
}

export interface GuardianLinkInput {
  schoolId: EntityId;
  guardianUserId: EntityId;
  studentId: EntityId;
  relationshipType: GuardianRelationshipType;
  isPrimary: boolean;
}

export interface StaffAssignmentInput {
  schoolId: EntityId;
  staffProfileId: EntityId;
  staffUserId: EntityId;
  classId: EntityId;
  assignmentType: StaffClassAssignmentType;
}

export interface EnrollmentInput {
  schoolId: EntityId;
  studentId: EntityId;
  classId: EntityId;
  startDate?: string;
}

export interface StudentSummary {
  student: Student;
  yearGroup?: YearGroup;
  className?: string;
}

export interface StaffSummary {
  user: User;
  profile?: StaffProfile;
  assignedClassNames: string[];
}

export interface GuardianSummary {
  user: User;
  linkedChildren: StudentSummary[];
}

export interface ClassSummary {
  class: Class;
  yearGroup?: YearGroup;
  students: Student[];
  teachers: User[];
}

const schoolWideRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
  Role.ItAdmin,
]);

const staffRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
  Role.ItAdmin,
  Role.Teacher,
  Role.Staff,
]);

export class IdentityService {
  constructor(private readonly repository: IdentityRepository) {}

  getSnapshot(): IdentitySnapshot {
    return this.repository.getSnapshot();
  }

  createUserContext(userId: EntityId): DomainResult<AuthenticatedUserContext> {
    const snapshot = this.repository.getSnapshot();
    const user = snapshot.users.find((candidate) => candidate.id === userId);

    if (!user) {
      return failure(DomainErrorCode.NotFound, 'User was not found.');
    }

    if (user.status !== UserStatus.Active) {
      return failure(DomainErrorCode.PermissionDenied, 'Inactive users cannot act in the development identity context.');
    }

    const student = snapshot.students.find((candidate) => candidate.userId === user.id);

    return {
      ok: true,
      value: {
        userId: user.id,
        schoolId: user.schoolId,
        role: user.role,
        studentId: student?.id,
      },
    };
  }

  can(userContext: AuthenticatedUserContext, permission: Permission, resourceContext: ResourceContext): PermissionDecision {
    const snapshot = this.repository.getSnapshot();

    if (userContext.schoolId !== resourceContext.schoolId) {
      return { allowed: false, reason: 'Cross-school access is not allowed.' };
    }

    if (userContext.explicitPermissions?.includes(permission)) {
      return { allowed: true };
    }

    if (userContext.role === Role.SchoolOwner || userContext.role === Role.Principal) {
      return { allowed: true };
    }

    if (userContext.role === Role.SchoolAdmin) {
      return {
        allowed: [
          Permission.SchoolManageUsers,
          Permission.UsersView,
          Permission.ClassesView,
          Permission.ClassesManage,
          Permission.StudentsView,
        ].includes(permission),
      };
    }

    if (userContext.role === Role.ItAdmin) {
      return {
        allowed: [
          Permission.SchoolManageUsers,
          Permission.SchoolManageSettings,
          Permission.UsersView,
          Permission.ClassesView,
        ].includes(permission),
      };
    }

    if (userContext.role === Role.Teacher) {
      if (permission === Permission.ClassesView && resourceContext.classId) {
        return { allowed: this.isTeacherAssignedToClass(snapshot, userContext.userId, resourceContext.classId) };
      }

      if (permission === Permission.StudentsView && resourceContext.studentId) {
        return { allowed: this.isTeacherAssignedToStudent(snapshot, userContext.userId, resourceContext.studentId) };
      }
    }

    if (userContext.role === Role.ParentGuardian && permission === Permission.StudentsView && resourceContext.studentId) {
      return { allowed: this.isGuardianLinkedToStudent(snapshot, userContext.userId, resourceContext.studentId) };
    }

    if (userContext.role === Role.Student && permission === Permission.StudentsView && resourceContext.studentId) {
      return { allowed: userContext.studentId === resourceContext.studentId };
    }

    if (userContext.role === Role.Student && permission === Permission.ClassesView && resourceContext.classId) {
      return { allowed: this.isStudentEnrolledInClass(snapshot, userContext.studentId, resourceContext.classId) };
    }

    return { allowed: false, reason: 'The requested permission is not granted for this role and resource.' };
  }

  getVisibleStudents(userContext: AuthenticatedUserContext): StudentSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.students
      .filter((student) => student.schoolId === userContext.schoolId)
      .filter((student) => this.can(userContext, Permission.StudentsView, { schoolId: student.schoolId, studentId: student.id }).allowed)
      .map((student) => this.toStudentSummary(snapshot, student));
  }

  getStudentById(userContext: AuthenticatedUserContext, studentId: EntityId): DomainResult<StudentSummary> {
    const snapshot = this.repository.getSnapshot();
    const student = snapshot.students.find((candidate) => candidate.id === studentId);

    if (!student) {
      return failure(DomainErrorCode.NotFound, 'Student was not found.');
    }

    const decision = this.can(userContext, Permission.StudentsView, { schoolId: student.schoolId, studentId: student.id });
    if (!decision.allowed) {
      return failure(DomainErrorCode.PermissionDenied, decision.reason ?? 'Student access is not allowed.');
    }

    return { ok: true, value: this.toStudentSummary(snapshot, student) };
  }

  getVisibleClasses(userContext: AuthenticatedUserContext): ClassSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.classes
      .filter((schoolClass) => schoolClass.schoolId === userContext.schoolId)
      .filter((schoolClass) => this.can(userContext, Permission.ClassesView, { schoolId: schoolClass.schoolId, classId: schoolClass.id }).allowed)
      .map((schoolClass) => this.toClassSummary(snapshot, schoolClass));
  }

  getVisibleUsers(userContext: AuthenticatedUserContext): User[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.users.filter((user) => {
      if (user.schoolId !== userContext.schoolId) {
        return false;
      }

      if (schoolWideRoles.has(userContext.role)) {
        return true;
      }

      return user.id === userContext.userId;
    });
  }

  getClassById(userContext: AuthenticatedUserContext, classId: EntityId): DomainResult<ClassSummary> {
    const snapshot = this.repository.getSnapshot();
    const schoolClass = snapshot.classes.find((candidate) => candidate.id === classId);

    if (!schoolClass) {
      return failure(DomainErrorCode.NotFound, 'Class was not found.');
    }

    const decision = this.can(userContext, Permission.ClassesView, { schoolId: schoolClass.schoolId, classId: schoolClass.id });
    if (!decision.allowed) {
      return failure(DomainErrorCode.PermissionDenied, decision.reason ?? 'Class access is not allowed.');
    }

    return { ok: true, value: this.toClassSummary(snapshot, schoolClass) };
  }

  getVisibleStaff(userContext: AuthenticatedUserContext): StaffSummary[] {
    const snapshot = this.repository.getSnapshot();
    const canViewSchoolStaff = schoolWideRoles.has(userContext.role);
    const users = snapshot.users.filter((user) => {
      if (user.schoolId !== userContext.schoolId || !staffRoles.has(user.role)) {
        return false;
      }

      return canViewSchoolStaff || user.id === userContext.userId;
    });

    return users.map((user) => this.toStaffSummary(snapshot, user));
  }

  getVisibleGuardians(userContext: AuthenticatedUserContext): GuardianSummary[] {
    const snapshot = this.repository.getSnapshot();
    const guardians = snapshot.users.filter((user) => {
      if (user.schoolId !== userContext.schoolId || user.role !== Role.ParentGuardian) {
        return false;
      }

      return schoolWideRoles.has(userContext.role) || user.id === userContext.userId;
    });

    return guardians.map((user) => ({
      user,
      linkedChildren: snapshot.guardianStudentLinks
        .filter((link) => link.guardianUserId === user.id && link.status === RelationshipStatus.Active)
        .map((link) => snapshot.students.find((student) => student.id === link.studentId))
        .filter(isDefined)
        .map((student) => this.toStudentSummary(snapshot, student)),
    }));
  }

  createStudent(userContext: AuthenticatedUserContext, input: StudentInput): DomainResult<Student> {
    const snapshot = this.repository.getSnapshot();
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.SchoolManageUsers);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    if (!input.firstName.trim() || !input.lastName.trim() || !input.studentNumber.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Student number, first name and last name are required.');
    }

    if (input.yearGroupId && !snapshot.yearGroups.some((yearGroup) => yearGroup.id === input.yearGroupId && yearGroup.schoolId === input.schoolId)) {
      return failure(DomainErrorCode.InvalidRelationship, 'Year group must belong to the same school as the student.');
    }

    if (snapshot.students.some((student) => student.schoolId === input.schoolId && student.studentNumber === input.studentNumber)) {
      return failure(DomainErrorCode.ValidationError, 'Student number already exists in this school.');
    }

    return { ok: true, value: this.repository.createStudent(input) };
  }

  createStaffUser(userContext: AuthenticatedUserContext, input: StaffUserInput): DomainResult<User> {
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.SchoolManageUsers);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    if (!input.displayName.trim() || !input.email.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Staff name and email are required.');
    }

    return { ok: true, value: this.repository.createStaffUser(input) };
  }

  createGuardianUser(userContext: AuthenticatedUserContext, input: GuardianUserInput): DomainResult<User> {
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.SchoolManageUsers);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    if (!input.displayName.trim() || !input.email.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Guardian name and email are required.');
    }

    return { ok: true, value: this.repository.createGuardianUser(input) };
  }

  createClass(userContext: AuthenticatedUserContext, input: ClassInput): DomainResult<Class> {
    const snapshot = this.repository.getSnapshot();
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.ClassesManage);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    if (!input.name.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Class name is required.');
    }

    if (input.yearGroupId && !snapshot.yearGroups.some((yearGroup) => yearGroup.id === input.yearGroupId && yearGroup.schoolId === input.schoolId)) {
      return failure(DomainErrorCode.InvalidRelationship, 'Year group must belong to the same school as the class.');
    }

    return { ok: true, value: this.repository.createClass(input) };
  }

  createGuardianStudentLink(userContext: AuthenticatedUserContext, input: GuardianLinkInput): DomainResult<GuardianStudentLink> {
    const snapshot = this.repository.getSnapshot();
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.SchoolManageUsers);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    const guardian = snapshot.users.find((user) => user.id === input.guardianUserId);
    const student = snapshot.students.find((candidate) => candidate.id === input.studentId);

    if (!guardian || !student) {
      return failure(DomainErrorCode.NotFound, 'Guardian or student was not found.');
    }

    if (guardian.role !== Role.ParentGuardian) {
      return failure(DomainErrorCode.InvalidRelationship, 'Only parent or guardian users can be linked to students.');
    }

    if (guardian.schoolId !== input.schoolId || student.schoolId !== input.schoolId) {
      return failure(DomainErrorCode.InvalidRelationship, 'A guardian cannot be linked to a student from another school.');
    }

    if (snapshot.guardianStudentLinks.some((link) => link.guardianUserId === input.guardianUserId && link.studentId === input.studentId && link.status === RelationshipStatus.Active)) {
      return failure(DomainErrorCode.DuplicateRelationship, 'This guardian is already linked to the student.');
    }

    return { ok: true, value: this.repository.createGuardianStudentLink(input) };
  }

  createStaffClassAssignment(userContext: AuthenticatedUserContext, input: StaffAssignmentInput): DomainResult<StaffClassAssignment> {
    const snapshot = this.repository.getSnapshot();
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.ClassesManage);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    const staffProfile = snapshot.staffProfiles.find((profile) => profile.id === input.staffProfileId);
    const staffUser = snapshot.users.find((user) => user.id === input.staffUserId);
    const schoolClass = snapshot.classes.find((candidate) => candidate.id === input.classId);

    if (!staffProfile || !staffUser || !schoolClass) {
      return failure(DomainErrorCode.NotFound, 'Staff profile, user or class was not found.');
    }

    if (staffProfile.userId !== staffUser.id) {
      return failure(DomainErrorCode.InvalidRelationship, 'Staff profile must belong to the assigned staff user.');
    }

    if (staffProfile.schoolId !== input.schoolId || staffUser.schoolId !== input.schoolId || schoolClass.schoolId !== input.schoolId) {
      return failure(DomainErrorCode.InvalidRelationship, 'A teacher cannot be assigned to a class from another school.');
    }

    if (snapshot.staffClassAssignments.some((assignment) => assignment.staffProfileId === input.staffProfileId && assignment.classId === input.classId)) {
      return failure(DomainErrorCode.DuplicateRelationship, 'This staff member is already assigned to the class.');
    }

    return { ok: true, value: this.repository.createStaffClassAssignment(input) };
  }

  createClassEnrollment(userContext: AuthenticatedUserContext, input: EnrollmentInput): DomainResult<ClassEnrollment> {
    const snapshot = this.repository.getSnapshot();
    const baseValidation = this.validateSameSchoolWrite(userContext, input.schoolId, Permission.ClassesManage);
    if (!baseValidation.ok) {
      return baseValidation;
    }

    const student = snapshot.students.find((candidate) => candidate.id === input.studentId);
    const schoolClass = snapshot.classes.find((candidate) => candidate.id === input.classId);

    if (!student || !schoolClass) {
      return failure(DomainErrorCode.NotFound, 'Student or class was not found.');
    }

    if (student.schoolId !== input.schoolId || schoolClass.schoolId !== input.schoolId) {
      return failure(DomainErrorCode.InvalidRelationship, 'A student cannot be enrolled into a class from another school.');
    }

    if (snapshot.classEnrollments.some((enrollment) => enrollment.studentId === input.studentId && enrollment.classId === input.classId && enrollment.status === EnrollmentStatus.Active)) {
      return failure(DomainErrorCode.DuplicateRelationship, 'This student is already actively enrolled in the class.');
    }

    return { ok: true, value: this.repository.createClassEnrollment(input) };
  }

  private validateSameSchoolWrite(userContext: AuthenticatedUserContext, schoolId: EntityId, permission: Permission): DomainResult<true> {
    const decision = this.can(userContext, permission, { schoolId });
    if (!decision.allowed) {
      return failure(DomainErrorCode.PermissionDenied, decision.reason ?? 'This action is not allowed.');
    }

    return { ok: true, value: true };
  }

  private isTeacherAssignedToClass(snapshot: IdentitySnapshot, staffUserId: EntityId, classId: EntityId): boolean {
    return snapshot.staffClassAssignments.some((assignment) => assignment.staffUserId === staffUserId && assignment.classId === classId);
  }

  private isTeacherAssignedToStudent(snapshot: IdentitySnapshot, staffUserId: EntityId, studentId: EntityId): boolean {
    const assignedClassIds = snapshot.staffClassAssignments
      .filter((assignment) => assignment.staffUserId === staffUserId)
      .map((assignment) => assignment.classId);

    return snapshot.classEnrollments.some((enrollment) => (
      enrollment.studentId === studentId
      && enrollment.status === EnrollmentStatus.Active
      && assignedClassIds.includes(enrollment.classId)
    ));
  }

  private isGuardianLinkedToStudent(snapshot: IdentitySnapshot, guardianUserId: EntityId, studentId: EntityId): boolean {
    return snapshot.guardianStudentLinks.some((link) => (
      link.guardianUserId === guardianUserId
      && link.studentId === studentId
      && link.status === RelationshipStatus.Active
    ));
  }

  private isStudentEnrolledInClass(snapshot: IdentitySnapshot, studentId: EntityId | undefined, classId: EntityId): boolean {
    if (!studentId) {
      return false;
    }

    return snapshot.classEnrollments.some((enrollment) => (
      enrollment.studentId === studentId
      && enrollment.classId === classId
      && enrollment.status === EnrollmentStatus.Active
    ));
  }

  private toStudentSummary(snapshot: IdentitySnapshot, student: Student): StudentSummary {
    const yearGroup = snapshot.yearGroups.find((candidate) => candidate.id === student.yearGroupId);
    const activeEnrollment = snapshot.classEnrollments.find((enrollment) => enrollment.studentId === student.id && enrollment.status === EnrollmentStatus.Active);
    const schoolClass = activeEnrollment ? snapshot.classes.find((candidate) => candidate.id === activeEnrollment.classId) : undefined;

    return {
      student,
      yearGroup,
      className: schoolClass?.name,
    };
  }

  private toStaffSummary(snapshot: IdentitySnapshot, user: User): StaffSummary {
    const profile = snapshot.staffProfiles.find((candidate) => candidate.userId === user.id);
    const assignedClassNames = snapshot.staffClassAssignments
      .filter((assignment) => assignment.staffUserId === user.id)
      .map((assignment) => snapshot.classes.find((schoolClass) => schoolClass.id === assignment.classId)?.name)
      .filter(isDefined);

    return { user, profile, assignedClassNames };
  }

  private toClassSummary(snapshot: IdentitySnapshot, schoolClass: Class): ClassSummary {
    const yearGroup = snapshot.yearGroups.find((candidate) => candidate.id === schoolClass.yearGroupId);
    const students = snapshot.classEnrollments
      .filter((enrollment) => enrollment.classId === schoolClass.id && enrollment.status === EnrollmentStatus.Active)
      .map((enrollment) => snapshot.students.find((student) => student.id === enrollment.studentId))
      .filter(isDefined);
    const teachers = snapshot.staffClassAssignments
      .filter((assignment) => assignment.classId === schoolClass.id)
      .map((assignment) => snapshot.users.find((user) => user.id === assignment.staffUserId))
      .filter(isDefined);

    return { class: schoolClass, yearGroup, students, teachers };
  }
}

export function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export const relationshipTypeOptions = Object.values(GuardianRelationshipType);
export const staffAssignmentTypeOptions = Object.values(StaffClassAssignmentType);
export const studentStatusOptions = Object.values(StudentStatus);
