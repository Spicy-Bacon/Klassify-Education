import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementAttachment,
  AnnouncementRecipient,
  AnnouncementRecipientGroup,
  AnnouncementStatus,
  EntityId,
  ISODateTime,
  User,
} from '@ai-school-platform/contracts';

export interface AnnouncementInput {
  schoolId: EntityId;
  title: string;
  body: string;
  authorUserId: EntityId;
  audience: AnnouncementAudience[];
  recipientGroups: AnnouncementRecipientGroup[];
  attachments?: AnnouncementAttachment[];
}

export interface AnnouncementUpdateInput {
  title?: string;
  body?: string;
  audience?: AnnouncementAudience[];
  recipientGroups?: AnnouncementRecipientGroup[];
  attachments?: AnnouncementAttachment[];
}

export interface AnnouncementSnapshot {
  announcements: Announcement[];
  recipients: AnnouncementRecipient[];
}

export interface ResolvedAnnouncementRecipient {
  userId: EntityId;
  recipientGroup: AnnouncementRecipientGroup;
}

export interface RecipientResolution {
  recipients: ResolvedAnnouncementRecipient[];
  countsByGroup: Record<AnnouncementRecipientGroup, number>;
  uniqueRecipientCount: number;
}

export interface AnnouncementReadershipSummary {
  delivered: number;
  read: number;
  unread: number;
  readRate: number;
  byGroup: Record<AnnouncementRecipientGroup, { delivered: number; read: number; unread: number }>;
}

export interface AnnouncementListItem {
  announcement: Announcement;
  author?: User;
  audienceLabel: string;
  readership: AnnouncementReadershipSummary;
}

export interface AnnouncementDetail extends AnnouncementListItem {
  recipients: AnnouncementRecipient[];
}

export interface AnnouncementFilter {
  status?: AnnouncementStatus;
  audienceType?: AnnouncementAudience['type'];
  authorUserId?: EntityId;
  search?: string;
}

export interface ScheduleAnnouncementInput {
  scheduledFor: ISODateTime;
}
