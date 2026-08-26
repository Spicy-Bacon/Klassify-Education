import { useState } from 'react';
import { DomainErrorCode, StaffClassAssignmentType, type DomainResult, type EntityId } from '@ai-school-platform/contracts';
import { DetailBox } from '../components/DetailBox';
import { FormBox } from '../components/FormBox';
import { Table } from '../components/Table';
import { formatValue, stringField } from './pageUtils';
import type { ActionPageProps } from './pageTypes';
import type { ClassSummary } from '../../identity/identityTypes';

export function ClassesPage({ service, userContext, onAction }: ActionPageProps) {
  const classes = service.getVisibleClasses(userContext);
  const yearGroups = service.getVisibleYearGroups(userContext);
  const [selectedClassId, setSelectedClassId] = useState<EntityId | undefined>(classes[0]?.class.id);
  const selectedClass = selectedClassId ? service.getClassById(userContext, selectedClassId) : undefined;
  const canManageClasses = service.canManageClasses(userContext);

  return (
    <section className="panel">
      <h2>Classes</h2>
      <Table headers={['Class', 'Year group', 'Students', 'Assigned teachers', 'Status', 'Actions']}>
        {classes.map((summary) => (
          <tr key={summary.class.id}>
            <td>{summary.class.name}</td>
            <td>{summary.yearGroup?.name ?? '-'}</td>
            <td>{summary.students.length}</td>
            <td>{summary.teachers.map((teacher) => teacher.displayName).join(', ') || '-'}</td>
            <td>{formatValue(summary.class.status)}</td>
            <td>
              <button type="button" onClick={() => setSelectedClassId(summary.class.id)}>
                View class
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {selectedClass ? <ClassDetail result={selectedClass} /> : null}
      {canManageClasses ? (
        <>
          <FormBox title="Create class">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = service.createClass(userContext, {
                  schoolId: userContext.schoolId,
                  yearGroupId: stringField(form, 'yearGroupId') || undefined,
                  name: stringField(form, 'name'),
                  academicYear: stringField(form, 'academicYear') || undefined,
                });
                onAction(result, 'Class created.');
              }}
            >
              <input name="name" placeholder="Class name" />
              <input name="academicYear" placeholder="Academic year" />
              <select name="yearGroupId" defaultValue="">
                <option value="">No year group</option>
                {yearGroups.map((yearGroup) => (
                  <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
                ))}
              </select>
              <button type="submit">Create class</button>
            </form>
          </FormBox>
          <TeacherAssignmentForm service={service} userContext={userContext} onAction={onAction} />
        </>
      ) : null}
    </section>
  );
}

function ClassDetail({ result }: { result: DomainResult<ClassSummary> }) {
  if (!result.ok) {
    return <DetailBox title="Class Detail"><p>{result.error.message}</p></DetailBox>;
  }

  return (
    <DetailBox title={`Class ${result.value.class.name}`}>
      <div className="columns">
        <div>
          <h3>Teachers</h3>
          <ul>
            {result.value.teachers.map((teacher) => <li key={teacher.id}>{teacher.displayName}</li>)}
          </ul>
        </div>
        <div>
          <h3>Students</h3>
          <ul>
            {result.value.students.map((student) => <li key={student.id}>{student.firstName} {student.lastName}</li>)}
          </ul>
        </div>
      </div>
    </DetailBox>
  );
}

function TeacherAssignmentForm({ service, userContext, onAction }: ActionPageProps) {
  const teachers = service.getAssignableTeachers(userContext);
  const classes = service.getManageableClasses(userContext);

  return (
    <FormBox title="Assign teacher to class">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const staffProfileId = stringField(form, 'staffProfileId');
          const teacher = teachers.find((candidate) => candidate.profile.id === staffProfileId);
          const result = teacher
            ? service.createStaffClassAssignment(userContext, {
                schoolId: userContext.schoolId,
                staffProfileId,
                staffUserId: teacher.user.id,
                classId: stringField(form, 'classId'),
                assignmentType: StaffClassAssignmentType.SubjectTeacher,
              })
            : {
                ok: false as const,
                error: {
                  code: DomainErrorCode.NotFound,
                  message: 'Staff profile was not found.',
                },
              };
          onAction(result, 'Teacher assigned to class.');
        }}
      >
        <select name="staffProfileId">
          {teachers.map((teacher) => (
            <option key={teacher.profile.id} value={teacher.profile.id}>{teacher.user.displayName}</option>
          ))}
        </select>
        <select name="classId">
          {classes.map((summary) => (
            <option key={summary.class.id} value={summary.class.id}>{summary.class.name}</option>
          ))}
        </select>
        <button type="submit">Assign teacher</button>
      </form>
    </FormBox>
  );
}
