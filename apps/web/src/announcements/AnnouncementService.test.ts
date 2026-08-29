import { describe, expect, it } from 'vitest';
import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  AnnouncementStatus,
  DomainErrorCode,
  type AuthenticatedUserContext,
} from '@klassify/contracts';
import { DevelopmentIdentityRepository, developmentIdentityIds } from '../identity/developmentIdentityRepository';
import { IdentityService } from '../identity/identityService';
import { DevelopmentAnnouncementRepository } from './DevelopmentAnnouncementRepository';
import { developmentAnnouncementIds } from './DevelopmentAnnouncementRepository';
import { AnnouncementService } from './AnnouncementService';

function createServices() {
  const identityRepository = new DevelopmentIdentityRepository();
  const identityService = new IdentityService(identityRepository);
  const announcementRepository = new DevelopmentAnnouncementRepository();
  const announcementService = new AnnouncementService(announcementRepository, identityService);

  return { announcementService, identityService };
}

function contextFor(identityService: IdentityService, userId: string): AuthenticatedUserContext {
  const result = identityService.createUserContext(userId);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

function readershipValue(result: ReturnType<AnnouncementService['getAuthorizedReadershipSummary']>) {
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}
function validClassAnnouncement(context: AuthenticatedUserContext) {
  return {
    schoolId: developmentIdentityIds.demoSchool,
    title: 'Development Class Notice',
    body: 'This is a fictional development announcement for class families.',
    authorUserId: context.userId,
    audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
    recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
  };
}

describe('AnnouncementService domain foundation', () => {
  it('creates a valid draft', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const result = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(result.ok).toBe(true);
    expect(result.ok ? result.value.title : undefined).toBe('Development Class Notice');
  });

  it('rejects cross-school class targets', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const result = announcementService.createDraft(adminContext, {
      ...validClassAnnouncement(adminContext),
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.otherClass] }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.InvalidRelationship);
  });

  it('rejects cross-school selected-user targets', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const result = announcementService.createDraft(adminContext, {
      ...validClassAnnouncement(adminContext),
      audience: [{ type: AnnouncementAudienceType.Users, targetIds: [developmentIdentityIds.otherParent] }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.InvalidRelationship);
  });

  it('allows a teacher to target an assigned class', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);

    const result = announcementService.createDraft(teacherContext, validClassAnnouncement(teacherContext));

    expect(result.ok).toBe(true);
  });

  it('prevents a teacher from targeting an unassigned class', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);

    const result = announcementService.createDraft(teacherContext, {
      ...validClassAnnouncement(teacherContext),
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents a teacher from publishing a whole-school announcement', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);

    const result = announcementService.createDraft(teacherContext, {
      ...validClassAnnouncement(teacherContext),
      audience: [{ type: AnnouncementAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.message).toBe('Teachers may only target assigned classes in this phase.');
  });

  it('allows an administrator to publish a school-wide announcement', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Development School Notice',
      body: 'This is a fictional whole-school development announcement.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians, AnnouncementRecipientGroup.Staff],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);

    expect(published.ok).toBe(true);
    expect(readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, draft.value.id)).delivered).toBeGreaterThan(0);
  });

  it('prevents a parent from publishing announcements', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    const result = announcementService.createDraft(parentContext, validClassAnnouncement(parentContext));

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents a student from publishing announcements', () => {
    const { announcementService, identityService } = createServices();
    const studentContext = contextFor(identityService, developmentIdentityIds.studentChloeUser);

    const result = announcementService.createDraft(studentContext, validClassAnnouncement(studentContext));

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('removes duplicate recipients resolved from overlapping audiences', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Development Family Notice',
      body: 'This is a fictional notice for families in two classes.',
      authorUserId: adminContext.userId,
      audience: [
        { type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3A] },
        { type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class1B] },
      ],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);

    expect(published.ok).toBe(true);
    expect(readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, draft.value.id)).delivered).toBe(2);
  });

  it('resolves guardian recipients for a class announcement', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const preview = announcementService.previewRecipients(adminContext, validClassAnnouncement(adminContext));

    expect(preview.ok).toBe(true);
    expect(preview.ok ? preview.value.countsByGroup.parent_guardians : undefined).toBe(2);
  });

  it('resolves student recipients for a class announcement when student users exist', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const preview = announcementService.previewRecipients(adminContext, {
      ...validClassAnnouncement(adminContext),
      recipientGroups: [AnnouncementRecipientGroup.Students],
    });

    expect(preview.ok).toBe(true);
    expect(preview.ok ? preview.value.countsByGroup.students : undefined).toBe(1);
  });

  it('resolves staff recipients assigned to a class', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const preview = announcementService.previewRecipients(adminContext, {
      ...validClassAnnouncement(adminContext),
      recipientGroups: [AnnouncementRecipientGroup.Staff],
    });

    expect(preview.ok).toBe(true);
    expect(preview.ok ? preview.value.countsByGroup.staff : undefined).toBe(1);
  });
});

