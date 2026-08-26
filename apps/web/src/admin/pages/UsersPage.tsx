import { Table } from '../components/Table';
import { formatValue } from './pageUtils';
import type { PageProps } from './pageTypes';

export function UsersPage({ service, userContext }: PageProps) {
  const users = service.getVisibleUsers(userContext);

  return (
    <section className="panel">
      <h2>Users</h2>
      <Table headers={['Name', 'Email', 'Role', 'Status']}>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.displayName}</td>
            <td>{user.email}</td>
            <td>{formatValue(user.role)}</td>
            <td>{formatValue(user.status)}</td>
          </tr>
        ))}
      </Table>
    </section>
  );
}
