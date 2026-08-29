import {
  ClassStatus,
  EnrollmentStatus,
  GuardianRelationshipType,
  RelationshipStatus,
  Role,
  SchoolStatus,
  StaffClassAssignmentType,
  StudentStatus,
  UserStatus,
  type Class,
  type ClassEnrollment,
  type EntityId,
  type GuardianProfile,
  type GuardianStudentLink,
  type School,
  type StaffClassAssignment,
  type StaffProfile,
  type Student,
  type User,
  type YearGroup,
} from '@klassify/contracts';
import type { IdentityRepository, IdentitySnapshot } from './identityRepository';
import type {
  ClassInput,
  EnrollmentInput,
  GuardianLinkInput,
  GuardianUserInput,
  StaffAssignmentInput,
  StaffUserInput,
  StudentInput,
} from './identityTypes';

const createdAt = '2026-08-26T00:00:00.000Z';

export const developmentIdentityIds = {
  demoSchool: 'school_demo',
  otherSchool: 'school_other',
  principal: 'user_principal_demo',
  admin: 'user_admin_demo',
  teacher3A: 'user_teacher_3a',
  teacher3B: 'user_teacher_3b',
  parentAmy: 'user_parent_amy',
  parentBen: 'user_parent_ben',
  studentChloeUser: 'user_student_chloe',
  mediaOperator: 'user_media_operator_demo',
  otherTeacher: 'user_other_teacher',
  otherParent: 'user_other_parent',
  staffTeacher3A: 'staff_teacher_3a',
  staffOtherTeacher: 'staff_other_teacher',
  class1B: 'class_1b',
  class3A: 'class_3a',
  class3B: 'class_3b',
  otherClass: 'class_other',
  studentChloe: 'student_chloe',
  studentEthan: 'student_ethan',
  studentMaya: 'student_maya',
  studentNoah: 'student_noah',
  otherStudent: 'student_other',
};

