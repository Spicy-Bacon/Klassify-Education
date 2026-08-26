import { describe, expect, it } from 'vitest';
import {
  DomainErrorCode,
  GuardianRelationshipType,
  Permission,
  Role,
  StaffClassAssignmentType,
} from '../../../../packages/contracts/src';
import { DevelopmentIdentityRepository, developmentIdentityIds } from './developmentIdentityRepository';
import { IdentityService } from './identityService';

function createService() {
  const repository = new DevelopmentIdentityRepository();
  return new IdentityService(repository);
}

function contextFor(service: IdentityService, userId: string) {
  const result = service.createUserContext(userId);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

describe('IdentityService relationships', () => {
  it('allows one guardian to be linked to multiple students', () => {
    const service = createService();
    const parentContext = contextFor(service, developmentIdentityIds.parentAmy);
    const students = service.getVisibleStudents(parentContext);

    expect(students.map((summary) => summary.student.id).sort()).toEqual([
      developmentIdentityIds.studentChloe,
      developmentIdentityIds.studentEthan,
    ].sort());
  });

  it('allows one student to have multiple guardians', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);
    const guardians = service.getVisibleGuardians(principalContext);

    const guardiansLinkedToChloe = guardians.filter((guardian) => (
      guardian.linkedChildren.some((child) => child.student.id === developmentIdentityIds.studentChloe)
    ));

    expect(guardiansLinkedToChloe).toHaveLength(2);
  });

  it('rejects duplicate guardian-student relationships', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);
    const result = service.createGuardianStudentLink(principalContext, {
      schoolId: developmentIdentityIds.demoSchool,
      guardianUserId: developmentIdentityIds.parentAmy,
      studentId: developmentIdentityIds.studentChloe,
      relationshipType: GuardianRelationshipType.Mother,
      isPrimary: true,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: DomainErrorCode.DuplicateRelationship,
        message: 'This guardian is already linked to the student.',
      },
    });
  });

  it('rejects cross-school guardian-student links', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);
    const result = service.createGuardianStudentLink(principalContext, {
      schoolId: developmentIdentityIds.demoSchool,
      guardianUserId: developmentIdentityIds.parentAmy,
      studentId: developmentIdentityIds.otherStudent,
      relationshipType: GuardianRelationshipType.Guardian,
      isPrimary: false,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.InvalidRelationship);
  });

  it('rejects cross-school teacher-class assignments', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);
    const result = service.createStaffClassAssignment(principalContext, {
      schoolId: developmentIdentityIds.demoSchool,
      staffProfileId: developmentIdentityIds.staffTeacher3A,
      staffUserId: developmentIdentityIds.teacher3A,
      classId: developmentIdentityIds.otherClass,
      assignmentType: StaffClassAssignmentType.ClassTeacher,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.InvalidRelationship);
  });

  it('rejects cross-school student-class enrolments', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);
    const result = service.createClassEnrollment(principalContext, {
      schoolId: developmentIdentityIds.demoSchool,
      studentId: developmentIdentityIds.studentChloe,
      classId: developmentIdentityIds.otherClass,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.InvalidRelationship);
  });
});

