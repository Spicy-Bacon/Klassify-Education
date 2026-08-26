import type { AdminSectionId } from '../identity/identityTypes';

export interface AdminRoute {
  id: AdminSectionId;
  path: string;
  label: string;
}

export const adminRoutes: AdminRoute[] = [
  { id: 'overview', path: '/admin', label: 'Overview' },
  { id: 'users', path: '/admin/users', label: 'Users' },
  { id: 'students', path: '/admin/students', label: 'Students' },
  { id: 'parents', path: '/admin/parents', label: 'Parents' },
  { id: 'staff', path: '/admin/staff', label: 'Staff' },
  { id: 'classes', path: '/admin/classes', label: 'Classes' },
];

export function getRouteForPath(path: string, visibleRoutes: AdminRoute[]): AdminRoute {
  return visibleRoutes.find((route) => route.path === path) ?? visibleRoutes[0] ?? adminRoutes[0];
}