export class DevelopmentIdentityRepository implements IdentityRepository {
  private idCounter = 0;
  private readonly schools: School[] = [
    {
      id: developmentIdentityIds.demoSchool,
      name: 'Demo School',
      status: SchoolStatus.Pilot,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: developmentIdentityIds.otherSchool,
      name: 'Example Separate School',
      status: SchoolStatus.Pilot,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  private readonly yearGroups: YearGroup[] = [
    { id: 'year_1', schoolId: developmentIdentityIds.demoSchool, name: 'Year 1', sortOrder: 1 },
    { id: 'year_3', schoolId: developmentIdentityIds.demoSchool, name: 'Year 3', sortOrder: 3 },
    { id: 'year_other', schoolId: developmentIdentityIds.otherSchool, name: 'Form 1', sortOrder: 1 },
  ];

  private readonly users: User[] = [
    this.user(developmentIdentityIds.principal, developmentIdentityIds.demoSchool, 'Demo Principal', 'principal@example.test', Role.Principal),
    this.user(developmentIdentityIds.admin, developmentIdentityIds.demoSchool, 'Demo Administrator', 'admin@example.test', Role.SchoolAdmin),
    this.user(developmentIdentityIds.teacher3A, developmentIdentityIds.demoSchool, 'Taylor Chan', 'taylor.chan@example.test', Role.Teacher),
    this.user(developmentIdentityIds.teacher3B, developmentIdentityIds.demoSchool, 'Jordan Lee', 'jordan.lee@example.test', Role.Teacher),
    this.user(developmentIdentityIds.parentAmy, developmentIdentityIds.demoSchool, 'Amy Wong', 'amy.wong@example.test', Role.ParentGuardian),
    this.user(developmentIdentityIds.parentBen, developmentIdentityIds.demoSchool, 'Ben Wong', 'ben.wong@example.test', Role.ParentGuardian),
    this.user(developmentIdentityIds.studentChloeUser, developmentIdentityIds.demoSchool, 'Chloe Wong', 'chloe.wong@example.test', Role.Student),
    this.user(developmentIdentityIds.mediaOperator, developmentIdentityIds.demoSchool, 'Morgan Media', 'media.operator@example.test', Role.MediaOperator),
    this.user(developmentIdentityIds.otherTeacher, developmentIdentityIds.otherSchool, 'Other Teacher', 'other.teacher@example.test', Role.Teacher),
    this.user(developmentIdentityIds.otherParent, developmentIdentityIds.otherSchool, 'Other Guardian', 'other.guardian@example.test', Role.ParentGuardian),
  ];

  private readonly staffProfiles: StaffProfile[] = [
    { id: 'staff_principal', userId: developmentIdentityIds.principal, schoolId: developmentIdentityIds.demoSchool, jobTitle: 'Principal' },
    { id: 'staff_admin', userId: developmentIdentityIds.admin, schoolId: developmentIdentityIds.demoSchool, jobTitle: 'School Administrator' },
    { id: developmentIdentityIds.staffTeacher3A, userId: developmentIdentityIds.teacher3A, schoolId: developmentIdentityIds.demoSchool, staffNumber: 'T-3001', jobTitle: 'Class Teacher', department: 'Primary' },
    { id: 'staff_teacher_3b', userId: developmentIdentityIds.teacher3B, schoolId: developmentIdentityIds.demoSchool, staffNumber: 'T-3002', jobTitle: 'Teacher', department: 'Primary' },
    { id: developmentIdentityIds.staffOtherTeacher, userId: developmentIdentityIds.otherTeacher, schoolId: developmentIdentityIds.otherSchool, jobTitle: 'Teacher' },
  ];

  private readonly guardianProfiles: GuardianProfile[] = [
    { id: 'guardian_amy', userId: developmentIdentityIds.parentAmy, schoolId: developmentIdentityIds.demoSchool },
    { id: 'guardian_ben', userId: developmentIdentityIds.parentBen, schoolId: developmentIdentityIds.demoSchool },
    { id: 'guardian_other', userId: developmentIdentityIds.otherParent, schoolId: developmentIdentityIds.otherSchool },
  ];

  private readonly students: Student[] = [
    this.student(developmentIdentityIds.studentChloe, developmentIdentityIds.demoSchool, 'S-3001', 'Chloe', 'Wong', 'Chloe', 'year_3', developmentIdentityIds.studentChloeUser),
    this.student(developmentIdentityIds.studentEthan, developmentIdentityIds.demoSchool, 'S-1001', 'Ethan', 'Wong', undefined, 'year_1'),
    this.student(developmentIdentityIds.studentMaya, developmentIdentityIds.demoSchool, 'S-3002', 'Maya', 'Patel', undefined, 'year_3'),
    this.student(developmentIdentityIds.studentNoah, developmentIdentityIds.demoSchool, 'S-3003', 'Noah', 'Smith', undefined, 'year_3'),
    this.student(developmentIdentityIds.otherStudent, developmentIdentityIds.otherSchool, 'OS-1001', 'Sam', 'Example', undefined, 'year_other'),
  ];

  private readonly classes: Class[] = [
    { id: developmentIdentityIds.class1B, schoolId: developmentIdentityIds.demoSchool, yearGroupId: 'year_1', name: '1B', academicYear: '2026', status: ClassStatus.Active },
    { id: developmentIdentityIds.class3A, schoolId: developmentIdentityIds.demoSchool, yearGroupId: 'year_3', name: '3A', academicYear: '2026', status: ClassStatus.Active },
    { id: developmentIdentityIds.class3B, schoolId: developmentIdentityIds.demoSchool, yearGroupId: 'year_3', name: '3B', academicYear: '2026', status: ClassStatus.Active },
    { id: developmentIdentityIds.otherClass, schoolId: developmentIdentityIds.otherSchool, yearGroupId: 'year_other', name: 'F1A', academicYear: '2026', status: ClassStatus.Active },
  ];

  private readonly classEnrollments: ClassEnrollment[] = [
    this.enrollment('enroll_chloe_3a', developmentIdentityIds.demoSchool, developmentIdentityIds.studentChloe, developmentIdentityIds.class3A),
    this.enrollment('enroll_ethan_1b', developmentIdentityIds.demoSchool, developmentIdentityIds.studentEthan, developmentIdentityIds.class1B),
    this.enrollment('enroll_maya_3a', developmentIdentityIds.demoSchool, developmentIdentityIds.studentMaya, developmentIdentityIds.class3A),
    this.enrollment('enroll_noah_3b', developmentIdentityIds.demoSchool, developmentIdentityIds.studentNoah, developmentIdentityIds.class3B),
    this.enrollment('enroll_other', developmentIdentityIds.otherSchool, developmentIdentityIds.otherStudent, developmentIdentityIds.otherClass),
  ];

  private readonly guardianStudentLinks: GuardianStudentLink[] = [
    this.guardianLink('link_amy_chloe', developmentIdentityIds.demoSchool, developmentIdentityIds.parentAmy, developmentIdentityIds.studentChloe, GuardianRelationshipType.Mother, true),
    this.guardianLink('link_amy_ethan', developmentIdentityIds.demoSchool, developmentIdentityIds.parentAmy, developmentIdentityIds.studentEthan, GuardianRelationshipType.Mother, true),
    this.guardianLink('link_ben_chloe', developmentIdentityIds.demoSchool, developmentIdentityIds.parentBen, developmentIdentityIds.studentChloe, GuardianRelationshipType.Father, false),
  ];

  private readonly staffClassAssignments: StaffClassAssignment[] = [
    this.staffAssignment('assign_teacher_3a', developmentIdentityIds.demoSchool, developmentIdentityIds.staffTeacher3A, developmentIdentityIds.teacher3A, developmentIdentityIds.class3A, StaffClassAssignmentType.ClassTeacher),
    this.staffAssignment('assign_teacher_3b', developmentIdentityIds.demoSchool, 'staff_teacher_3b', developmentIdentityIds.teacher3B, developmentIdentityIds.class3B, StaffClassAssignmentType.ClassTeacher),
  ];

  getSnapshot(): IdentitySnapshot {
    return {
      schools: [...this.schools],
      users: [...this.users],
      staffProfiles: [...this.staffProfiles],
      guardianProfiles: [...this.guardianProfiles],
      students: [...this.students],
      yearGroups: [...this.yearGroups],
      classes: [...this.classes],
      classEnrollments: [...this.classEnrollments],
      guardianStudentLinks: [...this.guardianStudentLinks],
      staffClassAssignments: [...this.staffClassAssignments],
    };
  }

  createStudent(input: StudentInput): Student {
    const timestamp = new Date().toISOString();
    const student: Student = {
      id: this.nextId('student'),
      schoolId: input.schoolId,
      studentNumber: input.studentNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      preferredName: input.preferredName || undefined,
      status: StudentStatus.Active,
      yearGroupId: input.yearGroupId || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.students.push(student);
    return student;
  }

  createStaffUser(input: StaffUserInput): User {
    const user = this.user(this.nextId('user'), input.schoolId, input.displayName, input.email, input.role);
    const profile: StaffProfile = {
      id: this.nextId('staff'),
      userId: user.id,
      schoolId: input.schoolId,
      staffNumber: input.staffNumber || undefined,
      jobTitle: input.jobTitle || undefined,
      department: input.department || undefined,
    };
    this.users.push(user);
    this.staffProfiles.push(profile);
    return user;
  }

  createGuardianUser(input: GuardianUserInput): User {
    const user = this.user(this.nextId('user'), input.schoolId, input.displayName, input.email, Role.ParentGuardian);
    this.users.push(user);
    this.guardianProfiles.push({ id: this.nextId('guardian'), userId: user.id, schoolId: input.schoolId });
    return user;
  }

  createClass(input: ClassInput): Class {
    const schoolClass: Class = {
      id: this.nextId('class'),
      schoolId: input.schoolId,
      yearGroupId: input.yearGroupId || undefined,
      name: input.name,
      academicYear: input.academicYear || undefined,
      status: ClassStatus.Active,
    };
    this.classes.push(schoolClass);
    return schoolClass;
  }

  createGuardianStudentLink(input: GuardianLinkInput): GuardianStudentLink {
    const link = this.guardianLink(
      this.nextId('guardian_link'),
      input.schoolId,
      input.guardianUserId,
      input.studentId,
      input.relationshipType,
      input.isPrimary,
    );
    this.guardianStudentLinks.push(link);
    return link;
  }

  createStaffClassAssignment(input: StaffAssignmentInput): StaffClassAssignment {
    const assignment = this.staffAssignment(
      this.nextId('staff_class'),
      input.schoolId,
      input.staffProfileId,
      input.staffUserId,
      input.classId,
      input.assignmentType,
    );
    this.staffClassAssignments.push(assignment);
    return assignment;
  }

  createClassEnrollment(input: EnrollmentInput): ClassEnrollment {
    const enrollment = this.enrollment(
      this.nextId('enrollment'),
      input.schoolId,
      input.studentId,
      input.classId,
      input.startDate,
    );
    this.classEnrollments.push(enrollment);
    return enrollment;
  }

  nextId(prefix: string): EntityId {
    this.idCounter += 1;
    return `${prefix}_${this.idCounter.toString().padStart(4, '0')}`;
  }

  private user(id: EntityId, schoolId: EntityId, displayName: string, email: string, role: Role): User {
    return { id, schoolId, displayName, email, status: UserStatus.Active, role, createdAt, updatedAt: createdAt };
  }

  private student(
    id: EntityId,
    schoolId: EntityId,
    studentNumber: string,
    firstName: string,
    lastName: string,
    preferredName: string | undefined,
    yearGroupId: EntityId,
    userId?: EntityId,
  ): Student {
    return { id, schoolId, studentNumber, firstName, lastName, preferredName, status: StudentStatus.Active, yearGroupId, userId, createdAt, updatedAt: createdAt };
  }

  private enrollment(id: EntityId, schoolId: EntityId, studentId: EntityId, classId: EntityId, startDate = '2026-08-26'): ClassEnrollment {
    return { id, schoolId, studentId, classId, startDate, status: EnrollmentStatus.Active };
  }

  private guardianLink(
    id: EntityId,
    schoolId: EntityId,
    guardianUserId: EntityId,
    studentId: EntityId,
    relationshipType: GuardianRelationshipType,
    isPrimary: boolean,
  ): GuardianStudentLink {
    return { id, schoolId, guardianUserId, studentId, relationshipType, isPrimary, status: RelationshipStatus.Active };
  }

  private staffAssignment(
    id: EntityId,
    schoolId: EntityId,
    staffProfileId: EntityId,
    staffUserId: EntityId,
    classId: EntityId,
    assignmentType: StaffClassAssignmentType,
  ): StaffClassAssignment {
    return { id, schoolId, staffProfileId, staffUserId, classId, assignmentType };
  }
}
