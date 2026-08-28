import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  AnnouncementStatus,
  type Announcement,
  type AnnouncementRecipient,
  type EntityId,
} from '@ai-school-platform/contracts';
import { developmentIdentityIds } from '../identity/developmentIdentityRepository';
import type { AnnouncementRepository } from './AnnouncementRepository';
import type { AnnouncementSnapshot } from './announcementTypes';

const createdAt = '2026-08-27T01:00:00.000Z';

export const developmentAnnouncementIds = {
  sportsDay: 'announcement_sports_day',
  museumTrip: 'announcement_museum_trip',
  holidayNotice: 'announcement_holiday_notice',
};

export class DevelopmentAnnouncementRepository implements AnnouncementRepository {
  private idCounter = 0;

  private readonly announcements: Announcement[] = [
    {
      id: developmentAnnouncementIds.sportsDay,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Sports Day Reminder',
      body: 'Please remember comfortable shoes, a water bottle and a sun hat for the development sports day event.',
      status: AnnouncementStatus.Published,
      authorUserId: developmentIdentityIds.admin,
      createdAt,
      updatedAt: createdAt,
      publishedAt: '2026-08-27T09:00:00.000Z',
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
      recipientGroups: [
        AnnouncementRecipientGroup.ParentGuardians,
        AnnouncementRecipientGroup.Students,
        AnnouncementRecipientGroup.Staff,
      ],
    },
    {
      id: developmentAnnouncementIds.museumTrip,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Museum Trip Information',
      body: 'Development trip details are ready for Year 3 families. Please review the draft information before publication.',
      status: AnnouncementStatus.Draft,
      authorUserId: developmentIdentityIds.teacher3A,
      createdAt: '2026-08-27T02:00:00.000Z',
      updatedAt: '2026-08-27T02:00:00.000Z',
      audience: [{ type: AnnouncementAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians],
      attachments: [
        {
          id: 'attachment_museum_trip_placeholder',
          fileName: 'museum-trip-placeholder.pdf',
          contentType: 'application/pdf',
          sizeBytes: 24576,
          storageReference: 'development-placeholder',
        },
      ],
    },
    {
      id: developmentAnnouncementIds.holidayNotice,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'School Holiday Notice',
      body: 'The school office will be closed during the development holiday period.',
      status: AnnouncementStatus.Scheduled,
      authorUserId: developmentIdentityIds.principal,
      createdAt: '2026-08-27T03:00:00.000Z',
      updatedAt: '2026-08-27T03:00:00.000Z',
      scheduledFor: '2026-09-01T09:00:00.000Z',
      audience: [{ type: AnnouncementAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
      recipientGroups: [AnnouncementRecipientGroup.ParentGuardians, AnnouncementRecipientGroup.Staff],
    },
  ];

  private readonly recipients: AnnouncementRecipient[] = [
    this.recipient('recipient_sports_amy', developmentAnnouncementIds.sportsDay, developmentIdentityIds.demoSchool, developmentIdentityIds.parentAmy, AnnouncementRecipientGroup.ParentGuardians, '2026-08-27T09:00:05.000Z', '2026-08-27T09:20:00.000Z'),
    this.recipient('recipient_sports_ben', developmentAnnouncementIds.sportsDay, developmentIdentityIds.demoSchool, developmentIdentityIds.parentBen, AnnouncementRecipientGroup.ParentGuardians, '2026-08-27T09:00:05.000Z'),
    this.recipient('recipient_sports_chloe', developmentAnnouncementIds.sportsDay, developmentIdentityIds.demoSchool, developmentIdentityIds.studentChloeUser, AnnouncementRecipientGroup.Students, '2026-08-27T09:00:05.000Z'),
    this.recipient('recipient_sports_teacher', developmentAnnouncementIds.sportsDay, developmentIdentityIds.demoSchool, developmentIdentityIds.teacher3A, AnnouncementRecipientGroup.Staff, '2026-08-27T09:00:05.000Z', '2026-08-27T09:05:00.000Z'),
  ];

  getSnapshot(): AnnouncementSnapshot {
    return {
      announcements: this.announcements.map((announcement) => cloneAnnouncement(announcement)),
      recipients: this.recipients.map((recipient) => ({ ...recipient })),
    };
  }

  saveAnnouncement(announcement: Announcement): Announcement {
    const existingIndex = this.announcements.findIndex((candidate) => candidate.id === announcement.id);
    const stored = cloneAnnouncement(announcement);

    if (existingIndex >= 0) {
      this.announcements[existingIndex] = stored;
      return cloneAnnouncement(stored);
    }

    this.announcements.push(stored);
    return cloneAnnouncement(stored);
  }

  saveRecipients(announcementId: EntityId, recipients: AnnouncementRecipient[]): AnnouncementRecipient[] {
    const remaining = this.recipients.filter((recipient) => recipient.announcementId !== announcementId);
    this.recipients.length = 0;
    this.recipients.push(...remaining, ...recipients.map((recipient) => ({ ...recipient })));
    return recipients.map((recipient) => ({ ...recipient }));
  }

  saveRecipient(recipient: AnnouncementRecipient): AnnouncementRecipient {
    const existingIndex = this.recipients.findIndex((candidate) => candidate.id === recipient.id);
    const stored = { ...recipient };

    if (existingIndex >= 0) {
      this.recipients[existingIndex] = stored;
      return { ...stored };
    }

    this.recipients.push(stored);
    return { ...stored };
  }

  nextId(prefix: string): EntityId {
    this.idCounter += 1;
    return `${prefix}_${this.idCounter.toString().padStart(4, '0')}`;
  }

  private recipient(
    id: EntityId,
    announcementId: EntityId,
    schoolId: EntityId,
    userId: EntityId,
    recipientGroup: AnnouncementRecipientGroup,
    deliveredAt?: string,
    readAt?: string,
  ): AnnouncementRecipient {
    return { id, announcementId, schoolId, userId, recipientGroup, deliveredAt, readAt };
  }
}

function cloneAnnouncement(announcement: Announcement): Announcement {
  return {
    ...announcement,
    audience: announcement.audience.map((audience) => ({ ...audience, targetIds: [...audience.targetIds] })),
    recipientGroups: [...announcement.recipientGroups],
    attachments: announcement.attachments?.map((attachment) => ({ ...attachment })),
  };
}
