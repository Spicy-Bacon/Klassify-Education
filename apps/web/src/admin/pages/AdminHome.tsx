import { Metric } from './Metric';
import type { PageProps } from './pageTypes';

export function AdminHome({ service, userContext }: PageProps) {
  const classes = service.getVisibleClasses(userContext);
  const students = service.getVisibleStudents(userContext);
  const staff = service.getVisibleStaff(userContext);
  const parents = service.getVisibleGuardians(userContext);
  const users = service.getVisibleUsers(userContext);

  return (
    <section className="panel">
      <h2>School Administration</h2>
      <div className="metric-grid">
        <Metric label="Users" value={users.length} />
        <Metric label="Students" value={students.length} />
        <Metric label="Parents" value={parents.length} />
        <Metric label="Staff" value={staff.length} />
        <Metric label="Classes" value={classes.length} />
      </div>
    </section>
  );
}
