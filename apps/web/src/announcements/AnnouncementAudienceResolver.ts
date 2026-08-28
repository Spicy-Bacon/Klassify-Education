import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  EnrollmentStatus,
  RelationshipStatus,
  Role,
  UserStatus,
  type AnnouncementAudience,
  type EntityId,
  type User,
} from '@ai-school-platform/contracts';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { RecipientResolution, ResolvedAnnouncementRecipient } from './announcementTypes';

const staffRoles = new Set<Role>([
  Role.SchoolOwner,
  Role.Principal,
  Role.SchoolAdmin,
  Role.ItAdmin,
  Role.Teacher,
  Role.Staff,
]);

export class AnnouncementAudienceResolver {
  resolve(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    audiences: AnnouncementAudience[],
    recipientGroups: AnnouncementRecipientGroup[],
  ): RecipientResolution {
    const recipients = new Map<EntityId, ResolvedAnnouncementRecipient>();

    for (const audience of audiences) {
      for (const group of recipientGroups) {
        for (const user of this.resolveUsersForAudience(snapshot, schoolId, audience, group)) {
          if (!recipients.has(user.id)) {
            recipients.set(user.id, { userId: user.id, recipientGroup: group });
          }
        }
      }
    }

    const uniqueRecipients = [...recipients.values()];
    const countsByGroup = {
      [AnnouncementRecipientGroup.ParentGuardians]: uniqueRecipients.filter((recipient) => recipient.recipientGroup === AnnouncementRecipientGroup.ParentGuardians).length,
      [AnnouncementRecipientGroup.Students]: uniqueRecipients.filter((recipient) => recipient.recipientGroup === AnnouncementRecipientGroup.Students).length,
      [AnnouncementRecipientGroup.Staff]: uniqueRecipients.filter((recipient) => recipient.recipientGroup === AnnouncementRecipientGroup.Staff).length,
    };

    return {
      recipients: uniqueRecipients,
      countsByGroup,
      uniqueRecipientCount: uniqueRecipients.length,
    };
  }

  private resolveUsersForAudience(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    audience: AnnouncementAudience,
    recipientGroup: AnnouncementRecipientGroup,
  ): User[] {
    if (audience.type === AnnouncementAudienceType.School) {
      return this.usersForSchool(snapshot, schoolId, recipientGroup);
    }

    if (audience.type === AnnouncementAudienceType.YearGroup) {
      const classIds = snapshot.classes
        .filter((schoolClass) => schoolClass.schoolId === schoolId && schoolClass.yearGroupId && audience.targetIds.includes(schoolClass.yearGroupId))
        .map((schoolClass) => schoolClass.id);
      return this.usersForClasses(snapshot, schoolId, classIds, recipientGroup);
    }

    if (audience.type === AnnouncementAudienceType.Class) {
      return this.usersForClasses(snapshot, schoolId, audience.targetIds, recipientGroup);
    }

    return snapshot.users.filter((user) => (
      user.schoolId === schoolId
      && user.status === UserStatus.Active
      && audience.targetIds.includes(user.id)
      && isUserInRecipientGroup(user, recipientGroup)
    ));
  }

  private usersForSchool(snapshot: IdentitySnapshot, schoolId: EntityId, recipientGroup: AnnouncementRecipientGroup): User[] {
    return snapshot.users.filter((user) => (
      user.schoolId === schoolId
      && user.status === UserStatus.Active
      && isUserInRecipientGroup(user, recipientGroup)
    ));
  }

  private usersForClasses(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    classIds: EntityId[],
    recipientGroup: AnnouncementRecipientGroup,
  ): User[] {
    const activeStudentIds = snapshot.classEnrollments
      .filter((enrollment) => enrollment.schoolId === schoolId && classIds.includes(enrollment.classId) && enrollment.status === EnrollmentStatus.Active)
      .map((enrollment) => enrollment.studentId);

    if (recipientGroup === AnnouncementRecipientGroup.Students) {
      return snapshot.students
        .filter((student) => student.schoolId === schoolId && activeStudentIds.includes(student.id) && student.userId)
        .map((student) => snapshot.users.find((user) => user.id === student.userId && user.schoolId === schoolId && user.status === UserStatus.Active))
        .filter(isDefined);
    }

    if (recipientGroup === AnnouncementRecipientGroup.ParentGuardians) {
      const guardianUserIds = snapshot.guardianStudentLinks
        .filter((link) => link.schoolId === schoolId && activeStudentIds.includes(link.studentId) && link.status === RelationshipStatus.Active)
        .map((link) => link.guardianUserId);
      return snapshot.users.filter((user) => (
        user.schoolId === schoolId
        && user.status === UserStatus.Active
        && user.role === Role.ParentGuardian
        && guardianUserIds.includes(user.id)
      ));
    }

    const staffUserIds = snapshot.staffClassAssignments
      .filter((assignment) => assignment.schoolId === schoolId && classIds.includes(assignment.classId))
      .map((assignment) => assignment.staffUserId);
    return snapshot.users.filter((user) => (
      user.schoolId === schoolId
      && user.status === UserStatus.Active
      && staffRoles.has(user.role)
      && staffUserIds.includes(user.id)
    ));
  }
}

export function isUserInRecipientGroup(user: User, recipientGroup: AnnouncementRecipientGroup): boolean {
  if (recipientGroup === AnnouncementRecipientGroup.ParentGuardians) {
    return user.role === Role.ParentGuardian;
  }

  if (recipientGroup === AnnouncementRecipientGroup.Students) {
    return user.role === Role.Student;
  }

  return staffRoles.has(user.role);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
