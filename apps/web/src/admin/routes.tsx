import type { AdminSectionId } from '../identity/identityTypes';

export type AdminNavigationGroup = 'primary' | 'people' | 'communication' | 'future';

export interface AdminRouteDefinition {
  id: AdminSectionId;
  path: string;
  label: string;
  group: AdminNavigationGroup;
  enabled: boolean;
}

export const adminRoutes: AdminRouteDefinition[] = [
  { id: 'overview', path: '/admin', label: 'Overview', group: 'primary', enabled: true },
  { id: 'students', path: '/admin/students', label: 'Students', group: 'people', enabled: true },
  { id: 'parents', path: '/admin/parents', label: 'Parents', group: 'people', enabled: true },
  { id: 'staff', path: '/admin/staff', label: 'Staff', group: 'people', enabled: true },
  { id: 'users', path: '/admin/users', label: 'Users', group: 'people', enabled: true },
  { id: 'classes', path: '/admin/classes', label: 'Classes', group: 'primary', enabled: true },
  { id: 'announcements', path: '/admin/announcements', label: 'Announcements', group: 'communication', enabled: true },
];

export const futureAdminRoutes = [
  { path: '/admin/messaging', label: 'Messaging - later' },
  { path: '/admin/forms', label: 'Forms' },
  { path: '/admin/attendance', label: 'Attendance' },
  { path: '/admin/events', label: 'Events' },
  { path: '/admin/media', label: 'Media' },
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/settings', label: 'Settings' },
];
