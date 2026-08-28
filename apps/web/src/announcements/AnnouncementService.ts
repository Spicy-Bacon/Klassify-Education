import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  AnnouncementStatus,
  DomainErrorCode,
  Role,
  type Announcement,
  type AnnouncementRecipient,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
} from '@ai-school-platform/contracts';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { IdentityService } from '../identity/identityService';
import { AnnouncementAccessPolicy } from './AnnouncementAccessPolicy';
import { AnnouncementAudienceResolver } from './AnnouncementAudienceResolver';
import type { AnnouncementRepository } from './AnnouncementRepository';
import type {
  AnnouncementDetail,
  AnnouncementFilter,
  AnnouncementInput,
  AnnouncementInboxItem,
  AnnouncementListItem,
  AnnouncementReadershipSummary,
  AnnouncementUpdateInput,
  RecipientResolution,
  ScheduleAnnouncementInput,
} from './announcementTypes';

export class AnnouncementService {
  constructor(
    private readonly repository: AnnouncementRepository,
    private readonly identityService: IdentityService,
    private readonly accessPolicy = new AnnouncementAccessPolicy(identityService),
    private readonly audienceResolver = new AnnouncementAudienceResolver(),
  ) {}

  canCreate(userContext: AuthenticatedUserContext): boolean {
    return this.accessPolicy.canCreate(userContext, userContext.schoolId).ok;
  }

  canManageAnnouncement(userContext: AuthenticatedUserContext, announcement: Announcement): boolean {
    return this.accessPolicy.canEditAnnouncement(this.getIdentitySnapshot(), userContext, announcement).ok;
  }

  createDraft(userContext: AuthenticatedUserContext, input: AnnouncementInput): DomainResult<Announcement> {
    const createAccess = this.accessPolicy.canCreate(userContext, input.schoolId);
    if (!createAccess.ok) {
      return createAccess;
    }

    if (input.authorUserId !== userContext.userId) {
      return failure(DomainErrorCode.PermissionDenied, 'Announcements must be authored by the current user.');
    }

    const validation = this.validateDraftShape(userContext, input);
    if (!validation.ok) {
      return validation;
    }

    const timestamp = new Date().toISOString();
    const announcement: Announcement = {
      id: this.repository.nextId('announcement'),
      schoolId: input.schoolId,
      title: input.title.trim(),
      body: input.body.trim(),
      status: AnnouncementStatus.Draft,
      authorUserId: input.authorUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      audience: input.audience.map((audience) => ({ ...audience, targetIds: [...audience.targetIds] })),
      recipientGroups: [...input.recipientGroups],
      attachments: input.attachments?.map((attachment) => ({ ...attachment })),
    };

    return { ok: true, value: this.repository.saveAnnouncement(announcement) };
  }

