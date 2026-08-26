import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { DomainResult, EntityId, User } from '@ai-school-platform/contracts';
import { AdminLayout } from './AdminLayout';
import { adminRoutes } from './routes';
import { AdminHome } from './pages/AdminHome';
import { ClassesPage } from './pages/ClassesPage';
import { ParentsPage } from './pages/ParentsPage';
import { StaffPage } from './pages/StaffPage';
import { StudentsPage } from './pages/StudentsPage';
import { UsersPage } from './pages/UsersPage';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminApp({
  allowIdentitySwitching,
  identityOptions,
  identityService,
  initialUserId,
}: {
  allowIdentitySwitching: boolean;
  identityOptions: IdentityOption[];
  identityService: IdentityService;
  initialUserId: EntityId;
}) {
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  const userContextResult = identityService.createUserContext(selectedUserId);
  const userContext = userContextResult.ok ? userContextResult.value : undefined;
  const currentUserResult = userContext ? identityService.getCurrentUser(userContext) : undefined;
  const currentUser: User | undefined = currentUserResult?.ok ? currentUserResult.value : undefined;

  const visibleRoutes = useMemo(() => {
    if (!userContext) {
      return [adminRoutes[0]];
    }

    const visibleRouteIds = identityService.getVisibleAdminSections(userContext);
    return adminRoutes.filter((route) => visibleRouteIds.includes(route.id));
  }, [identityService, userContext]);

  const completeAction = <T,>(result: DomainResult<T>, successMessage: string) => {
    if (result.ok) {
      setRevision((current) => current + 1);
      setMessage(successMessage);
      return;
    }

    setMessage(result.error.message);
  };

  if (!userContext) {
    return <p>Development identity could not be loaded.</p>;
  }

  return (
    <Routes>
      <Route
        element={(
          <AdminLayout
            allowIdentitySwitching={allowIdentitySwitching}
            currentUser={currentUser}
            identityOptions={identityOptions}
            message={message}
            navigationRoutes={visibleRoutes}
            selectedUserId={selectedUserId}
            onIdentityChange={setSelectedUserId}
            revision={revision}
          />
        )}
        path="/admin"
      >
        <Route index element={<AdminHome service={identityService} userContext={userContext} />} />
        <Route path="users" element={<UsersPage service={identityService} userContext={userContext} />} />
        <Route path="students" element={<StudentsPage service={identityService} userContext={userContext} onAction={completeAction} />} />
        <Route path="parents" element={<ParentsPage service={identityService} userContext={userContext} onAction={completeAction} />} />
        <Route path="staff" element={<StaffPage service={identityService} userContext={userContext} onAction={completeAction} />} />
        <Route path="classes" element={<ClassesPage service={identityService} userContext={userContext} onAction={completeAction} />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/admin" />} />
    </Routes>
  );
}
