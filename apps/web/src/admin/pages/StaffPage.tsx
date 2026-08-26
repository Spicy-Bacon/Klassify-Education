import { Role } from '@ai-school-platform/contracts';
import { FormBox } from '../components/FormBox';
import { Table } from '../components/Table';
import { formatValue, stringField } from './pageUtils';
import type { ActionPageProps } from './pageTypes';

export function StaffPage({ service, userContext, onAction }: ActionPageProps) {
  const staff = service.getVisibleStaff(userContext);

  return (
    <section className="panel">
      <h2>Staff</h2>
      <Table headers={['Name', 'Role', 'Job title', 'Assigned classes', 'Status']}>
        {staff.map((summary) => (
          <tr key={summary.user.id}>
            <td>{summary.user.displayName}</td>
            <td>{formatValue(summary.user.role)}</td>
            <td>{summary.profile?.jobTitle ?? '-'}</td>
            <td>{summary.assignedClassNames.join(', ') || '-'}</td>
            <td>{formatValue(summary.user.status)}</td>
          </tr>
        ))}
      </Table>
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
            }}
          >
            <input name="displayName" placeholder="Name" />
            <input name="email" placeholder="email@example.test" />
            <input name="jobTitle" placeholder="Job title" />
            <input name="department" placeholder="Department" />
            <button type="submit">Create staff user</button>
          </form>
        </FormBox>
      ) : null}
    </section>
  );
}
