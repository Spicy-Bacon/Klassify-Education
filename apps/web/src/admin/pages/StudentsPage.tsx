import { Table } from '../components/Table';
import { DetailBox } from '../components/DetailBox';
import { FormBox } from '../components/FormBox';
import { EnrollmentForm } from './EnrollmentForm';
import { formatValue, stringField, studentName } from './pageUtils';
import type { EntityId } from '@ai-school-platform/contracts';
import type { ActionPageProps } from './pageTypes';
import { useState } from 'react';

export function StudentsPage({ service, userContext, onAction }: ActionPageProps) {
  const students = service.getVisibleStudents(userContext);
  const yearGroups = service.getVisibleYearGroups(userContext);
  const [selectedStudentId, setSelectedStudentId] = useState<EntityId | undefined>();
  const selectedStudent = selectedStudentId ? service.getStudentById(userContext, selectedStudentId) : undefined;
  const canManageUsers = service.canManageUsers(userContext);

  return (
    <section className="panel">
      <h2>Students</h2>
      <Table headers={['Student', 'Student Number', 'Year', 'Class', 'Status', 'Actions']}>
        {students.map((summary) => (
          <tr key={summary.student.id}>
            <td>{studentName(summary)}</td>
            <td>{summary.student.studentNumber}</td>
            <td>{summary.yearGroup?.name ?? '-'}</td>
            <td>{summary.className ?? '-'}</td>
            <td>{formatValue(summary.student.status)}</td>
            <td>
              <button type="button" onClick={() => setSelectedStudentId(summary.student.id)}>
                View student
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {selectedStudent ? (
        <DetailBox title="Student Detail">
          {selectedStudent.ok ? (
            <p>{studentName(selectedStudent.value)} - {selectedStudent.value.className ?? 'No active class'}</p>
          ) : (
            <p>{selectedStudent.error.message}</p>
          )}
        </DetailBox>
      ) : null}
      {canManageUsers ? (
        <FormBox title="Add student">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = service.createStudent(userContext, {
                schoolId: userContext.schoolId,
                studentNumber: stringField(form, 'studentNumber'),
                firstName: stringField(form, 'firstName'),
                lastName: stringField(form, 'lastName'),
                preferredName: stringField(form, 'preferredName'),
                yearGroupId: stringField(form, 'yearGroupId') || undefined,
              });
              onAction(result, 'Student added.');
            }}
          >
            <input name="studentNumber" placeholder="Student number" />
            <input name="firstName" placeholder="First name" />
            <input name="lastName" placeholder="Last name" />
            <input name="preferredName" placeholder="Preferred name" />
            <select name="yearGroupId" defaultValue="">
              <option value="">No year group</option>
              {yearGroups.map((yearGroup) => (
                <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
              ))}
            </select>
            <button type="submit">Add student</button>
          </form>
        </FormBox>
      ) : null}
      <EnrollmentForm service={service} userContext={userContext} onAction={onAction} />
    </section>
  );
}
