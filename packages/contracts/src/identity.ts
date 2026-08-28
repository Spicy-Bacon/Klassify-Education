export type EntityId = string;
export type ISODate = string;
export type ISODateTime = string;

export enum SchoolStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pilot = 'pilot',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
  Suspended = 'suspended',
}

export enum Role {
  SchoolOwner = 'school_owner',
  Principal = 'principal',
  SchoolAdmin = 'school_admin',
  ItAdmin = 'it_admin',
  Teacher = 'teacher',
  Staff = 'staff',
  ParentGuardian = 'parent_guardian',
  Student = 'student',
  MediaOperator = 'media_operator',
  ExternalService = 'external_service',
}

export enum StudentStatus {
  Active = 'active',
  Inactive = 'inactive',
  Graduated = 'graduated',
  Withdrawn = 'withdrawn',
}

export enum ClassStatus {
  Active = 'active',
  Inactive = 'inactive',
  Archived = 'archived',
}

export enum EnrollmentStatus {
  Active = 'active',
  Ended = 'ended',
}

export enum RelationshipStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum GuardianRelationshipType {
  Mother = 'mother',
  Father = 'father',
  Guardian = 'guardian',
  Other = 'other',
}

export enum StaffClassAssignmentType {
  ClassTeacher = 'class_teacher',
  SubjectTeacher = 'subject_teacher',
  Assistant = 'assistant',
  Other = 'other',
}

export enum Permission {
  SchoolManageUsers = 'school.manage_users',
  SchoolManageSettings = 'school.manage_settings',
  UsersView = 'users.view',
  ClassesView = 'classes.view',
  ClassesManage = 'classes.manage',
  StudentsView = 'students.view',
  AnnouncementsCreate = 'announcements.create',
  AnnouncementsPublish = 'announcements.publish',
  FormsCreate = 'forms.create',
  AttendanceManage = 'attendance.manage',
  MediaUpload = 'media.upload',
  MediaManage = 'media.manage',
  MediaPublish = 'media.publish',
}

export enum AnnouncementStatus {
  Draft = 'draft',
  Scheduled = 'scheduled',
  Published = 'published',
  Archived = 'archived',
}

export enum AnnouncementAudienceType {
  School = 'school',
  YearGroup = 'year_group',
  Class = 'class',
  Users = 'users',
}

export enum AnnouncementRecipientGroup {
  ParentGuardians = 'parent_guardians',
  Students = 'students',
  Staff = 'staff',
}

export enum DomainErrorCode {
  NotFound = 'NotFound',
  PermissionDenied = 'PermissionDenied',
  InvalidRelationship = 'InvalidRelationship',
  DuplicateRelationship = 'DuplicateRelationship',
  ValidationError = 'ValidationError',
}

export interface DomainError {
  code: DomainErrorCode;
  message: string;
}

export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export interface School {
  id: EntityId;
  name: string;
  status: SchoolStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface User {
  id: EntityId;
  schoolId: EntityId;
  displayName: string;
  email: string;
  status: UserStatus;
  role: Role;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface StaffProfile {
  id: EntityId;
  userId: EntityId;
  schoolId: EntityId;
  staffNumber?: string;
  jobTitle?: string;
  department?: string;
}

export interface GuardianProfile {
  id: EntityId;
  userId: EntityId;
  schoolId: EntityId;
}

export interface Student {
  id: EntityId;
  schoolId: EntityId;
  studentNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  status: StudentStatus;
  yearGroupId?: EntityId;
  userId?: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface YearGroup {
  id: EntityId;
  schoolId: EntityId;
  name: string;
  sortOrder: number;
}

export interface Class {
  id: EntityId;
  schoolId: EntityId;
  yearGroupId?: EntityId;
  name: string;
  academicYear?: string;
  status: ClassStatus;
}

export interface ClassEnrollment {
  id: EntityId;
  schoolId: EntityId;
  studentId: EntityId;
  classId: EntityId;
  startDate?: ISODate;
  endDate?: ISODate;
  status: EnrollmentStatus;
}

export interface StaffClassAssignment {
  id: EntityId;
  schoolId: EntityId;
  staffProfileId: EntityId;
  staffUserId: EntityId;
  classId: EntityId;
  assignmentType: StaffClassAssignmentType;
}

export interface GuardianStudentLink {
  id: EntityId;
  schoolId: EntityId;
  guardianUserId: EntityId;
  studentId: EntityId;
  relationshipType: GuardianRelationshipType;
  isPrimary: boolean;
  status: RelationshipStatus;
}

export interface AuthenticatedUserContext {
  userId: EntityId;
  schoolId: EntityId;
  role: Role;
  studentId?: EntityId;
  explicitPermissions?: Permission[];
}

export interface ResourceContext {
  schoolId: EntityId;
  classId?: EntityId;
  studentId?: EntityId;
}

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
}

export interface AnnouncementAudience {
  type: AnnouncementAudienceType;
  targetIds: EntityId[];
}

export interface AnnouncementAttachment {
  id: EntityId;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageReference?: string;
}

export interface Announcement {
  id: EntityId;
  schoolId: EntityId;
  title: string;
  body: string;
  status: AnnouncementStatus;
  authorUserId: EntityId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  publishedAt?: ISODateTime;
  scheduledFor?: ISODateTime;
  audience: AnnouncementAudience[];
  recipientGroups: AnnouncementRecipientGroup[];
  attachments?: AnnouncementAttachment[];
}

export interface AnnouncementRecipient {
  id: EntityId;
  announcementId: EntityId;
  schoolId: EntityId;
  userId: EntityId;
  recipientGroup: AnnouncementRecipientGroup;
  deliveredAt?: ISODateTime;
  readAt?: ISODateTime;
}
