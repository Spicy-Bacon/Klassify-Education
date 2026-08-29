import {
  FormAudienceType,
  FormQuestionType,
  FormStatus,
  type EntityId,
  type FormDefinition,
  type FormRecipient,
  type FormSubmission,
} from '@ai-school-platform/contracts';
import { developmentIdentityIds } from '../identity/developmentIdentityRepository';
import type { FormRepository } from './FormRepository';
import type { FormSnapshot } from './formTypes';

const createdAt = '2026-08-29T01:00:00.000Z';

export const developmentFormIds = {
  museumTrip: 'form_museum_trip_consent',
  emergencyContact: 'form_emergency_contact_confirmation',
  parentFeedback: 'form_parent_feedback_survey',
};

export class DevelopmentFormRepository implements FormRepository {
  private idCounter = 0;

  private readonly forms: FormDefinition[] = [
    {
      id: developmentFormIds.museumTrip,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Museum Trip Consent',
      description: 'Development reply slip for the Class 3A museum trip.',
      status: FormStatus.Published,
      authorUserId: developmentIdentityIds.teacher3A,
      createdAt,
      updatedAt: '2026-08-29T02:00:00.000Z',
      publishedAt: '2026-08-29T02:00:00.000Z',
      deadlineAt: '2026-09-12T15:00:00.000Z',
      audience: [{ type: FormAudienceType.Class, targetIds: [developmentIdentityIds.class3A] }],
      requiresChildContext: true,
      questions: [
        {
          id: 'question_museum_consent',
          type: FormQuestionType.Consent,
          label: 'I give permission for my child to attend the museum trip.',
          required: true,
        },
        {
          id: 'question_museum_notes',
          type: FormQuestionType.ShortText,
          label: 'Optional pickup note',
          required: false,
        },
      ],
    },
    {
      id: developmentFormIds.emergencyContact,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Emergency Contact Confirmation',
      description: 'Confirm that school contact details should be reviewed.',
      status: FormStatus.Published,
      authorUserId: developmentIdentityIds.admin,
      createdAt: '2026-08-29T03:00:00.000Z',
      updatedAt: '2026-08-29T04:00:00.000Z',
      publishedAt: '2026-08-29T04:00:00.000Z',
      audience: [{ type: FormAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
      requiresChildContext: false,
      questions: [
        {
          id: 'question_emergency_ack',
          type: FormQuestionType.Acknowledgement,
          label: 'I acknowledge that I should review my family contact details.',
          required: true,
        },
      ],
    },
    {
      id: developmentFormIds.parentFeedback,
      schoolId: developmentIdentityIds.demoSchool,
      title: 'Parent Feedback Survey',
      description: 'Short development survey for school communication feedback.',
      status: FormStatus.Draft,
      authorUserId: developmentIdentityIds.principal,
      createdAt: '2026-08-29T05:00:00.000Z',
      updatedAt: '2026-08-29T05:00:00.000Z',
      audience: [{ type: FormAudienceType.School, targetIds: [developmentIdentityIds.demoSchool] }],
      requiresChildContext: false,
      questions: [
        {
          id: 'question_feedback_rating',
          type: FormQuestionType.SingleChoice,
          label: 'How clear are school communications?',
          required: true,
          options: [
            { id: 'rating_clear', label: 'Clear' },
            { id: 'rating_ok', label: 'Mostly clear' },
            { id: 'rating_unclear', label: 'Needs improvement' },
          ],
        },
      ],
    },
  ];

  private readonly recipients: FormRecipient[] = [
    this.recipient('form_recipient_museum_amy_chloe', developmentFormIds.museumTrip, developmentIdentityIds.demoSchool, developmentIdentityIds.parentAmy, '2026-08-29T02:00:01.000Z', developmentIdentityIds.studentChloe),
    this.recipient('form_recipient_museum_ben_chloe', developmentFormIds.museumTrip, developmentIdentityIds.demoSchool, developmentIdentityIds.parentBen, '2026-08-29T02:00:01.000Z', developmentIdentityIds.studentChloe, '2026-08-29T05:00:00.000Z'),
    this.recipient('form_recipient_emergency_amy', developmentFormIds.emergencyContact, developmentIdentityIds.demoSchool, developmentIdentityIds.parentAmy, '2026-08-29T04:00:01.000Z'),
    this.recipient('form_recipient_emergency_ben', developmentFormIds.emergencyContact, developmentIdentityIds.demoSchool, developmentIdentityIds.parentBen, '2026-08-29T04:00:01.000Z', undefined, '2026-08-29T04:30:00.000Z'),
  ];

  private readonly submissions: FormSubmission[] = [
    {
      id: 'form_submission_museum_ben_chloe',
      formId: developmentFormIds.museumTrip,
      schoolId: developmentIdentityIds.demoSchool,
      recipientId: 'form_recipient_museum_ben_chloe',
      submittedByUserId: developmentIdentityIds.parentBen,
      studentId: developmentIdentityIds.studentChloe,
      submittedAt: '2026-08-29T05:00:00.000Z',
      answers: [
        { questionId: 'question_museum_consent', value: { type: 'boolean', value: true } },
      ],
    },
    {
      id: 'form_submission_emergency_ben',
      formId: developmentFormIds.emergencyContact,
      schoolId: developmentIdentityIds.demoSchool,
      recipientId: 'form_recipient_emergency_ben',
      submittedByUserId: developmentIdentityIds.parentBen,
      submittedAt: '2026-08-29T04:30:00.000Z',
      answers: [
        { questionId: 'question_emergency_ack', value: { type: 'boolean', value: true } },
      ],
    },
  ];

  getSnapshot(): FormSnapshot {
    return {
      forms: this.forms.map(cloneForm),
      recipients: this.recipients.map((recipient) => ({ ...recipient })),
      submissions: this.submissions.map(cloneSubmission),
    };
  }

  saveForm(form: FormDefinition): FormDefinition {
    const existingIndex = this.forms.findIndex((candidate) => candidate.id === form.id);
    const stored = cloneForm(form);

    if (existingIndex >= 0) {
      this.forms[existingIndex] = stored;
      return cloneForm(stored);
    }

    this.forms.push(stored);
    return cloneForm(stored);
  }

  saveRecipients(formId: EntityId, recipients: FormRecipient[]): FormRecipient[] {
    const remaining = this.recipients.filter((recipient) => recipient.formId !== formId);
    this.recipients.length = 0;
    this.recipients.push(...remaining, ...recipients.map((recipient) => ({ ...recipient })));
    return recipients.map((recipient) => ({ ...recipient }));
  }

  saveRecipient(recipient: FormRecipient): FormRecipient {
    const existingIndex = this.recipients.findIndex((candidate) => candidate.id === recipient.id);
    const stored = { ...recipient };

    if (existingIndex >= 0) {
      this.recipients[existingIndex] = stored;
      return { ...stored };
    }

    this.recipients.push(stored);
    return { ...stored };
  }

  saveSubmission(submission: FormSubmission): FormSubmission {
    const existingIndex = this.submissions.findIndex((candidate) => candidate.id === submission.id);
    const stored = cloneSubmission(submission);

    if (existingIndex >= 0) {
      this.submissions[existingIndex] = stored;
      return cloneSubmission(stored);
    }

    this.submissions.push(stored);
    return cloneSubmission(stored);
  }

  nextId(prefix: string): EntityId {
    this.idCounter += 1;
    return `${prefix}_${this.idCounter.toString().padStart(4, '0')}`;
  }

  private recipient(
    id: EntityId,
    formId: EntityId,
    schoolId: EntityId,
    userId: EntityId,
    deliveredAt: string,
    studentId?: EntityId,
    submittedAt?: string,
  ): FormRecipient {
    return { id, formId, schoolId, userId, studentId, deliveredAt, submittedAt, reminderRequestCount: 0 };
  }
}

function cloneForm(form: FormDefinition): FormDefinition {
  return {
    ...form,
    audience: form.audience.map((audience) => ({ ...audience, targetIds: [...audience.targetIds] })),
    questions: form.questions.map((question) => ({
      ...question,
      options: question.options?.map((option) => ({ ...option })),
    })),
  };
}

function cloneSubmission(submission: FormSubmission): FormSubmission {
  return {
    ...submission,
    answers: submission.answers.map((answer) => {
      if (answer.value.type === 'selected_options') {
        return { ...answer, value: { ...answer.value, optionIds: [...answer.value.optionIds] } };
      }

      return { ...answer, value: { ...answer.value } };
    }),
  };
}