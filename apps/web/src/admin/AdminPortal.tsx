import { useMemo, useState } from 'react';
import type { DomainResult, EntityId, User } from '@ai-school-platform/contracts';
import { AdminNavigation } from './components/AdminNavigation';
import { DevelopmentIdentitySwitcher } from './components/DevelopmentIdentitySwitcher';
import { adminRoutes, getRouteForPath } from './routes';
import { AdminHome } from './pages/AdminHome';
import { ClassesPage } from './pages/ClassesPage';
import { ParentsPage } from './pages/ParentsPage';
import { StaffPage } from './pages/StaffPage';
import { StudentsPage } from './pages/StudentsPage';
import { UsersPage } from './pages/UsersPage';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminPortal({
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
  const [path, setPath] = useState(window.location.pathname);
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
  const currentRoute = getRouteForPath(path, visibleRoutes);

  const navigate = (targetPath: string) => {
    window.history.pushState({}, '', targetPath);
    setPath(targetPath);
  };

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
    <main className="admin-shell" data-revision={revision}>
      <header className="admin-header">
        <div>
          <p className="status">Development Build</p>
          <h1>AI School Platform</h1>
          <p className="subtitle">School Administration</p>
        </div>
        <DevelopmentIdentitySwitcher
          allowIdentitySwitching={allowIdentitySwitching}
          currentUser={currentUser}
          identityOptions={identityOptions}
          selectedUserId={selectedUserId}
          onChange={setSelectedUserId}
        />
      </header>

      <AdminNavigation currentPath={currentRoute.path} routes={visibleRoutes} onNavigate={navigate} />

      {message ? <p className="notice">{message}</p> : null}

      {currentRoute.id === 'users' ? (
        <UsersPage service={identityService} userContext={userContext} />
      ) : currentRoute.id === 'students' ? (
        <StudentsPage service={identityService} userContext={userContext} onAction={completeAction} />
      ) : currentRoute.id === 'parents' ? (
        <ParentsPage service={identityService} userContext={userContext} onAction={completeAction} />
      ) : currentRoute.id === 'staff' ? (
        <StaffPage service={identityService} userContext={userContext} onAction={completeAction} />
      ) : currentRoute.id === 'classes' ? (
        <ClassesPage service={identityService} userContext={userContext} onAction={completeAction} />
      ) : (
        <AdminHome service={identityService} userContext={userContext} />
      )}
    </main>
  );
}
