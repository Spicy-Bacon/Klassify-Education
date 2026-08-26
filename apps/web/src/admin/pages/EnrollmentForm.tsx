import { FormBox } from '../components/FormBox';
import { stringField } from './pageUtils';
import type { ActionPageProps } from './pageTypes';

export function EnrollmentForm({ service, userContext, onAction }: ActionPageProps) {
  const students = service.getAssignableStudents(userContext);
  const classes = service.getManageableClasses(userContext);

  if (!service.canManageClasses(userContext)) {
    return null;
  }

  return (
    <FormBox title="Enroll student into class">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = service.createClassEnrollment(userContext, {
            schoolId: userContext.schoolId,
            studentId: stringField(form, 'studentId'),
            classId: stringField(form, 'classId'),
          });
          onAction(result, 'Student enrolled into class.');
        }}
      >
        <select name="studentId">
          {students.map((summary) => (
            <option key={summary.student.id} value={summary.student.id}>
              {summary.student.firstName} {summary.student.lastName}
            </option>
          ))}
        </select>
        <select name="classId">
          {classes.map((summary) => (
            <option key={summary.class.id} value={summary.class.id}>{summary.class.name}</option>
          ))}
        </select>
        <button type="submit">Enroll student</button>
      </form>
    </FormBox>
  );
}
