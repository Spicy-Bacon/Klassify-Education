import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DomainErrorCode,
  FormAudienceType,
  FormQuestionType,
  FormStatus,
  Role,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
  type FormQuestion,
  type User,
} from '@ai-school-platform/contracts';
import type { FormService } from '../../forms/FormService';
import type { FormDetail } from '../../forms/formTypes';
import type { IdentityService } from '../../identity/identityService';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PermissionDenied } from '../components/PermissionDenied';
import { StatusBadge } from '../components/StatusBadge';
import { Table } from '../components/Table';
import { formatValue } from './pageUtils';

export function FormsPage({ formService, userContext }: {
  formService: FormService;
  userContext: AuthenticatedUserContext;
}) {
  const [status, setStatus] = useState('');
  const [audienceType, setAudienceType] = useState('');
  const [search, setSearch] = useState('');
  const canCreate = formService.canCreate(userContext);

  const forms = useMemo(() => formService.getVisibleForms(userContext, {
    status: status ? status as FormStatus : undefined,
    audienceType: audienceType ? audienceType as FormAudienceType : undefined,
    search,
  }), [audienceType, formService, search, status, userContext]);

  return (
    <section className="panel">
      <PageHeader eyebrow="Connect" title="Forms">
        Digital reply slips, consent forms and parent response tracking.
      </PageHeader>

      <div className="filter-bar">
        <label>
          <span>Search</span>
          <input
            aria-label="Search forms"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search forms..."
            type="search"
            value={search}
          />
        </label>
        <label>
          <span>Status</span>
          <select aria-label="Filter forms by status" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">All statuses</option>
            {Object.values(FormStatus).map((option) => (
              <option key={option} value={option}>{formatValue(option)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Audience</span>
          <select aria-label="Filter forms by audience" onChange={(event) => setAudienceType(event.target.value)} value={audienceType}>
            <option value="">All audiences</option>
            {Object.values(FormAudienceType).map((option) => (
              <option key={option} value={option}>{formatValue(option)}</option>
            ))}
          </select>
        </label>
        {canCreate ? <Link className="button-link" to="/admin/forms/new">Create form</Link> : null}
      </div>

      {forms.length === 0 ? (
        <EmptyState message={canCreate ? 'Create the first development form for this school.' : 'No forms are available for your current scope.'} />
      ) : (
        <Table headers={['Title', 'Audience', 'Status', 'Author', 'Deadline', 'Responses']}>
          {forms.map((item) => (
            <tr key={item.form.id}>
              <td><Link to={`/admin/forms/${item.form.id}`}>{item.form.title}</Link></td>
              <td>{item.audienceLabel}</td>
              <td><StatusBadge value={item.form.status} /></td>
              <td>{item.author?.displayName ?? 'Unknown'}</td>
              <td>{formatDateTime(item.form.deadlineAt)}</td>
              <td>{formatResponseSummary(item.responseSummary)}</td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}

export function FormDetailPage({
  formService,
  identityService,
  onAction,
  userContext,
}: {
  formService: FormService;
  identityService: IdentityService;
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
  userContext: AuthenticatedUserContext;
}) {
  const { formId } = useParams();
  const detail = formId ? formService.getFormById(userContext, formId) : undefined;

  if (!detail) {
    return <PermissionDenied title="Form unavailable" message="Form route is missing a form ID." />;
  }

  if (!detail.ok) {
    return <PermissionDenied title="Form unavailable" message={detail.error.message} />;
  }

  const item = detail.value;
  const canPublish = item.form.status === FormStatus.Draft;
  const canClose = item.form.status === FormStatus.Published;

  return (
    <section className="panel">
      <PageHeader eyebrow="Form" title={item.form.title}>
        {item.audienceLabel}
      </PageHeader>

      <div className="detail-grid">
        <div className="detail-box">
          <h3>Status</h3>
          <p><StatusBadge value={item.form.status} /></p>
          <p>Author: {item.author?.displayName ?? 'Unknown'}</p>
          <p>Created: {formatDateTime(item.form.createdAt)}</p>
          <p>Published: {formatDateTime(item.form.publishedAt)}</p>
          <p>Deadline: {formatDateTime(item.form.deadlineAt)}</p>
        </div>
        <div className="detail-box">
          <h3>Responses</h3>
          <p>Delivered: {item.responseSummary.delivered}</p>
          <p>Submitted: {item.responseSummary.submitted}</p>
          <p>Outstanding: {item.responseSummary.outstanding}</p>
          <p>Completion: {item.responseSummary.completionRate}%</p>
        </div>
        <div className="detail-box">
          <h3>Audience</h3>
          <p>{item.audienceLabel}</p>
          <p>{item.form.requiresChildContext ? 'Child-specific tasks' : 'Parent-level task'}</p>
        </div>
        <div className="detail-box">
          <h3>Questions</h3>
          {item.form.questions.length === 0 ? <p>-</p> : (
            <ol className="compact-list">
              {item.form.questions.map((question) => (
                <li key={question.id}>{question.label} ({formatValue(question.type)}){question.required ? ' *' : ''}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {item.form.description ? <p className="subtle-note">{item.form.description}</p> : null}

      <div className="form-actions">
        {item.form.status === FormStatus.Draft ? <Link className="button-link" to={`/admin/forms/${item.form.id}/edit`}>Edit draft</Link> : null}
        <Link className="button-link" to={`/admin/forms/${item.form.id}/responses`}>View responses</Link>
        {canPublish ? (
          <button onClick={() => onAction(formService.publishForm(userContext, item.form.id), 'Form published.')} type="button">
            Publish
          </button>
        ) : null}
        {canClose ? (
          <button onClick={() => onAction(formService.closeForm(userContext, item.form.id), 'Form closed.')} type="button">
            Close form
          </button>
        ) : null}
      </div>

      <FormRecipientPreview detail={item} identityService={identityService} />
    </section>
  );
}

export function FormResponsesPage({
  formService,
  identityService,
  onAction,
  userContext,
}: {
  formService: FormService;
  identityService: IdentityService;
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
  userContext: AuthenticatedUserContext;
}) {
  const { formId } = useParams();
  const detail = formId ? formService.getFormById(userContext, formId) : undefined;

  if (!detail) {
    return <PermissionDenied title="Responses unavailable" message="Form route is missing a form ID." />;
  }

  if (!detail.ok) {
    return <PermissionDenied title="Responses unavailable" message={detail.error.message} />;
  }

  const usersById = userMap(identityService.getVisibleUsers(userContext));

  return (
    <section className="panel">
      <PageHeader eyebrow="Form responses" title={detail.value.form.title}>
        {formatResponseSummary(detail.value.responseSummary)}
      </PageHeader>
      {detail.value.recipients.length === 0 ? (
        <EmptyState message="No recipients have been generated for this form yet." />
      ) : (
        <Table headers={['Recipient', 'Student context', 'Status', 'Delivered', 'Reminder requests']}>
          {detail.value.recipients.map((recipient) => (
            <tr key={recipient.id}>
              <td>{usersById.get(recipient.userId)?.displayName ?? recipient.userId}</td>
              <td>{recipient.studentId ? studentLabel(identityService, userContext, recipient.studentId) : '-'}</td>
              <td>{recipient.submittedAt ? 'Submitted' : 'Outstanding'}</td>
              <td>{formatDateTime(recipient.deliveredAt)}</td>
              <td>
                {recipient.reminderRequestCount}
                {!recipient.submittedAt ? (
                  <button
                    onClick={() => onAction(formService.requestReminder(userContext, recipient.id), 'Reminder request recorded.')}
                    type="button"
                  >
                    Record reminder
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}

export function FormEditorPage({
  formService,
  identityService,
  onAction,
  userContext,
}: {
  formService: FormService;
  identityService: IdentityService;
  onAction: <T>(result: DomainResult<T>, successMessage: string) => void;
  userContext: AuthenticatedUserContext;
}) {
  const navigate = useNavigate();
  const { formId } = useParams();
  const existing = formId ? formService.getFormById(userContext, formId) : undefined;
  const currentSchool = identityService.getCurrentSchool(userContext);
  const currentUser = identityService.getCurrentUser(userContext);
  const initialForm = existing?.ok ? existing.value.form : undefined;
  const [title, setTitle] = useState(initialForm?.title ?? '');
  const [description, setDescription] = useState(initialForm?.description ?? '');
  const [deadlineAt, setDeadlineAt] = useState(toDateTimeLocal(initialForm?.deadlineAt));
  const [requiresChildContext, setRequiresChildContext] = useState(initialForm?.requiresChildContext ?? true);
  const [audienceType, setAudienceType] = useState<FormAudienceType>(initialForm?.audience[0]?.type ?? FormAudienceType.School);
  const [selectedTargetIds, setSelectedTargetIds] = useState<EntityId[]>(initialForm?.audience[0]?.targetIds ?? []);
  const [questionLabel, setQuestionLabel] = useState(initialForm?.questions[0]?.label ?? '');
  const [questionType, setQuestionType] = useState<FormQuestionType>(initialForm?.questions[0]?.type ?? FormQuestionType.Acknowledgement);
  const [questionRequired, setQuestionRequired] = useState(initialForm?.questions[0]?.required ?? true);
  const [localError, setLocalError] = useState<string | undefined>();

  if (existing && !existing.ok) {
    return <PermissionDenied title="Form unavailable" message={existing.error.message} />;
  }

  if (!currentSchool.ok || !currentUser.ok) {
    return <PermissionDenied title="Development identity unavailable" message="Current school or user context could not be loaded." />;
  }

  if (!formService.canCreate(userContext)) {
    return <PermissionDenied title="Forms unavailable" message="Your account cannot create forms." />;
  }

  if (initialForm && initialForm.status !== FormStatus.Draft) {
    return <PermissionDenied title="Form is read-only" message="Only draft forms can be edited in this phase." />;
  }

  const audienceOptions = buildFormAudienceOptions(identityService, userContext, currentSchool.value.id, audienceType);
  const questions = questionLabel.trim() ? [buildSingleQuestion(questionLabel, questionType, questionRequired)] : [];
  const input = {
    schoolId: currentSchool.value.id,
    title,
    description,
    authorUserId: currentUser.value.id,
    deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
    audience: selectedTargetIds.length > 0 ? [{ type: audienceType, targetIds: selectedTargetIds }] : [],
    requiresChildContext,
    questions,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = formId
      ? formService.updateDraft(userContext, formId, input)
      : formService.createDraft(userContext, input);

    onAction(result, formId ? 'Form draft updated.' : 'Form draft saved.');

    if (result.ok) {
      navigate(`/admin/forms/${result.value.id}`);
      return;
    }

    setLocalError(result.error.message);
  };

  return (
    <section className="panel">
      <PageHeader eyebrow="Form draft" title={formId ? 'Edit form' : 'Create form'}>
        Build a simple development reply slip before the full builder is introduced.
      </PageHeader>

      {localError ? <p className="notice notice-error">{localError}</p> : null}

      <form className="stacked-form" onSubmit={submit}>
        <section className="form-box" aria-labelledby="form-content-title">
          <h3 id="form-content-title">Content</h3>
          <label>
            <span>Title</span>
            <input onChange={(event) => setTitle(event.target.value)} required type="text" value={title} />
          </label>
          <label>
            <span>Description</span>
            <textarea onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
          </label>
          <label>
            <span>Deadline</span>
            <input min={new Date().toISOString().slice(0, 16)} onChange={(event) => setDeadlineAt(event.target.value)} type="datetime-local" value={deadlineAt} />
          </label>
        </section>

        <section className="form-box" aria-labelledby="form-audience-title">
          <h3 id="form-audience-title">Audience</h3>
          <label>
            <span>Audience type</span>
            <select
              onChange={(event) => {
                setAudienceType(event.target.value as FormAudienceType);
                setSelectedTargetIds([]);
              }}
              value={audienceType}
            >
              {Object.values(FormAudienceType).map((type) => (
                <option key={type} value={type}>{formatValue(type)}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input checked={requiresChildContext} onChange={(event) => setRequiresChildContext(event.target.checked)} type="checkbox" />
            Create one task per child
          </label>
          <div className="checkbox-grid" role="group" aria-label="Form audience targets">
            {audienceOptions.map((option) => (
              <label className="checkbox-label" key={option.id}>
                <input
                  checked={selectedTargetIds.includes(option.id)}
                  disabled={option.disabled}
                  onChange={(event) => {
                    setSelectedTargetIds((current) => event.target.checked
                      ? [...current, option.id]
                      : current.filter((id) => id !== option.id));
                  }}
                  type="checkbox"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="form-box" aria-labelledby="form-question-title">
          <h3 id="form-question-title">First question</h3>
          <label>
            <span>Question</span>
            <input onChange={(event) => setQuestionLabel(event.target.value)} type="text" value={questionLabel} />
          </label>
          <label>
            <span>Question type</span>
            <select onChange={(event) => setQuestionType(event.target.value as FormQuestionType)} value={questionType}>
              {Object.values(FormQuestionType).map((type) => (
                <option key={type} value={type}>{formatValue(type)}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input checked={questionRequired} onChange={(event) => setQuestionRequired(event.target.checked)} type="checkbox" />
            Required
          </label>
        </section>

        <div className="form-actions">
          <button type="submit">Save Draft</button>
          <Link to="/admin/forms">Cancel</Link>
        </div>
      </form>
    </section>
  );
}

function FormRecipientPreview({ detail, identityService }: {
  detail: FormDetail;
  identityService: IdentityService;
}) {
  if (detail.recipients.length === 0) {
    return null;
  }

  const identitySnapshot = identityService.getSnapshot();
  const usersById = userMap(identitySnapshot.users);

  return (
    <section className="form-box" aria-labelledby="form-recipient-title">
      <h3 id="form-recipient-title">Recipients</h3>
      <Table headers={['Recipient', 'Student context', 'Status']}>
        {detail.recipients.map((recipient) => {
          const student = recipient.studentId ? identitySnapshot.students.find((candidate) => candidate.id === recipient.studentId) : undefined;
          return (
            <tr key={recipient.id}>
              <td>{usersById.get(recipient.userId)?.displayName ?? recipient.userId}</td>
              <td>{student ? `${student.preferredName ?? student.firstName} ${student.lastName}` : '-'}</td>
              <td>{recipient.submittedAt ? 'Submitted' : 'Outstanding'}</td>
            </tr>
          );
        })}
      </Table>
    </section>
  );
}

function buildFormAudienceOptions(
  identityService: IdentityService,
  userContext: AuthenticatedUserContext,
  schoolId: EntityId,
  audienceType: FormAudienceType,
) {
  if (audienceType === FormAudienceType.School) {
    return [{ id: schoolId, label: 'Whole School', disabled: userContext.role === Role.Teacher }];
  }

  if (audienceType === FormAudienceType.YearGroup) {
    return identityService.getVisibleYearGroups(userContext).map((yearGroup) => ({
      id: yearGroup.id,
      label: yearGroup.name,
      disabled: userContext.role === Role.Teacher,
    }));
  }

  return identityService.getVisibleClasses(userContext).map((summary) => ({
    id: summary.class.id,
    label: summary.class.name,
    disabled: false,
  }));
}

function buildSingleQuestion(label: string, type: FormQuestionType, required: boolean): FormQuestion {
  const base = {
    id: 'question_development_1',
    type,
    label: label.trim(),
    required,
  };

  if ([FormQuestionType.SingleChoice, FormQuestionType.MultipleChoice].includes(type)) {
    return {
      ...base,
      options: [
        { id: 'option_yes', label: 'Yes' },
        { id: 'option_no', label: 'No' },
      ],
    };
  }

  return base;
}

function formatResponseSummary(summary: { delivered: number; submitted: number; completionRate: number }) {
  return summary.delivered === 0 ? '-' : `${summary.submitted} / ${summary.delivered} submitted (${summary.completionRate}%)`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toDateTimeLocal(value?: string) {
  if (!value) {
    return '';
  }

  return value.slice(0, 16);
}

function userMap(users: User[]) {
  return new Map(users.map((user) => [user.id, user]));
}

function studentLabel(identityService: IdentityService, userContext: AuthenticatedUserContext, studentId: EntityId) {
  const student = identityService.getStudentById(userContext, studentId);
  if (!student.ok) {
    return studentId;
  }

  return `${student.value.student.preferredName ?? student.value.student.firstName} ${student.value.student.lastName}`;
}

export function formRouteError(message: string): DomainResult<never> {
  return { ok: false, error: { code: DomainErrorCode.ValidationError, message } };
}
