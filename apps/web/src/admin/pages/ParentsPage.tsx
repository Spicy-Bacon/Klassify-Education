import { Link, useParams } from 'react-router-dom';
import { GuardianRelationshipType, Role } from '@ai-school-platform/contracts';
import { DetailBox } from '../components/DetailBox';
import { EmptyState } from '../components/EmptyState';
import { FormBox } from '../components/FormBox';
import { PageHeader } from '../components/PageHeader';
import { PermissionDenied } from '../components/PermissionDenied';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { filterGuardians } from './listFilters';
import { formatValue, stringField, studentName } from './pageUtils';
import type { ActionPageProps, PageProps } from './pageTypes';
import { useState } from 'react';

export function ParentsPage({ service, userContext, onAction }: ActionPageProps) {
  const parents = service.getVisibleGuardians(userContext);
  const linkableGuardians = service.getLinkableGuardians(userContext);
  const linkableStudents = service.getAssignableStudents(userContext);
  const canManageUsers = service.canManageUsers(userContext);
  const [query, setQuery] = useState('');
  const filteredParents = filterGuardians(parents, query);

  return (
    <section className="panel">
      <PageHeader title="Parents / Guardians">Review guardian accounts and linked children.</PageHeader>
      <div className="filter-bar" role="search">
        <label>
          <span>Search parents</span>
          <input placeholder="Search parents..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {filteredParents.length > 0 ? (
        <Table headers={['Parent / Guardian', 'Email', 'Linked children', 'Primary relationship', 'Status', 'Actions']}>
          {filteredParents.map((guardian) => {
            const primaryChildren = guardian.linkedChildren.filter((child) => child.isPrimary);
            return (
              <tr key={guardian.user.id}>
                <td>{guardian.user.displayName}</td>
                <td>{guardian.user.email}</td>
                <td>
                  {guardian.linkedChildren.length > 0 ? (
                    <ul className="compact-list">
                      {guardian.linkedChildren.map((child) => (
                        <li key={child.student.id}>
                          {studentName(child)} - {child.className ?? 'No active class'}
                        </li>
                      ))}
                    </ul>
                  ) : '-'}
                </td>
                <td>{primaryChildren.map((child) => formatValue(child.relationshipType)).join(', ') || '-'}</td>
                <td><StatusBadge value={guardian.user.status} /></td>
                <td><Link to={`/admin/parents/${guardian.user.id}`}>View parent</Link></td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <EmptyState message={parents.length === 0 ? 'No parents or guardians are visible for this account.' : 'No results match your filters.'} />
      )}
      {canManageUsers ? (
        <>
          <FormBox title="Create parent">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = service.createGuardianUser(userContext, {
                  schoolId: userContext.schoolId,
                  displayName: stringField(form, 'displayName'),
                  email: stringField(form, 'email'),
                });
                onAction(result, 'Parent or guardian created.');
                if (result.ok) {
                  event.currentTarget.reset();
                }
              }}
            >
              <label><span>Parent / guardian name</span><input name="displayName" required /></label>
              <label><span>Email</span><input name="email" placeholder="name@example.test" required type="email" /></label>
              <button type="submit">Create parent</button>
            </form>
          </FormBox>
          <FormBox title="Link parent to student">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = service.createGuardianStudentLink(userContext, {
                  schoolId: userContext.schoolId,
                  guardianUserId: stringField(form, 'guardianUserId'),
                  studentId: stringField(form, 'studentId'),
                  relationshipType: GuardianRelationshipType.Guardian,
                  isPrimary: form.get('isPrimary') === 'on',
                });
                onAction(result, 'Parent linked to student.');
                if (result.ok) {
                  event.currentTarget.reset();
                }
              }}
            >
              <label>
                <span>Parent / guardian</span>
                <select name="guardianUserId">
                  {linkableGuardians.filter((user) => user.role === Role.ParentGuardian).map((user) => (
                    <option key={user.id} value={user.id}>{user.displayName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Student</span>
                <select name="studentId">
                  {linkableStudents.map((summary) => (
                    <option key={summary.student.id} value={summary.student.id}>
                      {summary.student.firstName} {summary.student.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input name="isPrimary" type="checkbox" />
                Primary contact
              </label>
              <button type="submit">Link parent</button>
            </form>
          </FormBox>
        </>
      ) : null}
    </section>
  );
}

export function ParentDetailPage({ service, userContext }: PageProps) {
  const { guardianUserId } = useParams();
  const result = guardianUserId ? service.getGuardianByUserId(userContext, guardianUserId) : undefined;

  if (!result) {
    return <PermissionDenied message="Parent or guardian access is not available." />;
  }

  if (!result.ok) {
    return <PermissionDenied message={result.error.message} />;
  }

  return (
    <section className="panel">
      <PageHeader title={result.value.user.displayName}>
        Parent or guardian identity and linked children only.
      </PageHeader>
      <DetailBox title="Parent / guardian information">
        <dl className="detail-list">
          <div><dt>Email</dt><dd>{result.value.user.email}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge value={result.value.user.status} /></dd></div>
        </dl>
      </DetailBox>
      <DetailBox title="Linked children">
        {result.value.linkedChildren.length > 0 ? (
          <ul>
            {result.value.linkedChildren.map((child) => (
              <li key={child.student.id}>
                {studentName(child)} - {child.className ?? 'No active class'} - {formatValue(child.relationshipType)}
                {child.isPrimary ? ' (primary)' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>No linked children.</p>
        )}
      </DetailBox>
    </section>
  );
}
