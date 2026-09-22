import {
  DomainErrorCode,
  FormAudienceType,
  FormStatus,
  Permission,
  Role,
  type AuthenticatedUserContext,
  type DomainResult,
  type EntityId,
  type FormDefinition,
  type FormRecipient,
  type FormSubmission,
} from '@klassify/contracts';
import type { IdentitySnapshot } from '../identity/identityRepository';
import type { IdentityService } from '../identity/identityService';
import { isDefined } from '../identity/identityService';
import { FormAccessPolicy } from './FormAccessPolicy';
import { FormAudienceResolver } from './FormAudienceResolver';
import type { FormRepository } from './FormRepository';
import type {
  FormDefinitionInput,
  FormDefinitionUpdateInput,
  FormDetail,
  FormListFilter,
  FormListItem,
  FormRecipientResolution,
  FormResponses,
  FormResponseSummary,
  FormSubmissionInput,
  ParentFormTask,
} from './formTypes';
import { validateAnswers, validateQuestions } from './FormValidation';

export class FormService {
  constructor(
    private readonly repository: FormRepository,
    private readonly identityService: IdentityService,
    private readonly accessPolicy = new FormAccessPolicy(identityService),
    private readonly audienceResolver = new FormAudienceResolver(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  canCreate(userContext: AuthenticatedUserContext): boolean {
    if ([Role.SchoolOwner, Role.Principal, Role.SchoolAdmin].includes(userContext.role)) {
      return this.accessPolicy.canCreate(userContext, userContext.schoolId).ok;
    }

    return userContext.role === Role.Teacher;
  }

  createDraft(userContext: AuthenticatedUserContext, input: FormDefinitionInput): DomainResult<FormDefinition> {
    const access = this.canWriteDraftInput(userContext, input);
    if (!access.ok) {
      return access;
    }

    const validation = this.validateDraftShape(input);
    if (!validation.ok) {
      return validation;
    }

    const timestamp = this.nowTimestamp();
    const form: FormDefinition = {
      id: this.repository.nextId('form'),
      schoolId: input.schoolId,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      status: FormStatus.Draft,
      authorUserId: input.authorUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deadlineAt: input.deadlineAt,
      audience: cloneAudience(input.audience),
      requiresChildContext: input.requiresChildContext,
      questions: cloneQuestions(input.questions),
    };

    return { ok: true, value: this.repository.saveForm(form) };
  }

  updateDraft(
    userContext: AuthenticatedUserContext,
    formId: EntityId,
    input: FormDefinitionUpdateInput,
  ): DomainResult<FormDefinition> {
    const formResult = this.getEditableForm(userContext, formId);
    if (!formResult.ok) {
      return formResult;
    }

    const candidate: FormDefinition = {
      ...formResult.value,
      title: input.title === undefined ? formResult.value.title : input.title.trim(),
      description: input.description === undefined ? formResult.value.description : input.description.trim() || undefined,
      deadlineAt: input.deadlineAt === undefined ? formResult.value.deadlineAt : input.deadlineAt,
      audience: input.audience === undefined ? formResult.value.audience : cloneAudience(input.audience),
      requiresChildContext: input.requiresChildContext === undefined ? formResult.value.requiresChildContext : input.requiresChildContext,
      questions: input.questions === undefined ? formResult.value.questions : cloneQuestions(input.questions),
      updatedAt: this.nowTimestamp(),
    };

    const access = this.canWriteDraftInput(userContext, {
      schoolId: candidate.schoolId,
      title: candidate.title,
      description: candidate.description,
      authorUserId: candidate.authorUserId,
      deadlineAt: candidate.deadlineAt,
      audience: candidate.audience,
      requiresChildContext: candidate.requiresChildContext,
      questions: candidate.questions,
    });
    if (!access.ok) {
      return access;
    }

    const validation = this.validateDraftShape(candidate);
    if (!validation.ok) {
      return validation;
    }

    return { ok: true, value: this.repository.saveForm(candidate) };
  }

  previewRecipients(userContext: AuthenticatedUserContext, input: FormDefinitionInput): DomainResult<FormRecipientResolution> {
    const validation = this.validatePublishableInput(userContext, input);
    if (!validation.ok) {
      return validation;
    }

    return {
      ok: true,
      value: this.audienceResolver.resolve(this.getIdentitySnapshot(), input.schoolId, input.audience, input.requiresChildContext),
    };
  }

  publishForm(userContext: AuthenticatedUserContext, formId: EntityId): DomainResult<FormDefinition> {
    const formResult = this.findForm(formId);
    if (!formResult.ok) {
      return formResult;
    }

    const form = formResult.value;
    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canPublishForm(identitySnapshot, userContext, form);
    if (!access.ok) {
      return access;
    }

    const validation = this.validatePublishableForm(userContext, form);
    if (!validation.ok) {
      return validation;
    }

    const resolution = this.audienceResolver.resolve(identitySnapshot, form.schoolId, form.audience, form.requiresChildContext);
    if (resolution.taskCount === 0) {
      return failure(DomainErrorCode.ValidationError, 'Form must resolve to at least one recipient before publishing.');
    }

    const timestamp = this.nowTimestamp();
    const recipients = resolution.recipients.map((recipient) => ({
      id: this.repository.nextId('form_recipient'),
      formId: form.id,
      schoolId: form.schoolId,
      userId: recipient.userId,
      studentId: recipient.studentId,
      deliveredAt: timestamp,
      reminderRequestCount: 0,
    }));

    const published = this.repository.saveForm({
      ...form,
      status: FormStatus.Published,
      publishedAt: timestamp,
      updatedAt: timestamp,
    });
    this.repository.saveRecipients(form.id, recipients);

    return { ok: true, value: published };
  }

  closeForm(userContext: AuthenticatedUserContext, formId: EntityId): DomainResult<FormDefinition> {
    const formResult = this.findForm(formId);
    if (!formResult.ok) {
      return formResult;
    }

    const form = formResult.value;
    const access = this.accessPolicy.canCloseForm(this.getIdentitySnapshot(), userContext, form);
    if (!access.ok) {
      return access;
    }

    const timestamp = this.nowTimestamp();
    return {
      ok: true,
      value: this.repository.saveForm({ ...form, status: FormStatus.Closed, closedAt: timestamp, updatedAt: timestamp }),
    };
  }

  submitForm(userContext: AuthenticatedUserContext, input: FormSubmissionInput): DomainResult<FormSubmission> {
    const snapshot = this.repository.getSnapshot();
    const recipient = snapshot.recipients.find((candidate) => candidate.id === input.recipientId);
    if (!recipient) {
      return failure(DomainErrorCode.NotFound, 'Form recipient task was not found.');
    }

    const form = snapshot.forms.find((candidate) => candidate.id === recipient.formId);
    if (!form) {
      return failure(DomainErrorCode.NotFound, 'Form was not found.');
    }

    const access = this.accessPolicy.canSubmitRecipient(this.getIdentitySnapshot(), userContext, form, recipient);
    if (!access.ok) {
      return access;
    }

    const deadlineValidation = this.validateSubmissionDeadline(form);
    if (!deadlineValidation.ok) {
      return deadlineValidation;
    }

    if (recipient.submittedAt || snapshot.submissions.some((submission) => submission.recipientId === recipient.id)) {
      return failure(DomainErrorCode.ValidationError, 'This form task has already been submitted.');
    }

    const answersValidation = validateAnswers(form.questions, input.answers);
    if (!answersValidation.ok) {
      return answersValidation;
    }

    const timestamp = this.nowTimestamp();
    const submission = this.repository.saveSubmission({
      id: this.repository.nextId('form_submission'),
      formId: form.id,
      schoolId: form.schoolId,
      recipientId: recipient.id,
      submittedByUserId: userContext.userId,
      studentId: recipient.studentId,
      submittedAt: timestamp,
      answers: input.answers.map((answer) => ({ ...answer, value: cloneAnswerValue(answer.value) })),
    });
    this.repository.saveRecipient({ ...recipient, submittedAt: timestamp });

    return { ok: true, value: submission };
  }

  getVisibleForms(userContext: AuthenticatedUserContext, filter: FormListFilter = {}): FormListItem[] {
    const identitySnapshot = this.getIdentitySnapshot();
    return this.repository.getSnapshot().forms
      .filter((form) => form.schoolId === userContext.schoolId)
      .filter((form) => this.accessPolicy.canViewForm(identitySnapshot, userContext, form).ok)
      .filter((form) => !filter.status || form.status === filter.status)
      .filter((form) => !filter.audienceType || form.audience.some((audience) => audience.type === filter.audienceType))
      .filter((form) => !filter.authorUserId || form.authorUserId === filter.authorUserId)
      .filter((form) => {
        const query = filter.search?.trim().toLowerCase();
        return !query || form.title.toLowerCase().includes(query) || (form.description?.toLowerCase().includes(query) ?? false);
      })
      .map((form) => this.toListItem(identitySnapshot, form));
  }

  getFormById(userContext: AuthenticatedUserContext, formId: EntityId): DomainResult<FormDetail> {
    const formResult = this.findForm(formId);
    if (!formResult.ok) {
      return formResult;
    }

    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canViewForm(identitySnapshot, userContext, formResult.value);
    if (!access.ok) {
      return access;
    }

    return {
      ok: true,
      value: this.toListItem(identitySnapshot, formResult.value),
    };
  }

  getFormResponses(userContext: AuthenticatedUserContext, formId: EntityId): DomainResult<FormResponses> {
    const formResult = this.findForm(formId);
    if (!formResult.ok) {
      return formResult;
    }

    const identitySnapshot = this.getIdentitySnapshot();
    const access = this.accessPolicy.canViewResponses(identitySnapshot, userContext, formResult.value);
    if (!access.ok) {
      return access;
    }

    const snapshot = this.repository.getSnapshot();
    return {
      ok: true,
      value: {
        ...this.toListItem(identitySnapshot, formResult.value),
        recipients: snapshot.recipients.filter((recipient) => recipient.formId === formResult.value.id),
        submissions: snapshot.submissions.filter((submission) => submission.formId === formResult.value.id),
      },
    };
  }

  canViewResponses(userContext: AuthenticatedUserContext, form: FormDefinition): boolean {
    return this.accessPolicy.canViewResponses(this.getIdentitySnapshot(), userContext, form).ok;
  }

  getParentTasks(userContext: AuthenticatedUserContext): ParentFormTask[] {
    const identitySnapshot = this.getIdentitySnapshot();
    const snapshot = this.repository.getSnapshot();
    return snapshot.recipients
      .filter((recipient) => recipient.schoolId === userContext.schoolId && recipient.userId === userContext.userId)
      .map((recipient) => {
        const form = snapshot.forms.find((candidate) => candidate.id === recipient.formId && candidate.schoolId === userContext.schoolId);
        if (!form || ![FormStatus.Published, FormStatus.Closed].includes(form.status)) {
          return undefined;
        }

        const submission = snapshot.submissions.find((candidate) => candidate.recipientId === recipient.id);
        const student = recipient.studentId ? identitySnapshot.students.find((candidate) => candidate.id === recipient.studentId) : undefined;
        const activeEnrollment = recipient.studentId
          ? identitySnapshot.classEnrollments.find((enrollment) => enrollment.studentId === recipient.studentId)
          : undefined;
        const schoolClass = activeEnrollment ? identitySnapshot.classes.find((candidate) => candidate.id === activeEnrollment.classId) : undefined;

        return {
          form,
          recipient,
          submission,
          childLabel: student ? `${student.preferredName ?? student.firstName} ${student.lastName}` : undefined,
          classLabel: schoolClass?.name,
        };
      })
      .filter(isDefined);
  }

  requestReminder(userContext: AuthenticatedUserContext, recipientId: EntityId): DomainResult<FormRecipient> {
    const snapshot = this.repository.getSnapshot();
    const recipient = snapshot.recipients.find((candidate) => candidate.id === recipientId);
    if (!recipient) {
      return failure(DomainErrorCode.NotFound, 'Form recipient task was not found.');
    }

    const form = snapshot.forms.find((candidate) => candidate.id === recipient.formId);
    if (!form) {
      return failure(DomainErrorCode.NotFound, 'Form was not found.');
    }

    const access = this.accessPolicy.canRequestReminder(this.getIdentitySnapshot(), userContext, form);
    if (!access.ok) {
      return access;
    }

    if (recipient.submittedAt) {
      return failure(DomainErrorCode.ValidationError, 'Reminder requests are only available for outstanding recipients.');
    }

    const timestamp = this.nowTimestamp();
    return {
      ok: true,
      value: this.repository.saveRecipient({
        ...recipient,
        lastReminderRequestedAt: timestamp,
        reminderRequestCount: recipient.reminderRequestCount + 1,
      }),
    };
  }

  private getEditableForm(userContext: AuthenticatedUserContext, formId: EntityId): DomainResult<FormDefinition> {
    const formResult = this.findForm(formId);
    if (!formResult.ok) {
      return formResult;
    }

    const access = this.accessPolicy.canEditDraft(this.getIdentitySnapshot(), userContext, formResult.value);
    if (!access.ok) {
      return access;
    }

    return { ok: true, value: formResult.value };
  }

  private findForm(formId: EntityId): DomainResult<FormDefinition> {
    const form = this.repository.getSnapshot().forms.find((candidate) => candidate.id === formId);
    return form ? { ok: true, value: form } : failure(DomainErrorCode.NotFound, 'Form was not found.');
  }

  private canWriteDraftInput(userContext: AuthenticatedUserContext, input: FormDefinitionInput): DomainResult<true> {
    if (input.schoolId !== userContext.schoolId) {
      return failure(DomainErrorCode.PermissionDenied, 'Cross-school form access is not allowed.');
    }

    if (input.authorUserId !== userContext.userId) {
      return failure(DomainErrorCode.PermissionDenied, 'Forms must be authored by the current user.');
    }

    if ([Role.SchoolOwner, Role.Principal, Role.SchoolAdmin].includes(userContext.role)) {
      const createAccess = this.accessPolicy.canCreate(userContext, input.schoolId);
      if (!createAccess.ok) {
        return createAccess;
      }
    } else if (userContext.role !== Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'This role cannot create forms.');
    }

    if (input.audience.length > 0) {
      return this.accessPolicy.canTargetAudiences(this.getIdentitySnapshot(), userContext, input.schoolId, input.audience, Permission.FormsCreate);
    }

    if (userContext.role === Role.Teacher) {
      return failure(DomainErrorCode.PermissionDenied, 'Teachers must choose an assigned class audience before saving a form.');
    }

    return { ok: true, value: true };
  }

  private validateDraftShape(input: FormDefinitionInput | FormDefinition): DomainResult<true> {
    if (!input.title.trim()) {
      return failure(DomainErrorCode.ValidationError, 'Form title is required.');
    }

    const author = this.getIdentitySnapshot().users.find((user) => user.id === input.authorUserId);
    if (!author || author.schoolId !== input.schoolId) {
      return failure(DomainErrorCode.InvalidRelationship, 'Form author must belong to the form school.');
    }

    return validateQuestions(input.questions);
  }

  private validatePublishableInput(userContext: AuthenticatedUserContext, input: FormDefinitionInput): DomainResult<true> {
    const draftValidation = this.validateDraftShape(input);
    if (!draftValidation.ok) {
      return draftValidation;
    }

    if (input.audience.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'At least one audience is required before publishing.');
    }

    if (input.questions.length === 0) {
      return failure(DomainErrorCode.ValidationError, 'At least one question is required before publishing.');
    }

    if (input.deadlineAt) {
      const deadline = Date.parse(input.deadlineAt);
      if (Number.isNaN(deadline) || deadline <= this.now().getTime()) {
        return failure(DomainErrorCode.ValidationError, 'Deadline must be a future ISO 8601 timestamp.');
      }
    }

    const access = this.accessPolicy.canTargetAudiences(this.getIdentitySnapshot(), userContext, input.schoolId, input.audience, Permission.FormsPublish);
    if (!access.ok) {
      return access;
    }

    return { ok: true, value: true };
  }