describe('AnnouncementService administration views', () => {
  it('exposes announcement navigation to administrators and teachers only', () => {
    const { identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    expect(identityService.getVisibleAdminSections(adminContext)).toContain('announcements');
    expect(identityService.getVisibleAdminSections(teacherContext)).toContain('announcements');
    expect(identityService.canAccessAdminSection(parentContext, 'announcements').ok).toBe(false);
  });

  it('shows school-wide announcement lists to school administrators', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const announcements = announcementService.getVisibleAnnouncements(adminContext);

    expect(announcements.map((item) => item.announcement.id).sort()).toEqual([
      developmentAnnouncementIds.holidayNotice,
      developmentAnnouncementIds.museumTrip,
      developmentAnnouncementIds.sportsDay,
    ].sort());
  });

  it('scopes teacher announcement lists to authored or assigned-class announcements', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);

    const announcements = announcementService.getVisibleAnnouncements(teacherContext);

    expect(announcements.map((item) => item.announcement.id).sort()).toEqual([
      developmentAnnouncementIds.museumTrip,
      developmentAnnouncementIds.sportsDay,
    ].sort());
  });

  it('keeps announcement lists isolated by school', () => {
    const { announcementService, identityService } = createServices();
    const otherTeacherContext = contextFor(identityService, developmentIdentityIds.otherTeacher);

    expect(announcementService.getVisibleAnnouncements(otherTeacherContext)).toEqual([]);
  });

  it('returns permission denied for protected announcement detail access', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    const result = announcementService.getAnnouncementById(parentContext, developmentAnnouncementIds.sportsDay);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });
});

describe('AnnouncementService drafting workflow', () => {
  it('saves and updates an administrator draft', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const updated = announcementService.updateDraft(adminContext, draft.value.id, {
      title: 'Updated Development Class Notice',
      body: 'Updated fictional development message.',
    });

    expect(updated.ok).toBe(true);
    expect(updated.ok ? updated.value.title : undefined).toBe('Updated Development Class Notice');
  });

  it('saves a teacher draft for an assigned class', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);

    const draft = announcementService.createDraft(teacherContext, validClassAnnouncement(teacherContext));

    expect(draft.ok).toBe(true);
    expect(draft.ok ? draft.value.audience[0]?.targetIds : []).toEqual([developmentIdentityIds.class3A]);
  });

  it('rejects an invalid publishable draft during recipient preview', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const preview = announcementService.previewRecipients(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Incomplete Development Notice',
      body: 'This draft is intentionally incomplete.',
      authorUserId: adminContext.userId,
      audience: [],
      recipientGroups: [],
    });

    expect(preview.ok).toBe(false);
    expect(preview.ok ? undefined : preview.error.code).toBe(DomainErrorCode.ValidationError);
  });
});



