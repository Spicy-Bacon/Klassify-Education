import type { AdminRouteDefinition } from '../routes';

export function AdminNavigation({
  currentPath,
  routes,
  onNavigate,
}: {
  currentPath: string;
  routes: AdminRouteDefinition[];
  onNavigate: (targetPath: string) => void;
}) {
  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {routes.map((route) => (
        <a
          aria-current={currentPath === route.path ? 'page' : undefined}
          href={route.path}
          key={route.path}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(route.path);
          }}
        >
          {route.label}
        </a>
      ))}
    </nav>
  );
}
