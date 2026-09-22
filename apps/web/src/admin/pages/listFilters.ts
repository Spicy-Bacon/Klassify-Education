import type { User } from '@klassify/contracts';
import type { ClassSummary, GuardianSummary, StaffSummary, StudentSummary } from '../../identity/identityTypes';
import { studentName } from './pageUtils';

export interface StudentFilters {
  classId: string;
  query: string;
  status: string;
  yearGroupId: string;
}

export function filterStudents(students: StudentSummary[], filters: StudentFilters): StudentSummary[] {
  return students.filter((summary) => (
    matchesText([
      studentName(summary),
      summary.student.studentNumber,
      summary.yearGroup?.name,
      summary.className,
      summary.student.status,
    ], filters.query)
    && matchesOptional(summary.yearGroup?.id, filters.yearGroupId)
    && matchesOptional(summary.classId, filters.classId)
    && matchesOptional(summary.student.status, filters.status)
  ));
}

export function filterGuardians(guardians: GuardianSummary[], query: string): GuardianSummary[] {
  return guardians.filter((guardian) => matchesText([
    guardian.user.displayName,
    guardian.user.email,
    guardian.user.status,
    ...guardian.linkedChildren.flatMap((child) => [
      studentName(child),
      child.className,
      child.relationshipType,
      child.isPrimary ? 'primary' : undefined,
    ]),
  ], query));
}

export function filterStaff(staff: StaffSummary[], query: string): StaffSummary[] {
  return staff.filter((summary) => matchesText([
    summary.user.displayName,
    summary.user.role,
    summary.user.status,
    summary.profile?.jobTitle,
    summary.profile?.department,
    ...summary.assignedClassNames,
  ], query));
}

export function filterClasses(classes: ClassSummary[], query: string): ClassSummary[] {
  return classes.filter((summary) => matchesText([
    summary.class.name,
    summary.class.status,
    summary.class.academicYear,
    summary.yearGroup?.name,
    ...summary.students.map((student) => `${student.firstName} ${student.lastName}`),
    ...summary.teachers.map((teacher) => teacher.displayName),
  ], query));
}

export function filterUsers(users: User[], query: string): User[] {
  return users.filter((user) => matchesText([
    user.displayName,
    user.email,
    user.role,
    user.status,
  ], query));
}

function matchesOptional(value: string | undefined, selected: string): boolean {
  return !selected || value === selected;
}

function matchesText(values: Array<string | undefined>, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalize(value).includes(normalizedQuery));
}

function normalize(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? '';
}
