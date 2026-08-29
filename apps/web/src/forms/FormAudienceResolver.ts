import {
  EnrollmentStatus,
  FormAudienceType,
  RelationshipStatus,
  Role,
  StudentStatus,
  type EntityId,
  type FormAudience,
} from '@ai-school-platform/contracts';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { FormRecipientResolution, ResolvedFormRecipient } from './formTypes';

export class FormAudienceResolver {
  resolve(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    audiences: FormAudience[],
    requiresChildContext: boolean,
  ): FormRecipientResolution {
    const targetStudentIds = requiresChildContext || audiences.some((audience) => audience.type !== FormAudienceType.School)
      ? this.resolveTargetStudentIds(snapshot, schoolId, audiences)
      : [];

    const recipients = requiresChildContext
      ? this.resolveChildLevelRecipients(snapshot, schoolId, targetStudentIds)
      : this.resolveParentLevelRecipients(snapshot, schoolId, audiences, targetStudentIds);

    const studentIds = new Set(recipients.map((recipient) => recipient.studentId).filter(isDefined));
    const guardianIds = new Set(recipients.map((recipient) => recipient.userId));

    return {
      recipients,
      parentGuardianCount: guardianIds.size,
      studentCount: studentIds.size,
      taskCount: recipients.length,
    };
  }

  private resolveTargetStudentIds(snapshot: IdentitySnapshot, schoolId: EntityId, audiences: FormAudience[]): EntityId[] {
    const studentIds = new Set<EntityId>();

    for (const audience of audiences) {
      if (audience.type === FormAudienceType.School) {
        snapshot.students
          .filter((student) => student.schoolId === schoolId && student.status === StudentStatus.Active)
          .forEach((student) => studentIds.add(student.id));
      }

      if (audience.type === FormAudienceType.YearGroup) {
        snapshot.students
          .filter((student) => student.schoolId === schoolId && student.status === StudentStatus.Active)
          .filter((student) => student.yearGroupId && audience.targetIds.includes(student.yearGroupId))
          .forEach((student) => studentIds.add(student.id));
      }

      if (audience.type === FormAudienceType.Class) {
        snapshot.classEnrollments
          .filter((enrollment) => enrollment.schoolId === schoolId && enrollment.status === EnrollmentStatus.Active)
          .filter((enrollment) => audience.targetIds.includes(enrollment.classId))
          .forEach((enrollment) => {
            const student = snapshot.students.find((candidate) => (
              candidate.id === enrollment.studentId
              && candidate.schoolId === schoolId
              && candidate.status === StudentStatus.Active
            ));
            if (student) {
              studentIds.add(student.id);
            }
          });
      }
    }

    return [...studentIds];
  }

  private resolveChildLevelRecipients(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    targetStudentIds: EntityId[],
  ): ResolvedFormRecipient[] {
    const recipients = new Map<string, ResolvedFormRecipient>();

    for (const studentId of targetStudentIds) {
      snapshot.guardianStudentLinks
        .filter((link) => link.schoolId === schoolId && link.studentId === studentId && link.status === RelationshipStatus.Active)
        .forEach((link) => {
          const guardian = snapshot.users.find((user) => user.id === link.guardianUserId && user.schoolId === schoolId && user.role === Role.ParentGuardian);
          if (guardian) {
            recipients.set(`${guardian.id}:${studentId}`, { userId: guardian.id, studentId });
          }
        });
    }

    return [...recipients.values()];
  }

  private resolveParentLevelRecipients(
    snapshot: IdentitySnapshot,
    schoolId: EntityId,
    audiences: FormAudience[],
    targetStudentIds: EntityId[],
  ): ResolvedFormRecipient[] {
    const guardianIds = new Set<EntityId>();

    const wholeSchool = audiences.some((audience) => audience.type === FormAudienceType.School);
    if (wholeSchool) {
      snapshot.users
        .filter((user) => user.schoolId === schoolId && user.role === Role.ParentGuardian)
        .forEach((user) => guardianIds.add(user.id));
    }

    for (const studentId of targetStudentIds) {
      snapshot.guardianStudentLinks
        .filter((link) => link.schoolId === schoolId && link.studentId === studentId && link.status === RelationshipStatus.Active)
        .forEach((link) => guardianIds.add(link.guardianUserId));
    }

    return [...guardianIds]
      .filter((guardianId) => snapshot.users.some((user) => user.id === guardianId && user.schoolId === schoolId && user.role === Role.ParentGuardian))
      .map((userId) => ({ userId }));
  }
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}