describe('AnnouncementService hardening', () => {
  it('prevents Teacher A from editing Teacher B draft', () => {
    const { announcementService, identityService } = createServices();
    const teacherA = contextFor(identityService, developmentIdentityIds.teacher3A);
    const teacherB = contextFor(identityService, developmentIdentityIds.teacher3B);
    const draft = announcementService.createDraft(teacherB, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Teacher B Development Notice',
      body: 'Fictional development draft for Class 3B.',
      authorUserId: teacherB.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.updateDraft(teacherA, draft.value.id, { title: 'Blocked edit' });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents Teacher A from publishing Teacher B draft', () => {
    const { announcementService, identityService } = createServices();
    const teacherA = contextFor(identityService, developmentIdentityIds.teacher3A);
    const teacherB = contextFor(identityService, developmentIdentityIds.teacher3B);
    const draft = announcementService.createDraft(teacherB, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Teacher B Publish Notice',
      body: 'Fictional development draft for Class 3B.',
      authorUserId: teacherB.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.publishAnnouncement(teacherA, draft.value.id);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents Teacher A from scheduling Teacher B draft', () => {
    const { announcementService, identityService } = createServices();
    const teacherA = contextFor(identityService, developmentIdentityIds.teacher3A);
    const teacherB = contextFor(identityService, developmentIdentityIds.teacher3B);
    const draft = announcementService.createDraft(teacherB, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Teacher B Schedule Notice',
      body: 'Fictional development draft for Class 3B.',
      authorUserId: teacherB.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.scheduleAnnouncement(teacherA, draft.value.id, { scheduledFor: '2099-09-01T09:00:00.000Z' });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents Teacher A from cancelling Teacher B scheduled announcement', () => {
    const { announcementService, identityService } = createServices();
    const teacherA = contextFor(identityService, developmentIdentityIds.teacher3A);
    const teacherB = contextFor(identityService, developmentIdentityIds.teacher3B);
    const draft = announcementService.createDraft(teacherB, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Teacher B Scheduled Notice',
      body: 'Fictional development draft for Class 3B.',
      authorUserId: teacherB.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
      recipientGroups: [AnnouncementRecipientGroup.Staff],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const scheduled = announcementService.scheduleAnnouncement(teacherB, draft.value.id, { scheduledFor: '2099-09-01T09:00:00.000Z' });
    expect(scheduled.ok).toBe(true);

    const result = announcementService.cancelSchedule(teacherA, draft.value.id);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('prevents teachers from managing administrator school-wide announcements', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);
    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Administrator Development Notice',
      body: 'Fictional whole-school draft.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
      recipientGroups: [AnnouncementRecipientGroup.Staff],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.publishAnnouncement(teacherContext, draft.value.id);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('allows administrators to manage same-school announcements', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(teacherContext, validClassAnnouncement(teacherContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.publishAnnouncement(adminContext, draft.value.id);

    expect(result.ok).toBe(true);
  });

  it('prevents cross-school admins from managing announcements', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const otherTeacherContext = contextFor(identityService, developmentIdentityIds.otherTeacher);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const result = announcementService.publishAnnouncement(otherTeacherContext, draft.value.id);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('rejects empty class, year group and selected-user audience targets', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const emptyClass = announcementService.createDraft(adminContext, {
      ...validClassAnnouncement(adminContext),
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [] }],
    });
    const emptyYearGroup = announcementService.createDraft(adminContext, {
      ...validClassAnnouncement(adminContext),
      audience: [{ type: AnnouncementAudienceType.YearGroup, targetIds: [] }],
    });
    const emptyUsers = announcementService.createDraft(adminContext, {
      ...validClassAnnouncement(adminContext),
      audience: [{ type: AnnouncementAudienceType.Users, targetIds: [] }],
    });

    expect(emptyClass.ok).toBe(false);
    expect(emptyYearGroup.ok).toBe(false);
    expect(emptyUsers.ok).toBe(false);
    expect(emptyClass.ok ? undefined : emptyClass.error.code).toBe(DomainErrorCode.ValidationError);
    expect(emptyYearGroup.ok ? undefined : emptyYearGroup.error.code).toBe(DomainErrorCode.ValidationError);
    expect(emptyUsers.ok ? undefined : emptyUsers.error.code).toBe(DomainErrorCode.ValidationError);
  });

  it('rejects scheduling announcements that resolve to zero recipients', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'No Recipient Development Notice',
      body: 'This selected user target cannot resolve to the requested group.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.Users, targetIds: [developmentIdentityIds.parentAmy] }],
      recipientGroups: [AnnouncementRecipientGroup.Students],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const scheduled = announcementService.scheduleAnnouncement(adminContext, draft.value.id, { scheduledFor: '2099-09-01T09:00:00.000Z' });

    expect(scheduled.ok).toBe(false);
    expect(scheduled.ok ? undefined : scheduled.error.code).toBe(DomainErrorCode.ValidationError);
  });

  it('requires authorization for readership summaries', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    const result = announcementService.getAuthorizedReadershipSummary(parentContext, developmentAnnouncementIds.sportsDay);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe(DomainErrorCode.PermissionDenied);
  });

  it('does not expose individual recipients on announcement detail', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const detail = announcementService.getAnnouncementById(adminContext, developmentAnnouncementIds.sportsDay);

    expect(detail.ok).toBe(true);
    expect(detail.ok ? detail.value.recipientPrivacy : undefined).toBe('aggregate_only');
    expect(detail.ok ? 'recipients' in detail.value : true).toBe(false);
  });
});



describe('AnnouncementService publishing workflow', () => {
  it('publishes a valid administrator announcement and creates recipient records', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);

    expect(published.ok).toBe(true);
    expect(published.ok ? published.value.status : undefined).toBe(AnnouncementStatus.Published);
    expect(readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, draft.value.id)).delivered).toBe(2);
  });

  it('allows a teacher to publish their own assigned-class announcement', () => {
    const { announcementService, identityService } = createServices();
    const teacherContext = contextFor(identityService, developmentIdentityIds.teacher3A);
    const draft = announcementService.createDraft(teacherContext, validClassAnnouncement(teacherContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(teacherContext, draft.value.id);

    expect(published.ok).toBe(true);
    expect(published.ok ? published.value.status : undefined).toBe(AnnouncementStatus.Published);
  });

  it('rejects publication when recipient resolution is empty', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'No Recipient Publish Notice',
      body: 'This fictional selected-user target cannot resolve to student recipients.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.Users, targetIds: [developmentIdentityIds.parentAmy] }],
      recipientGroups: [AnnouncementRecipientGroup.Students],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);

    expect(published.ok).toBe(false);
    expect(published.ok ? undefined : published.error.code).toBe(DomainErrorCode.ValidationError);
  });

  it('schedules a valid future announcement', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const scheduled = announcementService.scheduleAnnouncement(adminContext, draft.value.id, { scheduledFor: '2099-09-01T09:00:00.000Z' });

    expect(scheduled.ok).toBe(true);
    expect(scheduled.ok ? scheduled.value.status : undefined).toBe(AnnouncementStatus.Scheduled);
    expect(scheduled.ok ? scheduled.value.scheduledFor : undefined).toBe('2099-09-01T09:00:00.000Z');
  });

  it('rejects a past schedule timestamp', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const scheduled = announcementService.scheduleAnnouncement(adminContext, draft.value.id, { scheduledFor: '2020-01-01T09:00:00.000Z' });

    expect(scheduled.ok).toBe(false);
    expect(scheduled.ok ? undefined : scheduled.error.code).toBe(DomainErrorCode.ValidationError);
  });

  it('returns an authorised scheduled announcement to draft', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const scheduled = announcementService.scheduleAnnouncement(adminContext, draft.value.id, { scheduledFor: '2099-09-01T09:00:00.000Z' });
    expect(scheduled.ok).toBe(true);

    const cancelled = announcementService.cancelSchedule(adminContext, draft.value.id);

    expect(cancelled.ok).toBe(true);
    expect(cancelled.ok ? cancelled.value.status : undefined).toBe(AnnouncementStatus.Draft);
    expect(cancelled.ok ? cancelled.value.scheduledFor : 'unexpected').toBeUndefined();
  });

  it('keeps published announcement content read-only', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const draft = announcementService.createDraft(adminContext, validClassAnnouncement(adminContext));

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }

    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);
    expect(published.ok).toBe(true);

    const update = announcementService.updateDraft(adminContext, draft.value.id, { title: 'Blocked published edit' });

    expect(update.ok).toBe(false);
    expect(update.ok ? undefined : update.error.code).toBe(DomainErrorCode.ValidationError);
  });
});

