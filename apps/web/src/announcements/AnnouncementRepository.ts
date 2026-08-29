import type { Announcement, AnnouncementRecipient, EntityId } from '@klassify/contracts';
import type { AnnouncementSnapshot } from './announcementTypes';

export interface AnnouncementRepository {
  getSnapshot(): AnnouncementSnapshot;
  saveAnnouncement(announcement: Announcement): Announcement;
  saveRecipients(announcementId: EntityId, recipients: AnnouncementRecipient[]): AnnouncementRecipient[];
  saveRecipient(recipient: AnnouncementRecipient): AnnouncementRecipient;
  nextId(prefix: string): EntityId;
}
