import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DomainErrorCode,
  GuardianRelationshipType,
  Role,
  StaffClassAssignmentType,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
  type User,
} from '../../../../packages/contracts/src';
import { DevelopmentIdentityRepository, developmentIdentityIds } from '../identity/developmentIdentityRepository';
import { IdentityService, type ClassSummary, type StudentSummary } from '../identity/identityService';

const routes = [
  { path: '/admin', label: 'Overview' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/students', label: 'Students' },
  { path: '/admin/parents', label: 'Parents' },
  { path: '/admin/staff', label: 'Staff' },
  { path: '/admin/classes', label: 'Classes' },
];

export function AdminPortal() {
  const [repository] = useState(() => new DevelopmentIdentityRepository());
  const service = useMemo(() => new IdentityService(repository), [repository]);
  const [path, setPath] = useState(window.location.pathname);
  const [selectedUserId, setSelectedUserId] = useState(developmentIdentityIds.principal);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  const userContextResult = service.createUserContext(selectedUserId);
  const userContext = userContextResult.ok ? userContextResult.value : undefined;
  const snapshot = service.getSnapshot();
  const currentUser = snapshot.users.find((user) => user.id === selectedUserId);

  const navigate = (targetPath: string) => {
    window.history.pushState({}, '', targetPath);
    setPath(targetPath);
  };

  const completeAction = <T,>(result: DomainResult<T>, successMessage: string) => {
    if (result.ok) {
      setRevision((current) => current + 1);
      setMessage(successMessage);
      return;
    }

    setMessage(result.error.message);
  };

  if (!userContext) {
    return <p>Development identity could not be loaded.</p>;
  }

  return (
    <main className="admin-shell" data-revision={revision}>
      <header className="admin-header">
        <div>
          <p className="status">Development Build</p>
          <h1>AI School Platform</h1>
          <p className="subtitle">School Administration</p>
        </div>
        <DevelopmentIdentitySwitcher
          selectedUserId={selectedUserId}
          users={snapshot.users}
          onChange={setSelectedUserId}
          currentUser={currentUser}
        />
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {routes.map((route) => (
          <a
            aria-current={path === route.path ? 'page' : undefined}
            href={route.path}
            key={route.path}
            onClick={(event) => {
              event.preventDefault();
              navigate(route.path);
            }}
          >
            {route.label}
          </a>
        ))}
      </nav>

      {message ? <p className="notice">{message}</p> : null}

      {path === '/admin/users' ? (
        <UsersPage service={service} userContext={userContext} />
      ) : path === '/admin/students' ? (
        <StudentsPage service={service} userContext={userContext} onAction={completeAction} />
      ) : path === '/admin/parents' ? (
        <ParentsPage service={service} userContext={userContext} onAction={completeAction} />
      ) : path === '/admin/staff' ? (
        <StaffPage service={service} userContext={userContext} onAction={completeAction} />
      ) : path === '/admin/classes' ? (
        <ClassesPage service={service} userContext={userContext} onAction={completeAction} />
      ) : (
        <AdminHome service={service} userContext={userContext} />
      )}
    </main>
  );
}

function DevelopmentIdentitySwitcher({
  selectedUserId,
  users,
  onChange,
  currentUser,
}: {
  selectedUserId: EntityId;
  users: User[];
  onChange: (userId: EntityId) => void;
  currentUser?: User;
}) {
  const options = [
    developmentIdentityIds.principal,
    developmentIdentityIds.admin,
    developmentIdentityIds.teacher3A,
    developmentIdentityIds.parentAmy,
    developmentIdentityIds.studentChloeUser,
  ];

  if (!import.meta.env.DEV) {
    return (
      <aside className="identity-box">
        <span>Signed in as</span>
        <strong>{currentUser?.displayName ?? 'Unknown user'}</strong>
      </aside>
    );
  }

  return (
    <aside className="identity-box identity-box-development">
      <span>DEVELOPMENT ONLY</span>
      <strong>Signed in as</strong>
      <div className="identity-options">
        {options.map((userId) => {
          const user = users.find((candidate) => candidate.id === userId);
          return (
            <button
              className={selectedUserId === userId ? 'active' : undefined}
              key={userId}
              onClick={() => onChange(userId)}
              type="button"
            >
              {user?.displayName ?? userId}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function AdminHome({ service, userContext }: PageProps) {
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

function UsersPage({ service, userContext }: PageProps) {
  const users = service.getVisibleUsers(userContext);

  return (
    <section className="panel">
      <h2>Users</h2>
      <Table headers={['Name', 'Email', 'Role', 'Status']}>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.displayName}</td>
            <td>{user.email}</td>
            <td>{formatValue(user.role)}</td>
            <td>{formatValue(user.status)}</td>
          </tr>
        ))}
      </Table>
    </section>
  );
}

function StudentsPage({ service, userContext, onAction }: ActionPageProps) {
  const students = service.getVisibleStudents(userContext);
  const snapshot = service.getSnapshot();
  const [selectedStudentId, setSelectedStudentId] = useState<EntityId | undefined>();

  const selectedStudent = selectedStudentId ? service.getStudentById(userContext, selectedStudentId) : undefined;

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
            {snapshot.yearGroups.filter((yearGroup) => yearGroup.schoolId === userContext.schoolId).map((yearGroup) => (
              <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
            ))}
          </select>
          <button type="submit">Add student</button>
        </form>
      </FormBox>
      <EnrollmentForm service={service} userContext={userContext} onAction={onAction} />
    </section>
  );
}

function StaffPage({ service, userContext, onAction }: ActionPageProps) {
  const staff = service.getVisibleStaff(userContext);

  return (
    <section className="panel">
      <h2>Staff</h2>
      <Table headers={['Name', 'Role', 'Job title', 'Assigned classes', 'Status']}>
        {staff.map((summary) => (
          <tr key={summary.user.id}>
            <td>{summary.user.displayName}</td>
            <td>{formatValue(summary.user.role)}</td>
            <td>{summary.profile?.jobTitle ?? '-'}</td>
            <td>{summary.assignedClassNames.join(', ') || '-'}</td>
            <td>{formatValue(summary.user.status)}</td>
          </tr>
        ))}
      </Table>
      <FormBox title="Create staff user">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = service.createStaffUser(userContext, {
              schoolId: userContext.schoolId,
              displayName: stringField(form, 'displayName'),
              email: stringField(form, 'email'),
              role: Role.Teacher,
              jobTitle: stringField(form, 'jobTitle'),
              department: stringField(form, 'department'),
            });
            onAction(result, 'Staff user created.');
          }}
        >
          <input name="displayName" placeholder="Name" />
          <input name="email" placeholder="email@example.test" />
          <input name="jobTitle" placeholder="Job title" />
          <input name="department" placeholder="Department" />
          <button type="submit">Create staff user</button>
        </form>
      </FormBox>
    </section>
  );
}

function ParentsPage({ service, userContext, onAction }: ActionPageProps) {
  const parents = service.getVisibleGuardians(userContext);
  const snapshot = service.getSnapshot();

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
            {snapshot.users.filter((user) => user.schoolId === userContext.schoolId && user.role === Role.ParentGuardian).map((user) => (
              <option key={user.id} value={user.id}>{user.displayName}</option>
            ))}
          </select>
          <select name="studentId">
            {snapshot.students.filter((student) => student.schoolId === userContext.schoolId).map((student) => (
              <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>
            ))}
          </select>
          <label className="checkbox-label">
            <input name="isPrimary" type="checkbox" />
            Primary contact
          </label>
          <button type="submit">Link parent</button>
        </form>
      </FormBox>
    </section>
  );
}

