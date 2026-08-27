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
  type School,
  type StaffClassAssignment,
  type Student,
  type User,
} from '@ai-school-platform/contracts';
import { IdentityAccessPolicy } from './IdentityAccessPolicy';
import type { IdentityRepository, IdentitySnapshot } from './identityRepository';
import type {
  AdminSectionId,
  AdminOverview,
  AssignableTeacher,
  ClassInput,
  ClassSummary,
  EnrollmentInput,
  GuardianLinkInput,
  GuardianSummary,
  GuardianUserInput,
  StaffAssignmentInput,
  StaffSummary,
  StaffUserInput,
  StudentInput,
  StudentSummary,
} from './identityTypes';

export class IdentityService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly accessPolicy = new IdentityAccessPolicy(),
  ) {}

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
    return this.accessPolicy.can(this.repository.getSnapshot(), userContext, permission, resourceContext);
  }

  canManageUsers(userContext: AuthenticatedUserContext): boolean {
    return this.can(userContext, Permission.SchoolManageUsers, { schoolId: userContext.schoolId }).allowed;
  }

  canManageClasses(userContext: AuthenticatedUserContext): boolean {
    return this.can(userContext, Permission.ClassesManage, { schoolId: userContext.schoolId }).allowed;
  }

  canAccessAdminPortal(userContext: AuthenticatedUserContext): boolean {
    return this.accessPolicy.canViewSchoolAdministration(userContext) || userContext.role === Role.Teacher;
  }

  canAccessAdminSection(userContext: AuthenticatedUserContext, sectionId: AdminSectionId): DomainResult<true> {
    if (!this.canAccessAdminPortal(userContext)) {
      return failure(DomainErrorCode.PermissionDenied, 'You do not have access to the school administration portal.');
    }

    if (!this.getVisibleAdminSections(userContext).includes(sectionId)) {
      return failure(DomainErrorCode.PermissionDenied, 'Your account does not have permission to access this section.');
    }

    return { ok: true, value: true };
  }

  getVisibleAdminSections(userContext: AuthenticatedUserContext): AdminSectionId[] {
    if (this.accessPolicy.canViewSchoolAdministration(userContext)) {
      return ['overview', 'users', 'students', 'parents', 'staff', 'classes'];
    }

    if (userContext.role === Role.Teacher) {
      return ['overview', 'students', 'classes'];
    }

    return [];
  }

  getCurrentUser(userContext: AuthenticatedUserContext): DomainResult<User> {
    const user = this.repository.getSnapshot().users.find((candidate) => candidate.id === userContext.userId);

    if (!user) {
      return failure(DomainErrorCode.NotFound, 'Current user was not found.');
    }

    return { ok: true, value: user };
  }

  getCurrentSchool(userContext: AuthenticatedUserContext): DomainResult<School> {
    const school = this.repository.getSnapshot().schools.find((candidate) => candidate.id === userContext.schoolId);

    if (!school) {
      return failure(DomainErrorCode.NotFound, 'School was not found.');
    }

    return { ok: true, value: school };
  }

  getAdminOverview(userContext: AuthenticatedUserContext): AdminOverview {
    const schoolResult = this.getCurrentSchool(userContext);
    const classes = this.getVisibleClasses(userContext);
    const students = this.getVisibleStudents(userContext);
    const staff = this.getVisibleStaff(userContext);
    const parents = this.getVisibleGuardians(userContext);
    const users = this.getVisibleUsers(userContext);

    return {
      school: schoolResult.ok ? schoolResult.value : undefined,
      metrics: [
        { label: 'Students', value: students.length },
        { label: 'Parents / Guardians', value: parents.length },
        { label: 'Staff', value: staff.length },
        { label: 'Classes', value: classes.length },
        { label: 'Users', value: users.length },
      ],
      classes,
      canUseManagementActions: this.canManageUsers(userContext) || this.canManageClasses(userContext),
    };
  }

  getVisibleUsers(userContext: AuthenticatedUserContext): User[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.users.filter((user) => {
      if (user.schoolId !== userContext.schoolId) {
        return false;
      }

      if (this.accessPolicy.canViewSchoolAdministration(userContext)) {
        return true;
      }

      return user.id === userContext.userId;
    });
  }

  getVisibleYearGroups(userContext: AuthenticatedUserContext) {
    const snapshot = this.repository.getSnapshot();
    const visibleClassYearGroupIds = new Set(this.getVisibleClasses(userContext).map((summary) => summary.class.yearGroupId));
    const visibleStudentYearGroupIds = new Set(this.getVisibleStudents(userContext).map((summary) => summary.student.yearGroupId));

    return snapshot.yearGroups.filter((yearGroup) => (
      yearGroup.schoolId === userContext.schoolId
      && (
        this.accessPolicy.canViewSchoolAdministration(userContext)
        || visibleClassYearGroupIds.has(yearGroup.id)
        || visibleStudentYearGroupIds.has(yearGroup.id)
      )
    ));
  }

  getVisibleStudents(userContext: AuthenticatedUserContext): StudentSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.students
      .filter((student) => student.schoolId === userContext.schoolId)
      .filter((student) => this.can(userContext, Permission.StudentsView, { schoolId: student.schoolId, studentId: student.id }).allowed)
      .map((student) => toStudentSummary(snapshot, student));
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

    return { ok: true, value: toStudentSummary(snapshot, student) };
  }

  getVisibleClasses(userContext: AuthenticatedUserContext): ClassSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.classes
      .filter((schoolClass) => schoolClass.schoolId === userContext.schoolId)
      .filter((schoolClass) => this.can(userContext, Permission.ClassesView, { schoolId: schoolClass.schoolId, classId: schoolClass.id }).allowed)
      .map((schoolClass) => toClassSummary(snapshot, schoolClass));
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

    return { ok: true, value: toClassSummary(snapshot, schoolClass) };
  }

  getVisibleStaff(userContext: AuthenticatedUserContext): StaffSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.users
      .filter((user) => isStaffRole(user.role))
      .filter((user) => user.schoolId === userContext.schoolId)
      .filter((user) => this.accessPolicy.canViewSchoolAdministration(userContext) || user.id === userContext.userId)
      .map((user) => toStaffSummary(snapshot, user));
  }

  getVisibleGuardians(userContext: AuthenticatedUserContext): GuardianSummary[] {
    const snapshot = this.repository.getSnapshot();
    return snapshot.users
      .filter((user) => user.schoolId === userContext.schoolId && user.role === Role.ParentGuardian)
      .filter((user) => this.accessPolicy.canViewSchoolAdministration(userContext) || user.id === userContext.userId)
      .map((user) => toGuardianSummary(snapshot, user));
  }

  getAssignableStudents(userContext: AuthenticatedUserContext): StudentSummary[] {
    if (!this.canManageClasses(userContext)) {
      return [];
    }

    const snapshot = this.repository.getSnapshot();
    return snapshot.students
      .filter((student) => student.schoolId === userContext.schoolId)
      .map((student) => toStudentSummary(snapshot, student));
  }

  getAssignableTeachers(userContext: AuthenticatedUserContext): AssignableTeacher[] {
    if (!this.canManageClasses(userContext)) {
      return [];
    }

    const snapshot = this.repository.getSnapshot();
    return snapshot.staffProfiles
      .filter((profile) => profile.schoolId === userContext.schoolId)
      .map((profile) => {
        const user = snapshot.users.find((candidate) => candidate.id === profile.userId && candidate.role === Role.Teacher);
        return user ? { user, profile } : undefined;
      })
      .filter(isDefined);
  }

  getLinkableGuardians(userContext: AuthenticatedUserContext): User[] {
    if (!this.canManageUsers(userContext)) {
      return [];
    }

    return this.repository.getSnapshot().users.filter((user) => user.schoolId === userContext.schoolId && user.role === Role.ParentGuardian);
  }

  getManageableClasses(userContext: AuthenticatedUserContext): ClassSummary[] {
    if (!this.canManageClasses(userContext)) {
      return [];
    }

    const snapshot = this.repository.getSnapshot();
    return snapshot.classes
      .filter((schoolClass) => schoolClass.schoolId === userContext.schoolId)
      .map((schoolClass) => toClassSummary(snapshot, schoolClass));
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

function toStudentSummary(snapshot: IdentitySnapshot, student: Student): StudentSummary {
  const yearGroup = snapshot.yearGroups.find((candidate) => candidate.id === student.yearGroupId);
  const activeEnrollment = snapshot.classEnrollments.find((enrollment) => enrollment.studentId === student.id && enrollment.status === EnrollmentStatus.Active);
  const schoolClass = activeEnrollment ? snapshot.classes.find((candidate) => candidate.id === activeEnrollment.classId) : undefined;

  return {
    student,
    yearGroup,
    className: schoolClass?.name,
  };
}

function toStaffSummary(snapshot: IdentitySnapshot, user: User): StaffSummary {
  const profile = snapshot.staffProfiles.find((candidate) => candidate.userId === user.id);
  const assignedClassNames = snapshot.staffClassAssignments
    .filter((assignment) => assignment.staffUserId === user.id)
    .map((assignment) => snapshot.classes.find((schoolClass) => schoolClass.id === assignment.classId)?.name)
    .filter(isDefined);

  return { user, profile, assignedClassNames };
}

function toGuardianSummary(snapshot: IdentitySnapshot, user: User): GuardianSummary {
  return {
    user,
    linkedChildren: snapshot.guardianStudentLinks
      .filter((link) => link.guardianUserId === user.id && link.status === RelationshipStatus.Active)
      .map((link) => snapshot.students.find((student) => student.id === link.studentId))
      .filter(isDefined)
      .map((student) => toStudentSummary(snapshot, student)),
  };
}

function toClassSummary(snapshot: IdentitySnapshot, schoolClass: Class): ClassSummary {
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

function isStaffRole(role: Role) {
  return [
    Role.SchoolOwner,
    Role.Principal,
    Role.SchoolAdmin,
    Role.ItAdmin,
    Role.Teacher,
    Role.Staff,
  ].includes(role);
}
