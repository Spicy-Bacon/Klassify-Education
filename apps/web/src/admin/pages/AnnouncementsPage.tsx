import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AnnouncementAudienceType,
  AnnouncementRecipientGroup,
  AnnouncementStatus,
  Role,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
} from '@ai-school-platform/contracts';
import type { AnnouncementService } from '../../announcements/AnnouncementService';
import { recipientGroupLabel } from '../../announcements/AnnouncementService';
import type { RecipientResolution } from '../../announcements/announcementTypes';
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
      {[AnnouncementStatus.Draft, AnnouncementStatus.Scheduled].includes(item.announcement.status) ? (
        <p><Link className="button-link" to={`/admin/announcements/${item.announcement.id}/edit`}>Edit draft</Link></p>
      ) : null}
    </section>
  );
}

export function AnnouncementEditorPage({
  announcementService,
  identityService,
  onAction,
  userContext,
}: {
  announcementService: AnnouncementService;
  identityService: IdentityService;
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
  userContext: AuthenticatedUserContext;
}) {
  const navigate = useNavigate();
  const { announcementId } = useParams();
  const existing = announcementId ? announcementService.getAnnouncementById(userContext, announcementId) : undefined;
  const currentSchool = identityService.getCurrentSchool(userContext);
  const currentUser = identityService.getCurrentUser(userContext);
  const initialAnnouncement = existing?.ok ? existing.value.announcement : undefined;
  const isEdit = Boolean(announcementId);
  const [title, setTitle] = useState(initialAnnouncement?.title ?? '');
  const [body, setBody] = useState(initialAnnouncement?.body ?? '');
  const [audienceType, setAudienceType] = useState<AnnouncementAudienceType>(initialAnnouncement?.audience[0]?.type ?? defaultAudienceType(userContext.role));
  const [selectedTargetIds, setSelectedTargetIds] = useState<EntityId[]>(initialAnnouncement?.audience[0]?.targetIds ?? defaultTargetIds(currentSchool.ok ? currentSchool.value.id : '', userContext.role));
  const [recipientGroups, setRecipientGroups] = useState<AnnouncementRecipientGroup[]>(initialAnnouncement?.recipientGroups ?? [AnnouncementRecipientGroup.ParentGuardians]);
  const [preview, setPreview] = useState<RecipientResolution | undefined>();
  const [localError, setLocalError] = useState<string | undefined>();

  if (existing && !existing.ok) {
    return <PermissionDenied title="Announcement unavailable" message={existing.error.message} />;
  }

  if (!currentSchool.ok || !currentUser.ok) {
    return <PermissionDenied title="Development identity unavailable" message="Current school or user context could not be loaded." />;
  }

  if (isEdit && initialAnnouncement && ![AnnouncementStatus.Draft, AnnouncementStatus.Scheduled].includes(initialAnnouncement.status)) {
    return <PermissionDenied title="Announcement is read-only" message="Published and archived announcements are read-only in this phase." />;
  }

  const audienceOptions = buildAudienceOptions(identityService, userContext, currentSchool.value.id, audienceType);
  const input = {
    schoolId: currentSchool.value.id,
    title,
    body,
    authorUserId: currentUser.value.id,
    audience: selectedTargetIds.length > 0 ? [{ type: audienceType, targetIds: selectedTargetIds }] : [],
    recipientGroups,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = isEdit && announcementId
      ? announcementService.updateDraft(userContext, announcementId, input)
      : announcementService.createDraft(userContext, input);

    onAction(result, isEdit ? 'Announcement draft updated.' : 'Announcement draft saved.');

    if (result.ok) {
      navigate(`/admin/announcements/${result.value.id}`);
      return;
    }

    setLocalError(result.error.message);
  };

  const refreshPreview = () => {
    const result = announcementService.previewRecipients(userContext, input);
    if (result.ok) {
      setPreview(result.value);
      setLocalError(undefined);
      return;
    }

    setPreview(undefined);
    setLocalError(result.error.message);
  };

  return (
    <section className="panel">
      <PageHeader eyebrow="Announcement draft" title={isEdit ? 'Edit announcement' : 'Create announcement'}>
        Prepare the content, audience and recipient groups before publishing.
      </PageHeader>

      {localError ? <p className="notice notice-error">{localError}</p> : null}

      <form className="stacked-form" onSubmit={submit}>
        <section className="form-box" aria-labelledby="announcement-content-title">
          <h3 id="announcement-content-title">Content</h3>
          <label>
            <span>Title</span>
            <input onChange={(event) => setTitle(event.target.value)} required type="text" value={title} />
          </label>
          <label>
            <span>Message</span>
            <textarea onChange={(event) => setBody(event.target.value)} required rows={8} value={body} />
          </label>
        </section>

        <section className="form-box" aria-labelledby="announcement-audience-title">
          <h3 id="announcement-audience-title">Audience</h3>
          <label>
            <span>Audience type</span>
            <select
              onChange={(event) => {
                const nextType = event.target.value as AnnouncementAudienceType;
                setAudienceType(nextType);
                setSelectedTargetIds(defaultTargetIds(currentSchool.value.id, userContext.role, nextType));
                setPreview(undefined);
              }}
              value={audienceType}
            >
              {allowedAudienceTypes(userContext.role).map((type) => (
                <option key={type} value={type}>{formatValue(type)}</option>
              ))}
            </select>
          </label>
          <div className="checkbox-grid" role="group" aria-label="Audience targets">
            {audienceOptions.map((option) => (
              <label className="checkbox-label" key={option.id}>
                <input
                  checked={selectedTargetIds.includes(option.id)}
                  disabled={option.disabled}
                  onChange={(event) => {
                    setPreview(undefined);
                    setSelectedTargetIds((current) => event.target.checked
                      ? [...current, option.id]
                      : current.filter((id) => id !== option.id));
                  }}
                  type="checkbox"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="form-box" aria-labelledby="announcement-recipient-title">
          <h3 id="announcement-recipient-title">Recipient groups</h3>
          <div className="checkbox-grid" role="group" aria-label="Recipient groups">
            {Object.values(AnnouncementRecipientGroup).map((group) => (
              <label className="checkbox-label" key={group}>
                <input
                  checked={recipientGroups.includes(group)}
                  onChange={(event) => {
                    setPreview(undefined);
                    setRecipientGroups((current) => event.target.checked
                      ? [...current, group]
                      : current.filter((currentGroup) => currentGroup !== group));
                  }}
                  type="checkbox"
                />
                {recipientGroupLabel(group)}
              </label>
            ))}
          </div>
        </section>

        <section className="form-box" aria-labelledby="announcement-preview-title">
          <h3 id="announcement-preview-title">Recipients</h3>
          {preview ? (
            <dl className="detail-list">
              {Object.values(AnnouncementRecipientGroup).map((group) => (
                <div key={group}>
                  <dt>{recipientGroupLabel(group)}</dt>
                  <dd>{preview.countsByGroup[group]}</dd>
                </div>
              ))}
              <div>
                <dt>Unique recipients</dt>
                <dd>{preview.uniqueRecipientCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="subtle-note">Preview recipients before publishing or scheduling.</p>
          )}
          <button onClick={refreshPreview} type="button">Preview recipients</button>
        </section>

        <div className="form-actions">
          <button type="submit">Save Draft</button>
          <Link to="/admin/announcements">Cancel</Link>
        </div>
      </form>
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

function allowedAudienceTypes(role: Role): AnnouncementAudienceType[] {
  if (role === Role.Teacher) {
    return [AnnouncementAudienceType.Class];
  }

  return [
    AnnouncementAudienceType.School,
    AnnouncementAudienceType.YearGroup,
    AnnouncementAudienceType.Class,
    AnnouncementAudienceType.Users,
  ];
}

function defaultAudienceType(role: Role): AnnouncementAudienceType {
  return role === Role.Teacher ? AnnouncementAudienceType.Class : AnnouncementAudienceType.School;
}

function defaultTargetIds(schoolId: EntityId, role: Role, audienceType = defaultAudienceType(role)): EntityId[] {
  return audienceType === AnnouncementAudienceType.School && role !== Role.Teacher ? [schoolId] : [];
}

function buildAudienceOptions(
  identityService: IdentityService,
  userContext: AuthenticatedUserContext,
  schoolId: EntityId,
  audienceType: AnnouncementAudienceType,
) {
  if (audienceType === AnnouncementAudienceType.School) {
    return [{ id: schoolId, label: 'Whole School', disabled: false }];
  }

  if (audienceType === AnnouncementAudienceType.YearGroup) {
    return identityService.getVisibleYearGroups(userContext).map((yearGroup) => ({
      id: yearGroup.id,
      label: yearGroup.name,
      disabled: userContext.role === Role.Teacher,
    }));
  }

  if (audienceType === AnnouncementAudienceType.Class) {
    return identityService.getVisibleClasses(userContext).map((summary) => ({
      id: summary.class.id,
      label: summary.class.name,
      disabled: false,
    }));
  }

  return identityService.getVisibleUsers(userContext).map((user) => ({
    id: user.id,
    label: `${user.displayName} (${formatValue(user.role)})`,
    disabled: userContext.role === Role.Teacher,
  }));
}
