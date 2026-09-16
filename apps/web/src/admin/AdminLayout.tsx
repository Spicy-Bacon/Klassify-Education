import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import type { EntityId, User } from '@klassify/contracts';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import type { AdminRouteDefinition } from './routes';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminLayout({
  allowIdentitySwitching,
  currentUser,
  identityOptions,
  message,
  navigationRoutes,
  onIdentityChange,
  revision,
  selectedUserId,
  children,
}: {
  allowIdentitySwitching: boolean;
  children?: ReactNode;
  currentUser?: User;
  identityOptions: IdentityOption[];
  message?: string;
  navigationRoutes: AdminRouteDefinition[];
  onIdentityChange: (userId: EntityId) => void;
  revision: number;
  selectedUserId: EntityId;
}) {
  return (
    <main className="admin-workspace" data-revision={revision}>
      <AdminTopBar
        allowIdentitySwitching={allowIdentitySwitching}
        currentUser={currentUser}
        identityOptions={identityOptions}
        selectedUserId={selectedUserId}
        onIdentityChange={onIdentityChange}
      />
      <div className="admin-body">
        <AdminSidebar routes={navigationRoutes} />
        <section className="admin-content" aria-live="polite">
          {message ? <p className="notice">{message}</p> : null}
          {children ?? <Outlet />}
        </section>
      </div>
    </main>
  );
}
