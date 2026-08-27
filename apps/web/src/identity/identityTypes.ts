import type {
  AuthenticatedUserContext,
  Class,
  EntityId,
  GuardianRelationshipType,
  School,
  StaffProfile,
  Student,
  User,
  YearGroup,
} from '@ai-school-platform/contracts';
import { Role, StaffClassAssignmentType } from '@ai-school-platform/contracts';
import type { IdentityService } from './identityService';

export interface IdentityOption {
  id: EntityId;
  label: string;
}

export interface ConfiguredIdentityApplication {
  mode: 'development';
  identityService: IdentityService;
  initialUserId: EntityId;
  identityOptions: IdentityOption[];
  allowIdentitySwitching: true;
}

export interface UnconfiguredIdentityApplication {
  mode: 'production-unconfigured';
  identityService?: never;
  initialUserId?: never;
  identityOptions: [];
  allowIdentitySwitching: false;
}

export type IdentityApplication = ConfiguredIdentityApplication | UnconfiguredIdentityApplication;

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
  role: StaffUserRole;
  staffNumber?: string;
  jobTitle?: string;
  department?: string;
}

export type StaffUserRole =
  | Role.Teacher
  | Role.Staff
  | Role.SchoolAdmin
  | Role.ItAdmin
  | Role.Principal;

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

export interface AssignableTeacher {
  user: User;
  profile: StaffProfile;
}

export interface AdminOverviewMetric {
  label: string;
  value: number;
}

export interface AdminOverview {
  school?: School;
  metrics: AdminOverviewMetric[];
  classes: ClassSummary[];
  canUseManagementActions: boolean;
}

export type AdminSectionId = 'overview' | 'users' | 'students' | 'parents' | 'staff' | 'classes';
