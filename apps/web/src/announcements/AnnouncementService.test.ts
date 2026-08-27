import { describe, expect, it } from 'vitest';
import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  DomainErrorCode,
  type AuthenticatedUserContext,
} from '@ai-school-platform/contracts';
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
    expect(announcementService.getReadershipSummary(draft.value.id).delivered).toBeGreaterThan(0);
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
    expect(announcementService.getReadershipSummary(draft.value.id).delivered).toBe(2);
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
