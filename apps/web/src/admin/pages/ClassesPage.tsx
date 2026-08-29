import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DomainErrorCode, StaffClassAssignmentType, type DomainResult, type EntityId } from '@klassify/contracts';
import { DetailBox } from '../components/DetailBox';
import { EmptyState } from '../components/EmptyState';
import { FormBox } from '../components/FormBox';
import { PageHeader } from '../components/PageHeader';
import { PermissionDenied } from '../components/PermissionDenied';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { filterClasses } from './listFilters';
import { formatValue, stringField } from './pageUtils';
import type { ActionPageProps, PageProps } from './pageTypes';
import type { ClassSummary } from '../../identity/identityTypes';

export function ClassesPage({ service, userContext, onAction }: ActionPageProps) {
  const classes = service.getVisibleClasses(userContext);
  const yearGroups = service.getVisibleYearGroups(userContext);
  const [query, setQuery] = useState('');
  const filteredClasses = filterClasses(classes, query);
  const canManageClasses = service.canManageClasses(userContext);

  return (
    <section className="panel">
      <PageHeader title="Classes">Review class structure, students and assigned teachers.</PageHeader>
      <div className="filter-bar" role="search">
        <label>
          <span>Search classes</span>
          <input placeholder="Search classes..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      {filteredClasses.length > 0 ? (
        <Table headers={['Class', 'Year group', 'Students', 'Assigned teachers', 'Status', 'Actions']}>
          {filteredClasses.map((summary) => (
            <tr key={summary.class.id}>
              <td>{summary.class.name}</td>
              <td>{summary.yearGroup?.name ?? '-'}</td>
              <td>{summary.students.length}</td>
              <td>{summary.teachers.map((teacher) => teacher.displayName).join(', ') || '-'}</td>
              <td><StatusBadge value={summary.class.status} /></td>
              <td><Link to={`/admin/classes/${summary.class.id}`}>View class</Link></td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState message={classes.length === 0 ? 'No classes are visible for this account.' : 'No results match your filters.'} />
      )}
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
                if (result.ok) {
                  event.currentTarget.reset();
                }
              }}
            >
              <label><span>Class name</span><input name="name" required /></label>
              <label><span>Academic year</span><input name="academicYear" /></label>
              <label>
                <span>Year group</span>
                <select name="yearGroupId" defaultValue="">
                  <option value="">No year group</option>
                  {yearGroups.map((yearGroup) => (
                    <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit">Create class</button>
            </form>
          </FormBox>
          <TeacherAssignmentForm service={service} userContext={userContext} onAction={onAction} />
        </>
      ) : null}
    </section>
  );
}

export function ClassDetailPage({ service, userContext }: PageProps) {
  const { classId } = useParams();
  const result = classId ? service.getClassById(userContext, classId as EntityId) : undefined;

  if (!result) {
    return <PermissionDenied message="Class access is not available." />;
  }

  if (!result.ok) {
    return <PermissionDenied message={result.error.message} />;
  }

  return <ClassDetail result={result} />;
}

function ClassDetail({ result }: { result: DomainResult<ClassSummary> }) {
  if (!result.ok) {
    return <DetailBox title="Class Detail"><p>{result.error.message}</p></DetailBox>;
  }

  return (
    <section className="panel">
      <PageHeader title={`Class ${result.value.class.name}`}>
        Class identity, assigned teachers and enrolled students.
      </PageHeader>
      <DetailBox title="Class information">
        <dl className="detail-list">
          <div><dt>Year group</dt><dd>{result.value.yearGroup?.name ?? '-'}</dd></div>
          <div><dt>Academic year</dt><dd>{result.value.class.academicYear ?? '-'}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge value={result.value.class.status} /></dd></div>
        </dl>
      </DetailBox>
      <DetailBox title="People">
        <div className="columns">
          <div>
            <h3>Teachers</h3>
            {result.value.teachers.length > 0 ? (
              <ul>{result.value.teachers.map((teacher) => <li key={teacher.id}>{teacher.displayName}</li>)}</ul>
            ) : <p>No assigned teachers.</p>}
          </div>
          <div>
            <h3>Students</h3>
            {result.value.students.length > 0 ? (
              <ul>{result.value.students.map((student) => <li key={student.id}>{student.firstName} {student.lastName}</li>)}</ul>
            ) : <p>No enrolled students.</p>}
          </div>
        </div>
      </DetailBox>
    </section>
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
          if (result.ok) {
            event.currentTarget.reset();
          }
        }}
      >
        <label>
          <span>Teacher</span>
          <select name="staffProfileId">
            {teachers.map((teacher) => (
              <option key={teacher.profile.id} value={teacher.profile.id}>{teacher.user.displayName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select name="classId">
            {classes.map((summary) => (
              <option key={summary.class.id} value={summary.class.id}>{summary.class.name}</option>
            ))}
          </select>
        </label>
        <button type="submit">Assign teacher</button>
      </form>
    </FormBox>
  );
}