  private validatePublishableForm(userContext: AuthenticatedUserContext, form: FormDefinition): DomainResult<true> {
    return this.validatePublishableInput(userContext, {
      schoolId: form.schoolId,
      title: form.title,
      description: form.description,
      authorUserId: form.authorUserId,
      deadlineAt: form.deadlineAt,
      audience: form.audience,
      requiresChildContext: form.requiresChildContext,
      questions: form.questions,
    });
  }

  private toListItem(identitySnapshot: IdentitySnapshot, form: FormDefinition): FormListItem {
    return {
      form,
      author: identitySnapshot.users.find((user) => user.id === form.authorUserId),
      audienceLabel: formatFormAudienceLabel(identitySnapshot, form),
      responseSummary: summarizeFormResponses(this.repository.getSnapshot().recipients.filter((recipient) => recipient.formId === form.id)),
    };
  }

  private getIdentitySnapshot(): IdentitySnapshot {
    return this.identityService.getSnapshot();
  }

  private validateSubmissionDeadline(form: FormDefinition): DomainResult<true> {
    if (!form.deadlineAt) {
      return { ok: true, value: true };
    }

    const deadline = Date.parse(form.deadlineAt);
    if (Number.isNaN(deadline)) {
      return failure(DomainErrorCode.ValidationError, 'Form deadline is not a valid ISO 8601 timestamp.');
    }

    if (deadline <= this.now().getTime()) {
      return failure(DomainErrorCode.ValidationError, 'The deadline for this form has passed.');
    }

    return { ok: true, value: true };
  }

