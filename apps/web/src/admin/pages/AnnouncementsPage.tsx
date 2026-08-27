import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AnnouncementAudienceType,
  AnnouncementStatus,
  type AuthenticatedUserContext,
} from '@ai-school-platform/contracts';
import type { AnnouncementService } from '../../announcements/AnnouncementService';
import { recipientGroupLabel } from '../../announcements/AnnouncementService';
import type { IdentityService } from '../../identity/identityService';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PermissionDenied } from '../components/PermissionDenied';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { formatValue } from './pageUtils';

export function AnnouncementsPage({
  announcementService,
  identityService,
  userContext,
}: {
  announcementService: AnnouncementService;
  identityService: IdentityService;
  userContext: AuthenticatedUserContext;
}) {
  const [status, setStatus] = useState('');
  const [audienceType, setAudienceType] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = announcementService.canCreate(userContext);

  const announcements = useMemo(() => announcementService.getVisibleAnnouncements(userContext, {
    status: status ? status as AnnouncementStatus : undefined,
    audienceType: audienceType ? audienceType as AnnouncementAudienceType : undefined,
    search,
  }), [announcementService, audienceType, search, status, userContext]);

  return (
    <section className="panel">
      <PageHeader eyebrow="Communication" title="Announcements">
        Create, target, publish and track school announcements.
      </PageHeader>

      <div className="filter-bar">
        <label>
          <span>Search</span>
          <input
            aria-label="Search announcements"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements..."
            type="search"
            value={search}
          />
        </label>
        <label>
          <span>Status</span>
          <select aria-label="Filter by status" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">All statuses</option>
            {Object.values(AnnouncementStatus).map((option) => (
              <option key={option} value={option}>{formatValue(option)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Audience</span>
          <select aria-label="Filter by audience" onChange={(event) => setAudienceType(event.target.value)} value={audienceType}>
            <option value="">All audiences</option>
            {Object.values(AnnouncementAudienceType).map((option) => (
              <option key={option} value={option}>{formatValue(option)}</option>
            ))}
          </select>
        </label>
        {canCreate ? <Link className="button-link" to="/admin/announcements/new">Create announcement</Link> : null}
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          message={canCreate ? 'Create your first announcement to communicate with your school community.' : 'No announcements are available for your current scope.'}
        />
      ) : (
        <Table headers={['Title', 'Audience', 'Status', 'Author', 'Published / Scheduled', 'Readership']}>
          {announcements.map((item) => (
            <tr key={item.announcement.id}>
              <td><Link to={`/admin/announcements/${item.announcement.id}`}>{item.announcement.title}</Link></td>
              <td>{item.audienceLabel}</td>
              <td><StatusBadge value={item.announcement.status} /></td>
              <td>{item.author?.displayName ?? 'Unknown'}</td>
              <td>{formatAnnouncementTime(item.announcement.publishedAt ?? item.announcement.scheduledFor)}</td>
              <td>{item.readership.delivered === 0 ? '-' : `${item.readership.read} / ${item.readership.delivered} read`}</td>
            </tr>
          ))}
        </Table>
      )}
      <AnnouncementScopeNote identityService={identityService} userContext={userContext} />
    </section>
  );
}

export function AnnouncementDetailPage({
  announcementService,
  userContext,
}: {
  announcementService: AnnouncementService;
  userContext: AuthenticatedUserContext;
}) {
  const { announcementId } = useParams();
  const detail = announcementId ? announcementService.getAnnouncementById(userContext, announcementId) : undefined;

  if (!detail) {
    return <PermissionDenied title="Announcement unavailable" message="Announcement route is missing an announcement ID." />;
  }

  if (!detail.ok) {
    return <PermissionDenied title="Announcement unavailable" message={detail.error.message} />;
  }

  const item = detail.value;

  return (
    <section className="panel">
      <PageHeader eyebrow="Announcement" title={item.announcement.title}>
        {item.audienceLabel}
      </PageHeader>

      <div className="detail-grid">
        <div className="detail-box">
          <h3>Message</h3>
          <p>{item.announcement.body}</p>
        </div>
        <div className="detail-box">
          <h3>Status</h3>
          <p><StatusBadge value={item.announcement.status} /></p>
          <p>Author: {item.author?.displayName ?? 'Unknown'}</p>
          <p>Created: {formatAnnouncementTime(item.announcement.createdAt)}</p>
          <p>Published / Scheduled: {formatAnnouncementTime(item.announcement.publishedAt ?? item.announcement.scheduledFor)}</p>
        </div>
        <div className="detail-box">
          <h3>Audience</h3>
          <p>{item.audienceLabel}</p>
          <p>{item.announcement.recipientGroups.map(recipientGroupLabel).join(', ')}</p>
        </div>
        <div className="detail-box">
          <h3>Readership</h3>
          <p>Delivered: {item.readership.delivered}</p>
          <p>Read: {item.readership.read}</p>
          <p>Unread: {item.readership.unread}</p>
          <p>Read rate: {item.readership.readRate}%</p>
        </div>
      </div>
    </section>
  );
}

function AnnouncementScopeNote({
  identityService,
  userContext,
}: {
  identityService: IdentityService;
  userContext: AuthenticatedUserContext;
}) {
  const currentUser = identityService.getCurrentUser(userContext);
  const role = currentUser.ok ? formatValue(currentUser.value.role) : 'current role';

  return <p className="subtle-note">Showing announcements available to {role}.</p>;
}

export function formatAnnouncementTime(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
