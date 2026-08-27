import { useState } from 'react';
import { Role } from '@ai-school-platform/contracts';
import { EmptyState } from '../components/EmptyState';
import { FormBox } from '../components/FormBox';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { filterStaff } from './listFilters';
import { formatValue, stringField } from './pageUtils';
import type { ActionPageProps } from './pageTypes';

export function StaffPage({ service, userContext, onAction }: ActionPageProps) {
  const staff = service.getVisibleStaff(userContext);
  const [query, setQuery] = useState('');
  const filteredStaff = filterStaff(staff, query);

  return (
    <section className="panel">
      <PageHeader title="Staff">Manage staff identity and class assignment basics.</PageHeader>
      <div className="filter-bar" role="search">
        <label>
          <span>Search staff</span>
          <input placeholder="Search staff..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {filteredStaff.length > 0 ? (
        <Table headers={['Name', 'Role', 'Job title', 'Department', 'Assigned classes', 'Status']}>
          {filteredStaff.map((summary) => (
            <tr key={summary.user.id}>
              <td>{summary.user.displayName}</td>
              <td>{formatValue(summary.user.role)}</td>
              <td>{summary.profile?.jobTitle ?? '-'}</td>
              <td>{summary.profile?.department ?? '-'}</td>
              <td>{summary.assignedClassNames.join(', ') || '-'}</td>
              <td><StatusBadge value={summary.user.status} /></td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState message={staff.length === 0 ? 'No staff are visible for this account.' : 'No results match your filters.'} />
      )}
      {service.canManageUsers(userContext) ? (
        <FormBox title="Create staff user">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = service.createStaffUser(userContext, {
                schoolId: userContext.schoolId,
                displayName: stringField(form, 'displayName'),
                email: stringField(form, 'email'),
                role: Role.Teacher,
                jobTitle: stringField(form, 'jobTitle'),
                department: stringField(form, 'department'),
              });
              onAction(result, 'Staff user created.');
              if (result.ok) {
                event.currentTarget.reset();
              }
            }}
          >
            <label><span>Name</span><input name="displayName" required /></label>
            <label><span>Email</span><input name="email" placeholder="name@example.test" required type="email" /></label>
            <label><span>Job title</span><input name="jobTitle" /></label>
            <label><span>Department</span><input name="department" /></label>
            <button type="submit">Create staff user</button>
          </form>
        </FormBox>
      ) : null}
    </section>
  );
}