  private nowTimestamp(): string {
    return this.now().toISOString();
  }
}

export function summarizeFormResponses(recipients: FormRecipient[]): FormResponseSummary {
  const delivered = recipients.length;
  const submitted = recipients.filter((recipient) => recipient.submittedAt).length;
  const outstanding = delivered - submitted;
  return {
    delivered,
    submitted,
    outstanding,
    completionRate: delivered === 0 ? 0 : Number(((submitted / delivered) * 100).toFixed(1)),
  };
}

export function formatFormAudienceLabel(identitySnapshot: IdentitySnapshot, form: FormDefinition): string {
  return form.audience.map((audience) => {
    if (audience.type === FormAudienceType.School) {
      return 'Whole School';
    }

    if (audience.type === FormAudienceType.YearGroup) {
      return audience.targetIds
        .map((id) => identitySnapshot.yearGroups.find((yearGroup) => yearGroup.id === id)?.name ?? id)
        .join(', ');
    }

    return audience.targetIds
      .map((id) => identitySnapshot.classes.find((schoolClass) => schoolClass.id === id)?.name ?? id)
      .join(', ');
  }).join(' + ');
}

export function canRoleUseForms(role: Role): boolean {
  return [Role.SchoolOwner, Role.Principal, Role.SchoolAdmin, Role.Teacher].includes(role);
}

function cloneAudience(audience: FormDefinition['audience']): FormDefinition['audience'] {
  return audience.map((entry) => ({ ...entry, targetIds: [...entry.targetIds] }));
}

function cloneQuestions(questions: FormDefinition['questions']): FormDefinition['questions'] {
  return questions.map((question) => ({
    ...question,
    options: question.options?.map((option) => ({ ...option })),
  }));
}

function cloneAnswerValue(value: FormSubmission['answers'][number]['value']) {
  if (value.type === 'selected_options') {
    return { ...value, optionIds: [...value.optionIds] };
  }

  return { ...value };
}

function failure<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}