  updateDraft(
    userContext: AuthenticatedUserContext,
    announcementId: EntityId,
    input: AnnouncementUpdateInput,
  ): DomainResult<Announcement> {
    const announcementResult = this.getEditableAnnouncement(userContext, announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const candidate: Announcement = {
      ...announcementResult.value,
      title: input.title === undefined ? announcementResult.value.title : input.title.trim(),
      body: input.body === undefined ? announcementResult.value.body : input.body.trim(),
      audience: input.audience === undefined
        ? announcementResult.value.audience
        : input.audience.map((audience) => ({ ...audience, targetIds: [...audience.targetIds] })),
      recipientGroups: input.recipientGroups === undefined ? announcementResult.value.recipientGroups : [...input.recipientGroups],
      attachments: input.attachments === undefined ? announcementResult.value.attachments : input.attachments.map((attachment) => ({ ...attachment })),
      updatedAt: new Date().toISOString(),
    };

    const validation = this.validateDraftShape(userContext, candidate);
    if (!validation.ok) {
      return validation;
    }

    return { ok: true, value: this.repository.saveAnnouncement(candidate) };
  }

  previewRecipients(userContext: AuthenticatedUserContext, input: AnnouncementInput): DomainResult<RecipientResolution> {
    const validation = this.validatePublishableInput(userContext, input);
    if (!validation.ok) {
      return validation;
    }

    return {
      ok: true,
      value: this.audienceResolver.resolve(this.getIdentitySnapshot(), input.schoolId, input.audience, input.recipientGroups),
    };
  }

  publishAnnouncement(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<Announcement> {
    const announcementResult = this.findAnnouncement(announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const announcement = announcementResult.value;
    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canPublishAnnouncement(identitySnapshot, userContext, announcement);
    if (!access.ok) {
      return access;
    }

    const validation = this.validatePublishableAnnouncement(userContext, announcement);
    if (!validation.ok) {
      return validation;
    }

    const resolution = this.resolveNonEmptyRecipients(announcement);
    if (!resolution.ok) {
      return resolution;
    }

    const timestamp = new Date().toISOString();
    const recipients = resolution.value.recipients.map((recipient) => ({
      id: this.repository.nextId('announcement_recipient'),
      announcementId: announcement.id,
      schoolId: announcement.schoolId,
      userId: recipient.userId,
      recipientGroup: recipient.recipientGroup,
      deliveredAt: timestamp,
    }));

    const published = this.repository.saveAnnouncement({
      ...announcement,
      status: AnnouncementStatus.Published,
      publishedAt: timestamp,
      scheduledFor: undefined,
      updatedAt: timestamp,
    });
    this.repository.saveRecipients(announcement.id, recipients);

    return { ok: true, value: published };
  }

  scheduleAnnouncement(
    userContext: AuthenticatedUserContext,
    announcementId: EntityId,
    input: ScheduleAnnouncementInput,
  ): DomainResult<Announcement> {
    const announcementResult = this.findAnnouncement(announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const announcement = announcementResult.value;
    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canScheduleAnnouncement(identitySnapshot, userContext, announcement);
    if (!access.ok) {
      return access;
    }

    const validation = this.validatePublishableAnnouncement(userContext, announcement);
    if (!validation.ok) {
      return validation;
    }

    const scheduledTime = Date.parse(input.scheduledFor);
    if (Number.isNaN(scheduledTime) || scheduledTime <= Date.now()) {
      return failure(DomainErrorCode.ValidationError, 'Scheduled time must be a future ISO 8601 timestamp.');
    }

    const resolution = this.resolveNonEmptyRecipients(announcement);
    if (!resolution.ok) {
      return resolution;
    }

    const timestamp = new Date().toISOString();
    return {
      ok: true,
      value: this.repository.saveAnnouncement({
        ...announcement,
        status: AnnouncementStatus.Scheduled,
        scheduledFor: input.scheduledFor,
        updatedAt: timestamp,
      }),
    };
  }

  cancelSchedule(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<Announcement> {
    const announcementResult = this.findAnnouncement(announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const announcement = announcementResult.value;
    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canCancelSchedule(identitySnapshot, userContext, announcement);
    if (!access.ok) {
      return access;
    }

    if (announcement.status !== AnnouncementStatus.Scheduled) {
      return failure(DomainErrorCode.ValidationError, 'Only scheduled announcements can return to draft.');
    }

    return {
      ok: true,
      value: this.repository.saveAnnouncement({
        ...announcement,
        status: AnnouncementStatus.Draft,
        scheduledFor: undefined,
        updatedAt: new Date().toISOString(),
      }),
    };
  }

  getVisibleAnnouncements(userContext: AuthenticatedUserContext, filter: AnnouncementFilter = {}): AnnouncementListItem[] {
    const identitySnapshot = this.getIdentitySnapshot();
    const snapshot = this.repository.getSnapshot();

    return snapshot.announcements
      .filter((announcement) => announcement.schoolId === userContext.schoolId)
      .filter((announcement) => this.accessPolicy.canViewAnnouncement(
        identitySnapshot,
        userContext,
        announcement.schoolId,
        announcement.authorUserId,
        announcement.audience,
      ).ok)
      .filter((announcement) => !filter.status || announcement.status === filter.status)
      .filter((announcement) => !filter.audienceType || announcement.audience.some((audience) => audience.type === filter.audienceType))
      .filter((announcement) => !filter.authorUserId || announcement.authorUserId === filter.authorUserId)
      .filter((announcement) => {
        const query = filter.search?.trim().toLowerCase();
        return !query || announcement.title.toLowerCase().includes(query) || announcement.body.toLowerCase().includes(query);
      })
      .map((announcement) => this.toListItem(identitySnapshot, announcement));
  }

  getAnnouncementById(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<AnnouncementDetail> {
    const announcementResult = this.findAnnouncement(announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const announcement = announcementResult.value;
    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canViewAnnouncement(identitySnapshot, userContext, announcement.schoolId, announcement.authorUserId, announcement.audience);
    if (!access.ok) {
      return access;
    }

    return {
      ok: true,
      value: {
        ...this.toListItem(identitySnapshot, announcement),
        recipientPrivacy: 'aggregate_only',
      },
    };
  }

  getAuthorizedReadershipSummary(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<AnnouncementReadershipSummary> {
    const announcement = this.getAnnouncementById(userContext, announcementId);
    if (!announcement.ok) {
      return announcement;
    }

    return { ok: true, value: this.getReadershipSummaryForAnnouncement(announcementId) };
  }

  getInbox(userContext: AuthenticatedUserContext): AnnouncementInboxItem[] {
    const identitySnapshot = this.getIdentitySnapshot();
    const snapshot = this.repository.getSnapshot();
    const recipientsByAnnouncement = new Map(snapshot.recipients
      .filter((recipient) => recipient.schoolId === userContext.schoolId && recipient.userId === userContext.userId)
      .map((recipient) => [recipient.announcementId, recipient]));

    return snapshot.announcements
      .filter((announcement) => announcement.status === AnnouncementStatus.Published)
      .filter((announcement) => announcement.schoolId === userContext.schoolId)
      .map((announcement) => {
        const currentRecipient = recipientsByAnnouncement.get(announcement.id);
        return currentRecipient ? { ...this.toListItem(identitySnapshot, announcement), currentRecipient } : undefined;
      })
      .filter(isDefined);
  }

  markRead(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<AnnouncementRecipient> {
    const recipient = this.repository.getSnapshot().recipients.find((candidate) => (
      candidate.announcementId === announcementId
      && candidate.schoolId === userContext.schoolId
      && candidate.userId === userContext.userId
    ));

    if (!recipient) {
      return failure(DomainErrorCode.NotFound, 'Announcement recipient record was not found.');
    }

    if (recipient.readAt) {
      return { ok: true, value: recipient };
    }

    return {
      ok: true,
      value: this.repository.saveRecipient({ ...recipient, readAt: new Date().toISOString() }),
    };
  }

  private getEditableAnnouncement(userContext: AuthenticatedUserContext, announcementId: EntityId): DomainResult<Announcement> {
    const announcementResult = this.findAnnouncement(announcementId);
    if (!announcementResult.ok) {
      return announcementResult;
    }

    const announcement = announcementResult.value;
    if (![AnnouncementStatus.Draft, AnnouncementStatus.Scheduled].includes(announcement.status)) {
      return failure(DomainErrorCode.ValidationError, 'Published and archived announcements are read-only in this phase.');
    }

    const access = this.accessPolicy.canEditAnnouncement(this.getIdentitySnapshot(), userContext, announcement);
    if (!access.ok) {
      return access;
    }

    return { ok: true, value: announcement };
  }

  private findAnnouncement(announcementId: EntityId): DomainResult<Announcement> {
    const announcement = this.repository.getSnapshot().announcements.find((candidate) => candidate.id === announcementId);
    if (!announcement) {
      return failure(DomainErrorCode.NotFound, 'Announcement was not found.');
    }

    return { ok: true, value: announcement };
  }

  private validateDraftShape(userContext: AuthenticatedUserContext, input: AnnouncementInput | Announcement): DomainResult<true> {
    if (input.schoolId !== userContext.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school announcement access is not allowed.');
    }

    if (!input.title.trim() || !input.body.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Announcement title and message are required.');
    }

    const identitySnapshot = this.getIdentitySnapshot();
    const author = identitySnapshot.users.find((user) => user.id === input.authorUserId);
    if (!author || author.schoolId !== input.schoolId) {
      return failure(DomainErrorCode.InvalidRelationship, 'Announcement author must belong to the announcement school.');
    }

    if (input.audience.length > 0) {
      const audienceAccess = this.accessPolicy.canTargetAudiences(identitySnapshot, userContext, input.schoolId, input.audience);
      if (!audienceAccess.ok) {
        return audienceAccess;
      }
    }

    return { ok: true, value: true };
  }

  private validatePublishableInput(userContext: AuthenticatedUserContext, input: AnnouncementInput): DomainResult<true> {
    const draftValidation = this.validateDraftShape(userContext, input);
    if (!draftValidation.ok) {
      return draftValidation;
    }

    if (input.audience.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'At least one audience is required before publishing.');
    }

    if (input.recipientGroups.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'At least one recipient group is required before publishing.');
    }

    return { ok: true, value: true };
  }

  private validatePublishableAnnouncement(userContext: AuthenticatedUserContext, announcement: Announcement): DomainResult<true> {
    return this.validatePublishableInput(userContext, {
      schoolId: announcement.schoolId,
      title: announcement.title,
      body: announcement.body,
      authorUserId: announcement.authorUserId,
      audience: announcement.audience,
      recipientGroups: announcement.recipientGroups,
      attachments: announcement.attachments,
    });
  }

  private resolveNonEmptyRecipients(announcement: Announcement): DomainResult<RecipientResolution> {
    const resolution = this.audienceResolver.resolve(
      this.getIdentitySnapshot(),
      announcement.schoolId,
      announcement.audience,
      announcement.recipientGroups,
    );

    if (resolution.uniqueRecipientCount === 0) {
      return failure(DomainErrorCode.ValidationError, 'Announcement must resolve to at least one recipient before publishing or scheduling.');
    }

    return { ok: true, value: resolution };
  }

  private toListItem(identitySnapshot: IdentitySnapshot, announcement: Announcement): AnnouncementListItem {
    const author = identitySnapshot.users.find((user) => user.id === announcement.authorUserId);
    return {
      announcement,
      author,
      audienceLabel: formatAudienceLabel(identitySnapshot, announcement),
      readership: this.getReadershipSummaryForAnnouncement(announcement.id),
    };
  }

  private getReadershipSummaryForAnnouncement(announcementId: EntityId): AnnouncementReadershipSummary {
    return summarizeReadership(this.repository.getSnapshot().recipients.filter((recipient) => recipient.announcementId === announcementId));
  }

  private getIdentitySnapshot(): IdentitySnapshot {
    return this.identityService.getSnapshot();
  }
}

export function summarizeReadership(recipients: AnnouncementRecipient[]): AnnouncementReadershipSummary {
  const byGroup = {
    [AnnouncementRecipientGroup.ParentGuardians]: emptyGroupSummary(),
    [AnnouncementRecipientGroup.Students]: emptyGroupSummary(),
    [AnnouncementRecipientGroup.Staff]: emptyGroupSummary(),
  };

  for (const recipient of recipients) {
    byGroup[recipient.recipientGroup].delivered += recipient.deliveredAt ? 1 : 0;
    byGroup[recipient.recipientGroup].read += recipient.readAt ? 1 : 0;
  }

  for (const group of Object.values(AnnouncementRecipientGroup)) {
    byGroup[group].unread = byGroup[group].delivered - byGroup[group].read;
  }

  const delivered = recipients.filter((recipient) => recipient.deliveredAt).length;
  const read = recipients.filter((recipient) => recipient.readAt).length;

  return {
    delivered,
    read,
    unread: delivered - read,
    readRate: delivered === 0 ? 0 : Number(((read / delivered) * 100).toFixed(1)),
    byGroup,
  };
}

export function formatAudienceLabel(identitySnapshot: IdentitySnapshot, announcement: Announcement): string {
  return announcement.audience.map((audience) => {
    if (audience.type === AnnouncementAudienceType.School) {
      return 'Whole School';
    }

    if (audience.type === AnnouncementAudienceType.YearGroup) {
      return audience.targetIds
        .map((id) => identitySnapshot.yearGroups.find((yearGroup) => yearGroup.id === id)?.name ?? id)
        .join(', ');
    }

    if (audience.type === AnnouncementAudienceType.Class) {
      return audience.targetIds
        .map((id) => identitySnapshot.classes.find((schoolClass) => schoolClass.id === id)?.name ?? id)
        .join(', ');
    }

    return `${audience.targetIds.length} selected user${audience.targetIds.length === 1 ? '' : 's'}`;
  }).join(' + ');
}

export function recipientGroupLabel(group: AnnouncementRecipientGroup): string {
  if (group === AnnouncementRecipientGroup.ParentGuardians) {
    return 'Parents / Guardians';
  }

  if (group === AnnouncementRecipientGroup.Students) {
    return 'Students';
  }

  return 'Staff';
}

export function canRoleUseAnnouncements(role: Role): boolean {
  return [Role.SchoolOwner, Role.Principal, Role.SchoolAdmin, Role.Teacher].includes(role);
}

function emptyGroupSummary() {
  return { delivered: 0, read: 0, unread: 0 };
}

function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
