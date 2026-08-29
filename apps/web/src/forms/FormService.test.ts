import { describe, expect, it } from 'vitest';
import {
  DomainErrorCode,
  FormAudienceType,
  FormQuestionType,
  FormStatus,
  type AuthenticatedUserContext,
  type FormDefinition,
  type FormQuestion,
} from '@ai-school-platform/contracts';
import { DevelopmentIdentityRepository, developmentIdentityIds } from '../identity/developmentIdentityRepository';
import { IdentityService } from '../identity/identityService';
import { DevelopmentFormRepository, developmentFormIds } from './DevelopmentFormRepository';
import { FormService } from './FormService';

const futureDeadline = '2099-09-12T15:00:00.000Z';

describe('FormService', () => {
  it('allows an administrator to create a valid draft', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.createDraft(context, baseInput(context));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe(FormStatus.Draft);
      expect(result.value.title).toBe('Museum Trip Consent');
    }
  });

  it('allows a teacher to create a form for an assigned class', () => {
    const { service, context } = setup(developmentIdentityIds.teacher3A);

    const result = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
    }));

    expect(result.ok).toBe(true);
  });

  it('rejects a teacher targeting an unassigned class', () => {
    const { service, context } = setup(developmentIdentityIds.teacher3A);

    const result = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.PermissionDenied);
    }
  });

  it('rejects a teacher targeting the whole school', () => {
    const { service, context } = setup(developmentIdentityIds.teacher3A);

    const result = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.PermissionDenied);
    }
  });

  it('rejects parent form creation', () => {
    const { service, context } = setup(developmentIdentityIds.parentAmy);

    const result = service.createDraft(context, baseInput(context));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.PermissionDenied);
    }
  });

  it('rejects student form creation', () => {
    const { service, context } = setup(developmentIdentityIds.studentChloeUser);

    const result = service.createDraft(context, baseInput(context));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.PermissionDenied);
    }
  });

  it('rejects cross-school class targets', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.otherClass] }],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.InvalidRelationship);
    }
  });

  it('rejects cross-school year group targets', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.YearGroup, targetIds: ['year_other'] }],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.InvalidRelationship);
    }
  });

  it('rejects empty forms for publication', () => {
    const { service, context } = setup(developmentIdentityIds.admin);
    const draft = service.createDraft(context, baseInput(context, { questions: [] }));

    expect(draft.ok).toBe(true);
    const result = service.publishForm(context, (draft as { ok: true; value: FormDefinition }).value.id);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });

  it('rejects choice questions without options', () => {
    const { service, context } = setup(developmentIdentityIds.admin);
    const result = service.createDraft(context, baseInput(context, {
      questions: [{ id: 'question_transport', type: FormQuestionType.SingleChoice, label: 'Transport option', required: true }],
    }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });

  it('deduplicates recipients across overlapping audiences', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.previewRecipients(context, baseInput(context, {
      requiresChildContext: false,
      audience: [
        { type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] },
        { type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] },
      ],
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.taskCount).toBe(2);
      expect(result.value.parentGuardianCount).toBe(2);
    }
  });

  it('resolves class audience to linked guardians', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.previewRecipients(context, baseInput(context, {
      requiresChildContext: true,
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recipients).toEqual(expect.arrayContaining([
        { userId: developmentIdentityIds.parentAmy, studentId: developmentIdentityIds.studentChloe },
        { userId: developmentIdentityIds.parentBen, studentId: developmentIdentityIds.studentChloe },
      ]));
      expect(result.value.taskCount).toBe(2);
    }
  });

  it('preserves child context for multi-child households', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    const result = service.previewRecipients(context, baseInput(context, {
      requiresChildContext: true,
      audience: [{ type: FormAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const amyTasks = result.value.recipients.filter((recipient) => recipient.userId === developmentIdentityIds.parentAmy);
      expect(amyTasks.map((task) => task.studentId).sort()).toEqual([
        developmentIdentityIds.studentChloe,
        developmentIdentityIds.studentEthan,
      ].sort());
    }
  });

  it('rejects publication when the resolved recipient set is empty', () => {
    const { service, context } = setup(developmentIdentityIds.admin);
    const draft = service.createDraft(context, baseInput(context, {
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3B] }],
      requiresChildContext: true,
    }));

    expect(draft.ok).toBe(true);
    const result = service.publishForm(context, (draft as { ok: true; value: FormDefinition }).value.id);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });
  it('lists all demo-school forms for a school administrator', () => {
    const { service, context } = setup(developmentIdentityIds.admin);

    expect(service.getVisibleForms(context).map((item) => item.form.id).sort()).toEqual([
      developmentFormIds.emergencyContact,
      developmentFormIds.museumTrip,
      developmentFormIds.parentFeedback,
    ].sort());
  });

  it('limits teacher form administration to authored or assigned-class forms', () => {
    const { service, context } = setup(developmentIdentityIds.teacher3A);

    expect(service.getVisibleForms(context).map((item) => item.form.id)).toEqual([
      developmentFormIds.museumTrip,
    ]);
  });

  it('does not expose admin form lists to parent or student roles', () => {
    const parentSetup = setup(developmentIdentityIds.parentAmy);
    const studentSetup = setup(developmentIdentityIds.studentChloeUser);

    expect(parentSetup.service.getVisibleForms(parentSetup.context)).toEqual([]);
    expect(studentSetup.service.getVisibleForms(studentSetup.context)).toEqual([]);
  });
  it('publishes a draft and generates response tracking recipients', () => {
    const { service, context } = setup(developmentIdentityIds.admin);
    const draft = service.createDraft(context, baseInput(context));

    expect(draft.ok).toBe(true);
    const published = service.publishForm(context, (draft as { ok: true; value: FormDefinition }).value.id);

    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.value.status).toBe(FormStatus.Published);
      const detail = service.getFormById(context, published.value.id);
      expect(detail.ok).toBe(true);
      if (detail.ok) {
        expect(detail.value.responseSummary.delivered).toBe(2);
        expect(detail.value.responseSummary.submitted).toBe(0);
        expect(detail.value.recipients.map((recipient) => recipient.userId).sort()).toEqual([
          developmentIdentityIds.parentAmy,
          developmentIdentityIds.parentBen,
        ].sort());
      }
    }
  });

  it('allows a parent to submit an assigned child-specific form task', () => {
    const { service, context } = setup(developmentIdentityIds.parentAmy);
    const task = service.getParentTasks(context).find((candidate) => candidate.form.id === developmentFormIds.museumTrip);

    expect(task).toBeDefined();
    const result = service.submitForm(context, {
      recipientId: task?.recipient.id ?? '',
      submittedByUserId: context.userId,
      answers: [
        { questionId: 'question_museum_consent', value: { type: 'boolean', value: true } },
      ],
    });

    expect(result.ok).toBe(true);
    const updatedTask = service.getParentTasks(context).find((candidate) => candidate.recipient.id === task?.recipient.id);
    expect(updatedTask?.submission?.submittedByUserId).toBe(context.userId);
  });

  it('rejects duplicate submissions for the same recipient task', () => {
    const { service, context } = setup(developmentIdentityIds.parentAmy);
    const task = service.getParentTasks(context).find((candidate) => candidate.form.id === developmentFormIds.museumTrip);
    const submission = {
      recipientId: task?.recipient.id ?? '',
      submittedByUserId: context.userId,
      answers: [
        { questionId: 'question_museum_consent', value: { type: 'boolean' as const, value: true } },
      ],
    };

    expect(service.submitForm(context, submission).ok).toBe(true);
    const duplicate = service.submitForm(context, submission);

    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });

  it('rejects a parent submitting another guardian recipient task', () => {
    const { service, context: adminContext } = setup(developmentIdentityIds.admin);
    const parentContext = setup(developmentIdentityIds.parentAmy).context;
    const detail = service.getFormById(adminContext, developmentFormIds.museumTrip);

    expect(detail.ok).toBe(true);
    const benRecipient = detail.ok ? detail.value.recipients.find((recipient) => recipient.userId === developmentIdentityIds.parentBen) : undefined;
    const result = service.submitForm(parentContext, {
      recipientId: benRecipient?.id ?? '',
      submittedByUserId: parentContext.userId,
      answers: [
        { questionId: 'question_museum_consent', value: { type: 'boolean', value: true } },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.PermissionDenied);
    }
  });

  it('records reminder requests only for outstanding recipients', () => {
    const { service, context } = setup(developmentIdentityIds.admin);
    const detail = service.getFormById(context, developmentFormIds.museumTrip);

    expect(detail.ok).toBe(true);
    const amyRecipient = detail.ok ? detail.value.recipients.find((recipient) => recipient.userId === developmentIdentityIds.parentAmy) : undefined;
    const benRecipient = detail.ok ? detail.value.recipients.find((recipient) => recipient.userId === developmentIdentityIds.parentBen) : undefined;

    const reminder = service.requestReminder(context, amyRecipient?.id ?? '');
    expect(reminder.ok).toBe(true);
    if (reminder.ok) {
      expect(reminder.value.reminderRequestCount).toBe(1);
      expect(reminder.value.lastReminderRequestedAt).toBeDefined();
    }

    const submittedReminder = service.requestReminder(context, benRecipient?.id ?? '');
    expect(submittedReminder.ok).toBe(false);
    if (!submittedReminder.ok) {
      expect(submittedReminder.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });

  it('does not accept submissions after a form is closed', () => {
    const adminSetup = setup(developmentIdentityIds.admin);
    const parentContext = adminSetup.identityService.createUserContext(developmentIdentityIds.parentAmy);

    expect(parentContext.ok).toBe(true);
    const closeResult = adminSetup.service.closeForm(adminSetup.context, developmentFormIds.museumTrip);
    expect(closeResult.ok).toBe(true);

    const task = parentContext.ok
      ? adminSetup.service.getParentTasks(parentContext.value).find((candidate) => candidate.form.id === developmentFormIds.museumTrip)
      : undefined;
    const result = parentContext.ok ? adminSetup.service.submitForm(parentContext.value, {
      recipientId: task?.recipient.id ?? '',
      submittedByUserId: parentContext.value.userId,
      answers: [
        { questionId: 'question_museum_consent', value: { type: 'boolean', value: true } },
      ],
    }) : undefined;

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.ValidationError);
    }
  });
});

function setup(userId: string) {
  const identityRepository = new DevelopmentIdentityRepository();
  const identityService = new IdentityService(identityRepository);
  const service = new FormService(new DevelopmentFormRepository(), identityService);
  const context = identityService.createUserContext(userId);

  if (!context.ok) {
    throw new Error(context.error.message);
  }

  return { service, identityService, context: context.value };
}

function baseInput(context: AuthenticatedUserContext, overrides: Partial<Parameters<FormService['createDraft']>[1]> = {}) {
  return {
    schoolId: context.schoolId,
    title: 'Museum Trip Consent',
    description: 'Development form fixture.',
    authorUserId: context.userId,
    deadlineAt: futureDeadline,
    audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
    requiresChildContext: true,
    questions: [consentQuestion()],
    ...overrides,
  };
}

function consentQuestion(): FormQuestion {
  return {
    id: 'question_consent',
    type: FormQuestionType.Consent,
    label: 'I give permission for my child to attend.',
    required: true,
  };
}
