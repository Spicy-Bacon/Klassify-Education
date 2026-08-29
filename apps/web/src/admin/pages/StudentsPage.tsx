import { Link, useParams } from 'react-router-dom';
import { Table } from '../components/Table';
import { DetailBox } from '../components/DetailBox';
import { EmptyState } from '../components/EmptyState';
import { FormBox } from '../components/FormBox';
import { PageHeader } from '../components/PageHeader';
import { PermissionDenied } from '../components/PermissionDenied';
import { StatusBadge } from '../components/StatusBadge';
import { EnrollmentForm } from './EnrollmentForm';
import { formatValue, stringField, studentName } from './pageUtils';
import type { EntityId } from '@klassify/contracts';
import type { ActionPageProps, PageProps } from './pageTypes';
import { useState } from 'react';
import { filterStudents } from './listFilters';

export function StudentsPage({ service, userContext, onAction }: ActionPageProps) {
  const students = service.getVisibleStudents(userContext);
  const yearGroups = service.getVisibleYearGroups(userContext);
  const classes = service.getVisibleClasses(userContext);
  const [query, setQuery] = useState('');
  const [yearGroupId, setYearGroupId] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const filteredStudents = filterStudents(students, { classId, query, status, yearGroupId });
  const canManageUsers = service.canManageUsers(userContext);

  return (
    <section className="panel">
      <PageHeader title="Students">Manage identity and class placement basics.</PageHeader>
      <div className="filter-bar" role="search">
        <label>
          <span>Search students</span>
          <input name="studentSearch" placeholder="Search students..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Year</span>
          <select value={yearGroupId} onChange={(event) => setYearGroupId(event.target.value)}>
            <option value="">All years</option>
            {yearGroups.map((yearGroup) => <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>)}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">All classes</option>
            {classes.map((summary) => <option key={summary.class.id} value={summary.class.id}>{summary.class.name}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </label>
      </div>
      {filteredStudents.length > 0 ? (
        <Table headers={['Student', 'Student Number', 'Year', 'Class', 'Status', 'Actions']}>
          {filteredStudents.map((summary) => (
            <tr key={summary.student.id}>
              <td>{studentName(summary)}</td>
              <td>{summary.student.studentNumber}</td>
              <td>{summary.yearGroup?.name ?? '-'}</td>
              <td>{summary.className ?? '-'}</td>
              <td><StatusBadge value={summary.student.status} /></td>
              <td><Link to={`/admin/students/${summary.student.id}`}>View student</Link></td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState message={students.length === 0 ? 'No students are visible for this account.' : 'No results match your filters.'} />
      )}
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
              if (result.ok) {
                event.currentTarget.reset();
              }
            }}
          >
            <label><span>Student number</span><input name="studentNumber" required /></label>
            <label><span>First name</span><input name="firstName" required /></label>
            <label><span>Last name</span><input name="lastName" required /></label>
            <label><span>Preferred name</span><input name="preferredName" /></label>
            <label>
              <span>Year</span>
              <select name="yearGroupId" defaultValue="">
                <option value="">No year group</option>
                {yearGroups.map((yearGroup) => (
                  <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
                ))}
              </select>
            </label>
            <button type="submit">Add student</button>
          </form>
        </FormBox>
      ) : null}
      <EnrollmentForm service={service} userContext={userContext} onAction={onAction} />
    </section>
  );
}

export function StudentDetailPage({ service, userContext }: PageProps) {
  const { studentId } = useParams();
  const result = studentId ? service.getStudentDetailById(userContext, studentId as EntityId) : undefined;

  if (!result) {
    return <PermissionDenied message="Student access is not available." />;
  }

  if (!result.ok) {
    return <PermissionDenied message={result.error.message} />;
  }

  return (
    <section className="panel">
      <PageHeader title={studentName(result.value)}>
        Student identity and school structure information only.
      </PageHeader>
      <DetailBox title="Student information">
        <dl className="detail-list">
          <div><dt>Student number</dt><dd>{result.value.student.studentNumber}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge value={result.value.student.status} /></dd></div>
          <div><dt>Year group</dt><dd>{result.value.yearGroup?.name ?? '-'}</dd></div>
          <div><dt>Class</dt><dd>{result.value.className ?? '-'}</dd></div>
        </dl>
      </DetailBox>
      <DetailBox title="Linked parents / guardians">
        {result.value.guardians.length > 0 ? (
          <ul>
            {result.value.guardians.map((guardian) => (
              <li key={guardian.user.id}>
                {guardian.user.displayName} - {formatValue(guardian.relationshipType)}
                {guardian.isPrimary ? ' (primary)' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>No linked parents or guardians.</p>
        )}
      </DetailBox>
    </section>
  );
}
