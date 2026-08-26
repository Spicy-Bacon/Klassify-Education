import type {
  Class,
  ClassEnrollment,
  EntityId,
  GuardianProfile,
  GuardianStudentLink,
  School,
  StaffClassAssignment,
  StaffProfile,
  Student,
  User,
  YearGroup,
} from '../../../../packages/contracts/src';
import type {
  ClassInput,
  EnrollmentInput,
  GuardianLinkInput,
  GuardianUserInput,
  StaffAssignmentInput,
  StaffUserInput,
  StudentInput,
} from './identityService';

export interface IdentitySnapshot {
  schools: School[];
  users: User[];
  staffProfiles: StaffProfile[];
  guardianProfiles: GuardianProfile[];
  students: Student[];
  yearGroups: YearGroup[];
  classes: Class[];
  classEnrollments: ClassEnrollment[];
  guardianStudentLinks: GuardianStudentLink[];
  staffClassAssignments: StaffClassAssignment[];
}

export interface IdentityRepository {
  getSnapshot(): IdentitySnapshot;
  createStudent(input: StudentInput): Student;
  createStaffUser(input: StaffUserInput): User;
  createGuardianUser(input: GuardianUserInput): User;
  createClass(input: ClassInput): Class;
  createGuardianStudentLink(input: GuardianLinkInput): GuardianStudentLink;
  createStaffClassAssignment(input: StaffAssignmentInput): StaffClassAssignment;
  createClassEnrollment(input: EnrollmentInput): ClassEnrollment;
  nextId(prefix: string): EntityId;
}