describe('AnnouncementService readership tracking', () => {
  it('returns targeted published announcements for a recipient', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    expect(announcementService.getInbox(parentContext).map((item) => item.announcement.id)).toContain(developmentAnnouncementIds.sportsDay);
  });

  it('does not return class announcements to unrelated parents', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const benContext = contextFor(identityService, developmentIdentityIds.parentBen);
    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Class 1B Family Notice',
      body: 'Fictional development notice for Class 1B families.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class1B] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }
    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);
    expect(published.ok).toBe(true);

    expect(announcementService.getInbox(benContext).map((item) => item.announcement.id)).not.toContain(draft.value.id);
  });

  it('does not return parent-only announcements to unrelated students', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const studentContext = contextFor(identityService, developmentIdentityIds.studentChloeUser);
    const draft = announcementService.createDraft(adminContext, {
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Parent Only Notice',
      body: 'Fictional parent-only development notice.',
      authorUserId: adminContext.userId,
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class1B] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
    });

    expect(draft.ok).toBe(true);
    if (!draft.ok) {
      throw new Error(draft.error.message);
    }
    const published = announcementService.publishAnnouncement(adminContext, draft.value.id);
    expect(published.ok).toBe(true);

    expect(announcementService.getInbox(studentContext).map((item) => item.announcement.id)).not.toContain(draft.value.id);
  });

  it('does not return Demo School announcements to cross-school users', () => {
    const { announcementService, identityService } = createServices();
    const otherParentContext = contextFor(identityService, developmentIdentityIds.otherParent);

    expect(announcementService.getInbox(otherParentContext)).toEqual([]);
  });

  it('excludes draft and scheduled announcements from the inbox', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentAmy);

    const inboxIds = announcementService.getInbox(parentContext).map((item) => item.announcement.id);

    expect(inboxIds).not.toContain(developmentAnnouncementIds.museumTrip);
    expect(inboxIds).not.toContain(developmentAnnouncementIds.holidayNotice);
  });

  it('marks an announcement read and persists readAt idempotently', () => {
    const { announcementService, identityService } = createServices();
    const parentContext = contextFor(identityService, developmentIdentityIds.parentBen);

    const before = announcementService.getInbox(parentContext).find((item) => item.announcement.id === developmentAnnouncementIds.sportsDay);
    expect(before?.currentRecipient.readAt).toBeUndefined();

    const firstRead = announcementService.markRead(parentContext, developmentAnnouncementIds.sportsDay);
    expect(firstRead.ok).toBe(true);
    if (!firstRead.ok) {
      throw new Error(firstRead.error.message);
    }

    const after = announcementService.getInbox(parentContext).find((item) => item.announcement.id === developmentAnnouncementIds.sportsDay);
    expect(after?.currentRecipient.readAt).toBe(firstRead.value.readAt);

    const secondRead = announcementService.markRead(parentContext, developmentAnnouncementIds.sportsDay);
    expect(secondRead.ok).toBe(true);
    expect(secondRead.ok ? secondRead.value.readAt : undefined).toBe(firstRead.value.readAt);
  });

  it('updates aggregate readership totals and read rate', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);
    const parentContext = contextFor(identityService, developmentIdentityIds.parentBen);

    const before = readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, developmentAnnouncementIds.sportsDay));
    expect(before.delivered).toBe(4);
    expect(before.read).toBe(2);
    expect(before.readRate).toBe(50);

    announcementService.markRead(parentContext, developmentAnnouncementIds.sportsDay);

    const after = readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, developmentAnnouncementIds.sportsDay));
    expect(after.delivered).toBe(4);
    expect(after.read).toBe(3);
    expect(after.unread).toBe(1);
    expect(after.readRate).toBe(75);
  });

  it('calculates recipient-group readership breakdowns', () => {
    const { announcementService, identityService } = createServices();
    const adminContext = contextFor(identityService, developmentIdentityIds.admin);

    const summary = readershipValue(announcementService.getAuthorizedReadershipSummary(adminContext, developmentAnnouncementIds.sportsDay));

    expect(summary.byGroup.parent_guardians).toEqual({ delivered: 2, read: 1, unread: 1 });
    expect(summary.byGroup.students).toEqual({ delivered: 1, read: 0, unread: 1 });
    expect(summary.byGroup.staff).toEqual({ delivered: 1, read: 1, unread: 0 });
  });
});
