import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { AuthenticatedUserContext, DomainResult, EntityId, User } from '@ai-school-platform/contracts';
import { AdminLayout } from './AdminLayout';
import { PermissionDenied } from './components/PermissionDenied';
import { adminRoutes } from './routes';
import { AnnouncementDetailPage, AnnouncementEditorPage, AnnouncementsPage } from './pages/AnnouncementsPage';
import { AdminHome } from './pages/AdminHome';
import { ClassDetailPage, ClassesPage } from './pages/ClassesPage';
import { FormDetailPage, FormEditorPage, FormResponsesPage, FormsPage } from './pages/FormsPage';
import { ParentDetailPage, ParentsPage } from './pages/ParentsPage';
import { StaffPage } from './pages/StaffPage';
import { StudentDetailPage, StudentsPage } from './pages/StudentsPage';
import { UsersPage } from './pages/UsersPage';
import type { AnnouncementService } from '../announcements/AnnouncementService';
import type { FormService } from '../forms/FormService';
import type { IdentityService } from '../identity/identityService';
import type { IdentityOption } from '../identity/identityTypes';

export function AdminApp({
  allowIdentitySwitching,
  announcementService,
  formService,
  identityOptions,
  identityService,
  initialUserId,
}: {
  allowIdentitySwitching: boolean;
  announcementService: AnnouncementService;
  formService: FormService;
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
      return [];
    }

    if (!identityService.canAccessAdminPortal(userContext)) {
      return [];
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

  if (!identityService.canAccessAdminPortal(userContext)) {
    return (
      <AdminLayout
        allowIdentitySwitching={allowIdentitySwitching}
        currentUser={currentUser}
        identityOptions={identityOptions}
        message={message}
        navigationRoutes={[]}
        selectedUserId={selectedUserId}
        onIdentityChange={setSelectedUserId}
        revision={revision}
      >
        <PermissionDenied
          title="School administration unavailable"
          message="You do not have access to the school administration portal."
        />
      </AdminLayout>
    );
  }

  const guarded = (sectionId: typeof adminRoutes[number]['id'], element: ReactElement) => (
    <AdminRouteGuard identityService={identityService} sectionId={sectionId} userContext={userContext}>
      {element}
    </AdminRouteGuard>
  );

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
        <Route index element={guarded('overview', <AdminHome service={identityService} announcementService={announcementService} formService={formService} userContext={userContext} />)} />
        <Route path="users" element={guarded('users', <UsersPage service={identityService} userContext={userContext} />)} />
        <Route path="students" element={guarded('students', <StudentsPage service={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="students/:studentId" element={guarded('students', <StudentDetailPage service={identityService} userContext={userContext} />)} />
        <Route path="parents" element={guarded('parents', <ParentsPage service={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="parents/:guardianUserId" element={guarded('parents', <ParentDetailPage service={identityService} userContext={userContext} />)} />
        <Route path="staff" element={guarded('staff', <StaffPage service={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="classes" element={guarded('classes', <ClassesPage service={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="classes/:classId" element={guarded('classes', <ClassDetailPage service={identityService} userContext={userContext} />)} />
        <Route path="announcements" element={guarded('announcements', <AnnouncementsPage announcementService={announcementService} identityService={identityService} userContext={userContext} />)} />
        <Route path="announcements/new" element={guarded('announcements', <AnnouncementEditorPage announcementService={announcementService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="announcements/:announcementId" element={guarded('announcements', <AnnouncementDetailPage announcementService={announcementService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="announcements/:announcementId/edit" element={guarded('announcements', <AnnouncementEditorPage announcementService={announcementService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="forms" element={guarded('forms', <FormsPage formService={formService} userContext={userContext} />)} />
        <Route path="forms/new" element={guarded('forms', <FormEditorPage formService={formService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="forms/:formId" element={guarded('forms', <FormDetailPage formService={formService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="forms/:formId/edit" element={guarded('forms', <FormEditorPage formService={formService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
        <Route path="forms/:formId/responses" element={guarded('forms', <FormResponsesPage formService={formService} identityService={identityService} userContext={userContext} onAction={completeAction} />)} />
      </Route>
      <Route path="*" element={<Navigate replace to="/admin" />} />
    </Routes>
  );
}

function AdminRouteGuard({
  children,
  identityService,
  sectionId,
  userContext,
}: {
  children: ReactElement;
  identityService: IdentityService;
  sectionId: typeof adminRoutes[number]['id'];
  userContext: AuthenticatedUserContext;
}) {
  const access = identityService.canAccessAdminSection(userContext, sectionId);

  if (!access.ok) {
    return <PermissionDenied message={access.error.message} />;
  }

  return children;
}
