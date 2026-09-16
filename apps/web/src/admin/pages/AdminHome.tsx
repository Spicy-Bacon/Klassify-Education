import { Link } from 'react-router-dom';
import type { AnnouncementService } from '../../announcements/AnnouncementService';
import type { FormService } from '../../forms/FormService';
import { PageHeader } from '../components/PageHeader';
import { Table } from '../components/Table';
import { Metric } from './Metric';
import type { PageProps } from './pageTypes';

export function AdminHome({
  announcementService,
  formService,
  service,
  userContext,
}: PageProps & {
  announcementService?: AnnouncementService;
  formService?: FormService;
}) {
  const overview = service.getAdminOverview(userContext);
  const announcementItems = announcementService?.getVisibleAnnouncements(userContext) ?? [];
  const formItems = formService?.getVisibleForms(userContext) ?? [];
  const publishedAnnouncements = announcementItems.filter((item) => item.announcement.status === 'published');
  const scheduledAnnouncements = announcementItems.filter((item) => item.announcement.status === 'scheduled');
  const publishedForms = formItems.filter((item) => item.form.status === 'published');
  const draftForms = formItems.filter((item) => item.form.status === 'draft');
  const averageReadRate = publishedAnnouncements.length === 0
    ? 0
    : Number((publishedAnnouncements.reduce((total, item) => total + item.readership.readRate, 0) / publishedAnnouncements.length).toFixed(1));
  const averageCompletionRate = publishedForms.length === 0
    ? 0
    : Number((publishedForms.reduce((total, item) => total + item.responseSummary.completionRate, 0) / publishedForms.length).toFixed(1));
  const canCreateAnnouncement = announcementService?.canCreate(userContext) ?? false;
  const canCreateForm = formService?.canCreate(userContext) ?? false;

  return (
    <section className="panel">
      <PageHeader eyebrow={overview.school?.name ?? 'School'} title="School Administration">
        Identity, school structure and current communication overview.
      </PageHeader>
      <div className="metric-grid">
        {overview.metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
      {(overview.canUseManagementActions || canCreateAnnouncement || canCreateForm) ? (
        <section className="dashboard-section" aria-labelledby="quick-actions-title">
          <h3 id="quick-actions-title">Quick actions</h3>
          <div className="quick-actions">
            {service.canManageUsers(userContext) ? (
              <>
                <Link to="/admin/students">Add student</Link>
                <Link to="/admin/parents">Add parent</Link>
                <Link to="/admin/staff">Add staff</Link>
              </>
            ) : null}
            {service.canManageClasses(userContext) ? <Link to="/admin/classes">Create class</Link> : null}
            {canCreateAnnouncement ? <Link to="/admin/announcements/new">Create announcement</Link> : null}
            {canCreateForm ? <Link to="/admin/forms/new">Create form</Link> : null}
          </div>
        </section>
      ) : null}
      {announcementService ? (
        <section className="dashboard-section" aria-labelledby="announcements-summary-title">
          <h3 id="announcements-summary-title">Announcements</h3>
          <div className="metric-grid">
            <Metric label="Published" value={publishedAnnouncements.length} />
            <Metric label="Scheduled" value={scheduledAnnouncements.length} />
            <Metric label="Average read rate" value={`${averageReadRate}%`} />
          </div>
        </section>
      ) : null}
      {formService ? (
        <section className="dashboard-section" aria-labelledby="forms-summary-title">
          <h3 id="forms-summary-title">Forms</h3>
          <div className="metric-grid">
            <Metric label="Published" value={publishedForms.length} />
            <Metric label="Drafts" value={draftForms.length} />
            <Metric label="Average completion" value={`${averageCompletionRate}%`} />
          </div>
        </section>
      ) : null}
      <section className="dashboard-section" aria-labelledby="classes-summary-title">
        <h3 id="classes-summary-title">Classes</h3>
        <Table headers={['Class', 'Year group', 'Students', 'Teachers']}>
          {overview.classes.map((summary) => (
            <tr key={summary.class.id}>
              <td>{summary.class.name}</td>
              <td>{summary.yearGroup?.name ?? '-'}</td>
              <td>{summary.students.length}</td>
              <td>{summary.teachers.map((teacher) => teacher.displayName).join(', ') || '-'}</td>
            </tr>
          ))}
        </Table>
      </section>
      <section className="dashboard-section" aria-labelledby="coming-soon-title">
        <h3 id="coming-soon-title">Coming soon / Not yet available</h3>
        <div className="disabled-module-list" aria-label="Future workflow placeholders">
          <span>Messaging</span>
          <span>Attendance</span>
          <span>Events</span>
        </div>
      </section>
    </section>
  );
}
