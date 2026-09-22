import { useState } from 'react';
import type { EntityId } from '@klassify/contracts';
import { AnnouncementStatus } from '@klassify/contracts';
import { DevelopmentIdentitySwitcher } from '../admin/components/DevelopmentIdentitySwitcher';
import { PermissionDenied } from '../admin/components/PermissionDenied';
import { StatusBadge } from '../admin/components/StatusBadge';
import { formatAnnouncementTime } from '../admin/pages/AnnouncementsPage';
import type { ConfiguredIdentityApplication } from '../identity/identityTypes';

export function DevelopmentInbox({ application }: { application: ConfiguredIdentityApplication }) {
  const [selectedUserId, setSelectedUserId] = useState<EntityId>(application.initialUserId);
  const [openedAnnouncementId, setOpenedAnnouncementId] = useState<EntityId | undefined>();
  const [revision, setRevision] = useState(0);
  const userContext = application.identityService.createUserContext(selectedUserId);

  if (!import.meta.env.DEV) {
    return <PermissionDenied title="Development inbox unavailable" message="The development inbox is disabled outside development builds." />;
  }

  if (!userContext.ok) {
    return <PermissionDenied title="Development identity unavailable" message={userContext.error.message} />;
  }

  const currentUser = application.identityService.getCurrentUser(userContext.value);
  const inbox = application.announcementService.getInbox(userContext.value);
  const unread = inbox.filter((item) => !item.currentRecipient.readAt && item.announcement.status === AnnouncementStatus.Published);
  const read = inbox.filter((item) => Boolean(item.currentRecipient.readAt));
  const opened = inbox.find((item) => item.announcement.id === openedAnnouncementId);

  const openAnnouncement = (announcementId: EntityId) => {
    application.announcementService.markRead(userContext.value, announcementId);
    setOpenedAnnouncementId(announcementId);
    setRevision((current) => current + 1);
  };

  return (
    <main className="admin-workspace dev-inbox" data-revision={revision}>
      <section className="admin-topbar">
        <div>
          <p className="page-eyebrow">Development only</p>
          <h1>Recipient Inbox</h1>
        </div>
        <DevelopmentIdentitySwitcher
          allowIdentitySwitching={application.allowIdentitySwitching}
          currentUser={currentUser.ok ? currentUser.value : undefined}
          identityOptions={application.identityOptions}
          selectedUserId={selectedUserId}
          onChange={(userId) => {
            setSelectedUserId(userId);
            setOpenedAnnouncementId(undefined);
          }}
        />
      </section>
      <section className="admin-content inbox-layout" aria-live="polite">
        <InboxSection title="Unread" items={unread} onOpen={openAnnouncement} />
        <InboxSection title="Read" items={read} onOpen={openAnnouncement} />
        {opened ? (
          <article className="detail-box inbox-message">
            <p className="page-eyebrow">Announcement</p>
            <h2>{opened.announcement.title}</h2>
            <p>{opened.audienceLabel}</p>
            <p><StatusBadge value={opened.announcement.status} /></p>
            <p>{opened.announcement.body}</p>
          </article>
        ) : null}
      </section>
    </main>
  );
}

function InboxSection({
  items,
  onOpen,
  title,
}: {
  items: ReturnType<ConfiguredIdentityApplication['announcementService']['getInbox']>;
  onOpen: (announcementId: EntityId) => void;
  title: string;
}) {
  return (
    <section className="dashboard-section" aria-labelledby={`${title.toLowerCase()}-announcements-title`}>
      <h2 id={`${title.toLowerCase()}-announcements-title`}>{title}</h2>
      {items.length === 0 ? <p className="subtle-note">No {title.toLowerCase()} announcements.</p> : null}
      <div className="inbox-list">
        {items.map((item) => (
          <button key={item.announcement.id} onClick={() => onOpen(item.announcement.id)} type="button">
            <strong>{item.announcement.title}</strong>
            <span>{item.audienceLabel}</span>
            <span>{formatAnnouncementTime(item.announcement.publishedAt)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
