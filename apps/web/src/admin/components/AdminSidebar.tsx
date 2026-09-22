import { NavLink } from 'react-router-dom';
import type { AdminRouteDefinition } from '../routes';
import { futureAdminRoutes } from '../routes';

export function AdminSidebar({ routes }: { routes: AdminRouteDefinition[] }) {
  const primaryRoutes = routes.filter((route) => route.group === 'primary');
  const peopleRoutes = routes.filter((route) => route.group === 'people');
  const communicationRoutes = routes.filter((route) => route.group === 'communication');

  if (routes.length === 0) {
    return <aside className="admin-sidebar" aria-label="Admin Portal navigation" />;
  }

  return (
    <aside className="admin-sidebar">
      <nav aria-label="Admin Portal">
        <NavGroup routes={primaryRoutes} />
        {peopleRoutes.length > 0 ? (
          <div className="nav-section">
            <p>People</p>
            <NavGroup routes={peopleRoutes} />
          </div>
        ) : null}
        {communicationRoutes.length > 0 ? (
          <div className="nav-section">
            <p>Communication</p>
            <NavGroup routes={communicationRoutes} />
          </div>
        ) : null}
        <div className="nav-section nav-section-disabled">
          <p>Future modules</p>
          {futureAdminRoutes.map((route) => (
            <span aria-disabled="true" className="nav-disabled" key={route.path}>
              {route.label}
            </span>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function NavGroup({ routes }: { routes: AdminRouteDefinition[] }) {
  return (
    <div className="nav-links">
      {routes.map((route) => (
        <NavLink end={route.path === '/admin'} key={route.path} to={route.path}>
          {route.label}
        </NavLink>
      ))}
    </div>
  );
}
