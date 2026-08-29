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
import { DevelopmentFormRepository } from './DevelopmentFormRepository';
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