function ClassesPage({ service, userContext, onAction }: ActionPageProps) {
  const classes = service.getVisibleClasses(userContext);
  const snapshot = service.getSnapshot();
  const [selectedClassId, setSelectedClassId] = useState<EntityId | undefined>(classes[0]?.class.id);
  const selectedClass = selectedClassId ? service.getClassById(userContext, selectedClassId) : undefined;

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
      {selectedClass ? (
        <ClassDetail result={selectedClass} />
      ) : null}
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
            {snapshot.yearGroups.filter((yearGroup) => yearGroup.schoolId === userContext.schoolId).map((yearGroup) => (
              <option key={yearGroup.id} value={yearGroup.id}>{yearGroup.name}</option>
            ))}
          </select>
          <button type="submit">Create class</button>
        </form>
      </FormBox>
      <TeacherAssignmentForm service={service} userContext={userContext} onAction={onAction} />
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

function EnrollmentForm({ service, userContext, onAction }: ActionPageProps) {
  const snapshot = service.getSnapshot();
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
          {snapshot.students.filter((student) => student.schoolId === userContext.schoolId).map((student) => (
            <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>
          ))}
        </select>
        <select name="classId">
          {snapshot.classes.filter((schoolClass) => schoolClass.schoolId === userContext.schoolId).map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
          ))}
        </select>
        <button type="submit">Enroll student</button>
      </form>
    </FormBox>
  );
}

function TeacherAssignmentForm({ service, userContext, onAction }: ActionPageProps) {
  const snapshot = service.getSnapshot();
  const staffProfiles = snapshot.staffProfiles.filter((profile) => {
    const user = snapshot.users.find((candidate) => candidate.id === profile.userId);
    return profile.schoolId === userContext.schoolId && user?.role === Role.Teacher;
  });
  const classes = snapshot.classes.filter((schoolClass) => schoolClass.schoolId === userContext.schoolId);

  return (
    <FormBox title="Assign teacher to class">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const staffProfileId = stringField(form, 'staffProfileId');
          const staffProfile = staffProfiles.find((profile) => profile.id === staffProfileId);
          const result = staffProfile
            ? service.createStaffClassAssignment(userContext, {
                schoolId: userContext.schoolId,
                staffProfileId,
                staffUserId: staffProfile.userId,
                classId: stringField(form, 'classId'),
                assignmentType: StaffClassAssignmentType.SubjectTeacher,
              })
            : { ok: false as const, error: { code: DomainErrorCode.NotFound, message: 'Staff profile was not found.' } };
          onAction(result, 'Teacher assigned to class.');
        }}
      >
        <select name="staffProfileId">
          {staffProfiles.map((profile) => {
            const user = snapshot.users.find((candidate) => candidate.id === profile.userId);
            return <option key={profile.id} value={profile.id}>{user?.displayName ?? profile.id}</option>;
          })}
        </select>
        <select name="classId">
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
        </select>
        <button type="submit">Assign teacher</button>
      </form>
    </FormBox>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function FormBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="form-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function DetailBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-box">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function studentName(summary: StudentSummary) {
  return `${summary.student.preferredName ?? summary.student.firstName} ${summary.student.lastName}`;
}

function formatValue(value: string) {
  return value.replaceAll('_', ' ');
}

function stringField(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim();
}

interface PageProps {
  service: IdentityService;
  userContext: AuthenticatedUserContext;
}

interface ActionPageProps extends PageProps {
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
}
