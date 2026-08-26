import { GuardianRelationshipType, Role } from '@ai-school-platform/contracts';
import { FormBox } from '../components/FormBox';
import { formatValue, stringField, studentName } from './pageUtils';
import type { ActionPageProps } from './pageTypes';

export function ParentsPage({ service, userContext, onAction }: ActionPageProps) {
  const parents = service.getVisibleGuardians(userContext);
  const linkableGuardians = service.getLinkableGuardians(userContext);
  const linkableStudents = service.getAssignableStudents(userContext);
  const canManageUsers = service.canManageUsers(userContext);

  return (
    <section className="panel">
      <h2>Parents</h2>
      <div className="list-grid">
        {parents.map((guardian) => (
          <article className="record" key={guardian.user.id}>
            <h3>{guardian.user.displayName}</h3>
            <p>{guardian.user.email}</p>
            <p>Status: {formatValue(guardian.user.status)}</p>
            <strong>Children</strong>
            <ul>
              {guardian.linkedChildren.map((child) => (
                <li key={child.student.id}>{studentName(child)} - {child.className ?? 'No active class'}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {canManageUsers ? (
        <>
          <FormBox title="Create parent">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = service.createGuardianUser(userContext, {
                  schoolId: userContext.schoolId,
                  displayName: stringField(form, 'displayName'),
                  email: stringField(form, 'email'),
                });
                onAction(result, 'Parent or guardian created.');
              }}
            >
              <input name="displayName" placeholder="Parent / guardian name" />
              <input name="email" placeholder="email@example.test" />
              <button type="submit">Create parent</button>
            </form>
          </FormBox>
          <FormBox title="Link parent to student">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = service.createGuardianStudentLink(userContext, {
                  schoolId: userContext.schoolId,
                  guardianUserId: stringField(form, 'guardianUserId'),
                  studentId: stringField(form, 'studentId'),
                  relationshipType: GuardianRelationshipType.Guardian,
                  isPrimary: form.get('isPrimary') === 'on',
                });
                onAction(result, 'Parent linked to student.');
              }}
            >
              <select name="guardianUserId">
                {linkableGuardians.filter((user) => user.role === Role.ParentGuardian).map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
              <select name="studentId">
                {linkableStudents.map((summary) => (
                  <option key={summary.student.id} value={summary.student.id}>
                    {summary.student.firstName} {summary.student.lastName}
                  </option>
                ))}
              </select>
              <label className="checkbox-label">
                <input name="isPrimary" type="checkbox" />
                Primary contact
              </label>
              <button type="submit">Link parent</button>
            </form>
          </FormBox>
        </>
      ) : null}
    </section>
  );
}