describe('IdentityService scoped access', () => {
  it('limits a teacher to assigned classes and students', () => {
    const service = createService();
    const teacherContext = contextFor(service, developmentIdentityIds.teacher3A);

    expect(service.getVisibleClasses(teacherContext).map((summary) => summary.class.id)).toEqual([
      developmentIdentityIds.class3A,
    ]);

    expect(service.getVisibleStudents(teacherContext).map((summary) => summary.student.id).sort()).toEqual([
      developmentIdentityIds.studentChloe,
      developmentIdentityIds.studentMaya,
    ].sort());

    const protectedResult = service.getStudentById(teacherContext, developmentIdentityIds.studentNoah);
    expect(protectedResult.ok).toBe(false);
    expect(protectedResult.ok ? undefined : protectedResult.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('limits a parent to linked children', () => {
    const service = createService();
    const parentContext = contextFor(service, developmentIdentityIds.parentAmy);

    expect(service.getVisibleStudents(parentContext).map((summary) => summary.student.id).sort()).toEqual([
      developmentIdentityIds.studentChloe,
      developmentIdentityIds.studentEthan,
    ].sort());

    const unrelatedResult = service.getStudentById(parentContext, developmentIdentityIds.studentMaya);
    expect(unrelatedResult.ok).toBe(false);
    expect(unrelatedResult.ok ? undefined : unrelatedResult.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('limits a student to their own student profile', () => {
    const service = createService();
    const studentContext = contextFor(service, developmentIdentityIds.studentChloeUser);

    expect(service.getVisibleStudents(studentContext).map((summary) => summary.student.id)).toEqual([
      developmentIdentityIds.studentChloe,
    ]);
  });

  it('allows a student to see their own class relationship only', () => {
    const service = createService();
    const studentContext = contextFor(service, developmentIdentityIds.studentChloeUser);

    expect(service.getVisibleClasses(studentContext).map((summary) => summary.class.id)).toEqual([
      developmentIdentityIds.class3A,
    ]);
  });

  it('limits a school admin to their own school', () => {
    const service = createService();
    const adminContext = contextFor(service, developmentIdentityIds.admin);

    expect(service.getVisibleStudents(adminContext).some((summary) => summary.student.id === developmentIdentityIds.otherStudent)).toBe(false);
    expect(service.can(adminContext, Permission.SchoolManageUsers, { schoolId: developmentIdentityIds.otherSchool }).allowed).toBe(false);
  });

  it('does not grant media operators general student access by role alone', () => {
    const service = createService();
    const mediaContext = contextFor(service, developmentIdentityIds.mediaOperator);

    expect(service.getVisibleStudents(mediaContext)).toEqual([]);
  });

  it('allows school-wide identity access for principals inside their school only', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);

    expect(service.getVisibleClasses(principalContext)).toHaveLength(3);
    expect(service.getVisibleStudents(principalContext)).toHaveLength(4);
    expect(service.can(principalContext, Permission.UsersView, { schoolId: developmentIdentityIds.otherSchool }).allowed).toBe(false);
  });
});

describe('IdentityService validation', () => {
  it('rejects student creation without required fields', () => {
    const service = createService();
    const adminContext = contextFor(service, developmentIdentityIds.admin);
    const result = service.createStudent(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      studentNumber: '',
      firstName: 'Test',
      lastName: 'Student',
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.ValidationError);
  });

  it('rejects duplicate class enrolments', () => {
    const service = createService();
    const adminContext = contextFor(service, developmentIdentityIds.admin);
    const result = service.createClassEnrollment(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      studentId: developmentIdentityIds.studentChloe,
      classId: developmentIdentityIds.class3A,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.DuplicateRelationship);
  });

  it('rejects class writes from a teacher without manage permission', () => {
    const service = createService();
    const teacherContext = contextFor(service, developmentIdentityIds.teacher3A);
    const result = service.createClass(teacherContext, {
      schoolId: developmentIdentityIds.demoSchool,
      yearGroupId: 'year_3',
      name: '3C',
      academicYear: '2026',
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('creates a valid new student and enrolment through the service boundary', () => {
    const service = createService();
    const adminContext = contextFor(service, developmentIdentityIds.admin);
    const student = service.createStudent(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      studentNumber: 'S-3999',
      firstName: 'Dev',
      lastName: 'Learner',
      yearGroupId: 'year_3',
    });

    expect(student.ok).toBe(true);
    if (!student.ok) {
      throw new Error(student.error.message);
    }

    const enrolment = service.createClassEnrollment(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      studentId: student.value.id,
      classId: developmentIdentityIds.class3A,
    });

    expect(enrolment.ok).toBe(true);
  });
});
