import { useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { filterUsers } from './listFilters';
import { formatValue } from './pageUtils';
import type { PageProps } from './pageTypes';

export function UsersPage({ service, userContext }: PageProps) {
  const users = service.getVisibleUsers(userContext);
  const [query, setQuery] = useState('');
  const filteredUsers = filterUsers(users, query);

  return (
    <section className="panel">
      <PageHeader title="Users">Platform login identities for the current school.</PageHeader>
      <div className="filter-bar" role="search">
        <label>
          <span>Search users</span>
          <input placeholder="Search users..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {filteredUsers.length > 0 ? (
        <Table headers={['Name', 'Email', 'Role', 'Status']}>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.displayName}</td>
              <td>{user.email}</td>
              <td>{formatValue(user.role)}</td>
              <td><StatusBadge value={user.status} /></td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState message={users.length === 0 ? 'No users are visible for this account.' : 'No results match your filters.'} />
      )}
    </section>
  );
}
